/**
 * Seed DataForSEO Locations for Rank Tracking
 *
 * Fetches location codes from DataForSEO API and populates rank_locations table.
 * This enables the location picker in rank tracking feature.
 *
 * Run with: npx ts-node scripts/seed-rank-locations.ts
 *
 * Requirements:
 * - DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD in .env.local
 * - DATABASE_URL in .env.local
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

// ============================================
// Configuration
// ============================================

const DATAFORSEO_API_BASE = 'https://api.dataforseo.com/v3';
const LOCATIONS_ENDPOINT = '/serp/google/locations';

// Filter to US and Canada locations
const COUNTRY_FILTER = ['US', 'CA'];

// ============================================
// Types
// ============================================

interface DataForSEOLocation {
  location_code: number;
  location_name: string;
  location_code_parent: number | null;
  country_iso_code: string;
  location_type: string;

  // Constructed in script
  canonical_name?: string;
}

interface DataForSEOResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: {
      api: string;
      function: string;
    };
    result: DataForSEOLocation[];
  }>;
}

// ============================================
// Credentials
// ============================================

function getCredentials() {
  const login = process.env.DATAFORSEO_LOGIN;
  const password = process.env.DATAFORSEO_PASSWORD;

  if (!login || !password) {
    throw new Error(
      'DataForSEO credentials not configured. Set DATAFORSEO_LOGIN and DATAFORSEO_PASSWORD environment variables.'
    );
  }

  return { login, password };
}

function getAuthHeader(credentials: { login: string; password: string }): string {
  const encoded = Buffer.from(`${credentials.login}:${credentials.password}`).toString('base64');
  return `Basic ${encoded}`;
}

// ============================================
// DataForSEO API Client
// ============================================

async function fetchLocations(): Promise<DataForSEOLocation[]> {
  console.log('📡 Fetching locations from DataForSEO...');

  const credentials = getCredentials();

  const response = await fetch(`${DATAFORSEO_API_BASE}${LOCATIONS_ENDPOINT}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(credentials),
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DataForSEO API error: ${response.status} ${errorText}`);
  }

  const data: DataForSEOResponse = await response.json();

  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO API failed: ${data.status_message}`);
  }

  const task = data.tasks?.[0];
  if (!task || !task.result) {
    throw new Error('No results returned from DataForSEO API');
  }

  console.log(`✅ Fetched ${task.result.length} locations (cost: $${data.cost.toFixed(4)})`);

  return task.result;
}

// ============================================
// Location Processing
// ============================================

/**
 * Build canonical name for a location by traversing parent hierarchy
 * Example: "Portland, Oregon, United States"
 */
function buildCanonicalName(
  location: DataForSEOLocation,
  allLocations: Map<number, DataForSEOLocation>
): string {
  const parts: string[] = [location.location_name];
  const seenNames = new Set<string>([location.location_name]);

  let current = location;
  while (current.location_code_parent) {
    const parent = allLocations.get(current.location_code_parent);
    if (!parent) break;

    // Avoid duplicates - skip if we've already seen this name
    if (!seenNames.has(parent.location_name)) {
      parts.push(parent.location_name);
      seenNames.add(parent.location_name);
    }

    current = parent;
  }

  return parts.join(', ');
}

/**
 * Filter to US locations only
 */
function filterLocations(locations: DataForSEOLocation[]): DataForSEOLocation[] {
  return locations.filter(loc =>
    COUNTRY_FILTER.includes(loc.country_iso_code)
  );
}

/**
 * Build canonical names for all locations
 */
function enrichLocations(locations: DataForSEOLocation[]): DataForSEOLocation[] {
  const locationMap = new Map<number, DataForSEOLocation>();

  // Build lookup map
  for (const loc of locations) {
    locationMap.set(loc.location_code, loc);
  }

  // Add canonical names
  for (const loc of locations) {
    loc.canonical_name = buildCanonicalName(loc, locationMap);
  }

  return locations;
}

// ============================================
// Database Seeding
// ============================================

async function seedDatabase(locations: DataForSEOLocation[]) {
  console.log('\n📊 Connecting to database...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase credentials not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  console.log(`✅ Connected to Supabase`);
  console.log(`📝 Inserting ${locations.length} locations...`);

  // Batch insert (Supabase has a limit, do in chunks of 1000)
  const BATCH_SIZE = 1000;
  let inserted = 0;
  let updated = 0;

  for (let i = 0; i < locations.length; i += BATCH_SIZE) {
    const batch = locations.slice(i, i + BATCH_SIZE);

    // Use upsert to handle existing records
    const { data, error } = await supabase
      .from('rank_locations')
      .upsert(
        batch.map(loc => ({
          location_code: loc.location_code,
          location_name: loc.location_name,
          location_type: loc.location_type,
          country_iso_code: loc.country_iso_code,
          location_code_parent: loc.location_code_parent,
          canonical_name: loc.canonical_name,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'location_code' }
      );

    if (error) {
      console.error(`❌ Error inserting batch ${i / BATCH_SIZE + 1}:`, error);
      throw error;
    }

    inserted += batch.length;
    console.log(`   ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} locations`);
  }

  console.log(`\n✅ Successfully seeded ${inserted} locations`);
}

// ============================================
// Statistics
// ============================================

function printStatistics(locations: DataForSEOLocation[]) {
  console.log('\n📈 Location Statistics:');

  const byType = locations.reduce((acc, loc) => {
    acc[loc.location_type] = (acc[loc.location_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const byCountry = locations.reduce((acc, loc) => {
    acc[loc.country_iso_code] = (acc[loc.country_iso_code] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n  By Type:');
  Object.entries(byType)
    .sort(([, a], [, b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`    ${type.padEnd(20)} ${count.toLocaleString()}`);
    });

  console.log('\n  By Country:');
  Object.entries(byCountry)
    .sort(([, a], [, b]) => b - a)
    .forEach(([country, count]) => {
      console.log(`    ${country.padEnd(20)} ${count.toLocaleString()}`);
    });

  console.log('\n  Sample Locations:');
  locations
    .filter(loc => loc.location_type === 'City')
    .slice(0, 10)
    .forEach(loc => {
      console.log(`    [${loc.location_code}] ${loc.canonical_name}`);
    });
}

// ============================================
// Main
// ============================================

async function main() {
  console.log('🚀 Starting rank locations seed script\n');

  try {
    // Fetch from DataForSEO
    const allLocations = await fetchLocations();

    // Filter to US only
    console.log(`🔍 Filtering to ${COUNTRY_FILTER.join(', ')} locations...`);
    const filteredLocations = filterLocations(allLocations);
    console.log(`✅ Filtered to ${filteredLocations.length} locations`);

    // Enrich with canonical names
    console.log('🏗️  Building canonical names...');
    const enrichedLocations = enrichLocations(filteredLocations);
    console.log('✅ Canonical names built');

    // Show statistics
    printStatistics(enrichedLocations);

    // Seed database
    await seedDatabase(enrichedLocations);

    console.log('\n🎉 Seed script completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Seed script failed:', error);
    process.exit(1);
  }
}

// Run if called directly
main();
