/**
 * API Route: POST /api/geo-grid/geocode
 *
 * Geocodes an address or place name to get latitude/longitude coordinates.
 * Also supports:
 * - Reverse geocoding (lat/lng to Place ID)
 * - Business search (find GBP listing by name near coordinates)
 * Uses Google Maps Geocoding and Places APIs.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { getRequestAccountId } from '@/app/(app)/api/utils/getRequestAccountId';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accountId = await getRequestAccountId(request, user.id, supabase);
    if (!accountId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const body = await request.json();
    const { address, placeId, lat, lng, businessName, searchBusiness } = body;

    // Business search: Find the actual GBP listing using Places API
    // This is the best way to get the correct Place ID for rank tracking
    if (searchBusiness && businessName && GOOGLE_MAPS_API_KEY) {
      // Try Places API (New) first - it's more reliable
      try {
        const placesNewResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
            'X-Goog-FieldMask': 'places.displayName,places.id,places.formattedAddress,places.location,places.rating,places.userRatingCount',
          },
          body: JSON.stringify({
            textQuery: businessName,
            ...(lat && lng ? {
              locationBias: {
                circle: {
                  center: { latitude: lat, longitude: lng },
                  radius: 50000.0,
                },
              },
            } : {}),
          }),
        });

        const placesNewData = await placesNewResponse.json();

        if (placesNewData.places?.length > 0) {
          const place = placesNewData.places[0];
          return NextResponse.json({
            success: true,
            businessName: place.displayName?.text,
            placeId: place.id,
            coordinates: {
              lat: place.location?.latitude,
              lng: place.location?.longitude,
            },
            formattedAddress: place.formattedAddress,
            rating: place.rating,
            reviewCount: place.userRatingCount,
            source: 'google_places_new',
            otherResults: placesNewData.places.slice(1, 5).map((p: any) => ({
              name: p.displayName?.text,
              placeId: p.id,
              address: p.formattedAddress,
              rating: p.rating,
              reviewCount: p.userRatingCount,
            })),
          });
        }
      } catch (err) {
        console.log('Places API (New) not available, trying legacy API...');
      }

      // Fallback to legacy Text Search API
      const textSearchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      textSearchUrl.searchParams.set('query', businessName);
      textSearchUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);

      if (lat && lng) {
        textSearchUrl.searchParams.set('location', `${lat},${lng}`);
        textSearchUrl.searchParams.set('radius', '50000');
      }

      const response = await fetch(textSearchUrl.toString());
      const data = await response.json();

      if (data.status === 'OK' && data.results?.length > 0) {
        const result = data.results[0];
        return NextResponse.json({
          success: true,
          businessName: result.name,
          placeId: result.place_id,
          coordinates: {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          },
          formattedAddress: result.formatted_address,
          rating: result.rating,
          reviewCount: result.user_ratings_total,
          source: 'google_places_text_search',
          otherResults: data.results.slice(1, 5).map((r: any) => ({
            name: r.name,
            placeId: r.place_id,
            address: r.formatted_address,
            rating: r.rating,
            reviewCount: r.user_ratings_total,
          })),
        });
      }

      // If legacy API also fails, try Find Place API (may have different enablement)
      const findPlaceUrl = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json');
      findPlaceUrl.searchParams.set('input', businessName);
      findPlaceUrl.searchParams.set('inputtype', 'textquery');
      findPlaceUrl.searchParams.set('fields', 'place_id,name,formatted_address,geometry,rating,user_ratings_total');
      findPlaceUrl.searchParams.set('key', GOOGLE_MAPS_API_KEY);

      if (lat && lng) {
        findPlaceUrl.searchParams.set('locationbias', `circle:50000@${lat},${lng}`);
      }

      const findPlaceResponse = await fetch(findPlaceUrl.toString());
      const findPlaceData = await findPlaceResponse.json();

      if (findPlaceData.status === 'OK' && findPlaceData.candidates?.length > 0) {
        const candidate = findPlaceData.candidates[0];
        return NextResponse.json({
          success: true,
          businessName: candidate.name,
          placeId: candidate.place_id,
          coordinates: {
            lat: candidate.geometry?.location?.lat,
            lng: candidate.geometry?.location?.lng,
          },
          formattedAddress: candidate.formatted_address,
          rating: candidate.rating,
          reviewCount: candidate.user_ratings_total,
          source: 'google_find_place',
          otherResults: findPlaceData.candidates.slice(1, 5).map((c: any) => ({
            name: c.name,
            placeId: c.place_id,
            address: c.formatted_address,
            rating: c.rating,
            reviewCount: c.user_ratings_total,
          })),
        });
      }

      // All APIs failed - provide helpful error
      const apiErrors = [data.status, findPlaceData.status].filter(s => s && s !== 'ZERO_RESULTS');
      return NextResponse.json({
        success: false,
        error: 'Could not find your business listing.',
        hint: apiErrors.includes('REQUEST_DENIED')
          ? 'Please enable the Places API in your Google Cloud Console: https://console.cloud.google.com/apis/library/places-backend.googleapis.com'
          : 'Make sure your Google Business Profile is set up and visible. Try searching for your exact business name as it appears on Google.',
        debugInfo: { textSearchStatus: data.status, findPlaceStatus: findPlaceData.status },
      });
    }

    // Reverse geocoding: get Place ID from coordinates (fallback, less accurate for businesses)
    if (lat !== undefined && lng !== undefined && !searchBusiness && GOOGLE_MAPS_API_KEY) {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results?.[0]?.place_id) {
        const result = data.results[0];
        return NextResponse.json({
          success: true,
          coordinates: { lat, lng },
          placeId: result.place_id,
          formattedAddress: result.formatted_address,
          source: 'google_reverse_geocoding',
          warning: 'This Place ID is for a street address, not a business listing. For accurate rank tracking, use the business search option.',
        });
      }

      return NextResponse.json({
        success: false,
        error: 'Could not find Place ID for these coordinates.',
      });
    }

    if (!address && !placeId) {
      return NextResponse.json(
        { error: 'Either address, placeId, or lat/lng coordinates are required' },
        { status: 400 }
      );
    }

    // If we have a Google Maps API key, use Google Geocoding
    if (GOOGLE_MAPS_API_KEY) {
      let url: string;

      if (placeId) {
        console.log('Fetching coordinates for Place ID:', placeId);

        // Try Places API (New) first - it's more reliable and modern
        try {
          const placesNewResponse = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
            method: 'GET',
            headers: {
              'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY,
              'X-Goog-FieldMask': 'location',
            },
          });

          const placesNewData = await placesNewResponse.json();
          console.log('Places API (New) full response:', JSON.stringify(placesNewData));

          if (placesNewData.location) {
            return NextResponse.json({
              success: true,
              coordinates: {
                lat: placesNewData.location.latitude,
                lng: placesNewData.location.longitude,
              },
              source: 'google_places_new',
            });
          }

          // If Places API (New) returned an error, log it
          if (placesNewData.error) {
            console.error('Places API (New) error:', placesNewData.error);
          }
        } catch (err) {
          console.log('Places API (New) failed, trying legacy API...', err);
        }

        // Fallback to legacy Place Details API
        url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();
        console.log('Place Details API (Legacy) response:', { status: data.status, hasLocation: !!data.result?.geometry?.location });

        if (data.status === 'OK' && data.result?.geometry?.location) {
          return NextResponse.json({
            success: true,
            coordinates: {
              lat: data.result.geometry.location.lat,
              lng: data.result.geometry.location.lng,
            },
            source: 'google_places_legacy',
          });
        }

        // Both APIs failed - return error with status
        console.error('Place Details API error:', data.status, data.error_message);
        return NextResponse.json({
          success: false,
          error: `Could not fetch coordinates for Place ID: ${data.status}`,
          hint: data.error_message || 'The Place ID may be invalid or the Places API may not be enabled in your Google Cloud project.',
        });
      }

      // Fall back to Geocoding API for address
      if (address) {
        url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results?.[0]?.geometry?.location) {
          const result = data.results[0];
          const location = result.geometry.location;
          return NextResponse.json({
            success: true,
            coordinates: {
              lat: location.lat,
              lng: location.lng,
            },
            placeId: result.place_id, // Include Google Place ID for geo-grid tracking
            formattedAddress: result.formatted_address,
            source: 'google_geocoding',
          });
        }

        if (data.status === 'ZERO_RESULTS') {
          return NextResponse.json({
            success: false,
            error: 'Could not find coordinates for this address.',
            hint: 'If you hide your business address on Google, you\'ll need to enter coordinates manually. Right-click your location on Google Maps and click the coordinates to copy them.',
          });
        }

        return NextResponse.json({
          success: false,
          error: `Geocoding failed: ${data.status}`,
        });
      }
    }

    // No API key available
    return NextResponse.json({
      success: false,
      error: 'Geocoding service not configured. Please enter coordinates manually.',
      hint: 'Add GOOGLE_MAPS_API_KEY to environment variables to enable automatic geocoding.',
    });

  } catch (error) {
    console.error('Geocode API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
