"use client";
import * as React from "react";
// 🔧 CONSOLIDATED: Single import from supabaseClient module
import { createClient, getUserOrMock } from "@/auth/providers/supabase";
import { markTaskAsCompleted } from "@/utils/onboardingTasks";

const supabase = createClient();
import Icon from "@/components/Icon";
import { GLASSY_DEFAULTS } from "@/app/(app)/config/styleDefaults";

// Only include fonts that are actually loaded and used in the project
const fontOptions = [
  // Google Fonts
  { name: "Inter", class: "font-inter" },
  { name: "Roboto", class: "font-roboto" },
  { name: "Open Sans", class: "font-open-sans" },
  { name: "Lato", class: "font-lato" },
  { name: "Montserrat", class: "font-montserrat" },
  { name: "Poppins", class: "font-poppins" },
  { name: "Source Sans 3", class: "font-source-sans" },
  { name: "Raleway", class: "font-raleway" },
  { name: "Nunito", class: "font-nunito" },
  { name: "Playfair Display", class: "font-playfair" },
  { name: "Merriweather", class: "font-merriweather" },
  { name: "Roboto Slab", class: "font-roboto-slab" },
  { name: "PT Sans", class: "font-pt-sans" },
  { name: "Oswald", class: "font-oswald" },
  { name: "Roboto Condensed", class: "font-roboto-condensed" },
  { name: "Source Serif 4", class: "font-source-serif" },
  { name: "Noto Sans", class: "font-noto-sans" },
  { name: "Ubuntu", class: "font-ubuntu" },
  { name: "Work Sans", class: "font-work-sans" },
  { name: "Quicksand", class: "font-quicksand" },
  { name: "Josefin Sans", class: "font-josefin-sans" },
  { name: "Mukta", class: "font-mukta" },
  { name: "Rubik", class: "font-rubik" },
  { name: "IBM Plex Sans", class: "font-ibm-plex-sans" },
  { name: "Barlow", class: "font-barlow" },
  { name: "Mulish", class: "font-mulish" },
  { name: "Comfortaa", class: "font-comfortaa" },
  { name: "Outfit", class: "font-outfit" },
  { name: "Plus Jakarta Sans", class: "font-plus-jakarta-sans" },
  // Typewriter Fonts
  { name: "Courier Prime", class: "font-courier-prime" },
  { name: "IBM Plex Mono", class: "font-ibm-plex-mono" },
  // System Fonts
  { name: "Arial", class: "font-arial" },
  { name: "Helvetica", class: "font-helvetica" },
  { name: "Verdana", class: "font-verdana" },
  { name: "Tahoma", class: "font-tahoma" },
  { name: "Trebuchet MS", class: "font-trebuchet-ms" },
  { name: "Times New Roman", class: "font-times-new-roman" },
  { name: "Georgia", class: "font-georgia" },
  { name: "Courier New", class: "font-courier-new" },
  { name: "Lucida Console", class: "font-lucida-console" },
  { name: "Palatino", class: "font-palatino" },
  { name: "Garamond", class: "font-garamond" },
];

// Color preset options are no longer needed since we're using color pickers

// Helper to get font class from fontOptions
function getFontClass(fontName: string) {
  const found = fontOptions.find(f => f.name === fontName);
  return found ? found.class : '';
}

interface StylePageProps {
  onClose?: () => void;
  onStyleUpdate?: (newStyles: any) => void;
  accountId?: string; // Account ID to use for saving styles
}

// Simple tooltip component
function Tooltip({ text }: { text: string }) {
  const [show, setShow] = React.useState(false);
  
  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      {show && (
        <div className="absolute z-50 w-64 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-6">
          {text}
          <div className="absolute w-2 h-2 bg-gray-900 transform rotate-45 -left-1 top-3"></div>
        </div>
      )}
    </div>
  );
}

export default function StylePage({ onClose, onStyleUpdate, accountId: propAccountId }: StylePageProps) {

  // Draggable modal state
  const [modalPos, setModalPos] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragOffset, setDragOffset] = React.useState({ x: 0, y: 0 });
  const [modalDimensions, setModalDimensions] = React.useState({ width: 672, height: 600 });
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [selectedPreset, setSelectedPreset] = React.useState<string | null>('glassy');

  // Preset configurations
  const presets = {
    glassy: {
      name: "Glassy",
      ...GLASSY_DEFAULTS,
      // Override fonts for the Glassy preset
      primary_font: "Playfair Display",
      secondary_font: "Lato",
      card_border_width: 2,
    },
    solid: {
      name: "Solidy",
      primary_font: "Montserrat",
      secondary_font: "Open Sans",
      primary_color: "#60A5FA",
      secondary_color: "#34D399",
      background_type: "solid",
      background_color: "#E0E7FF",
      gradient_start: "#E0E7FF",
      gradient_middle: "#E0E7FF",
      gradient_end: "#E0E7FF",
      card_bg: "#1E3A8A",
      card_text: "#F1F5F9",
      card_placeholder_color: "#94A3B8",
      input_text_color: "#F1F5F9",
      card_inner_shadow: true,
      card_shadow_color: "#000000",
      card_shadow_intensity: 0.30,
      card_transparency: 1.0,
      card_border_width: 0,
      card_border_color: "#334155",
      card_border_transparency: 1.0,
      kickstarters_background_design: false,
    },
    paper: {
      name: "Paper",
      primary_font: "Merriweather",
      secondary_font: "Georgia",
      primary_color: "#6B2C2C",
      secondary_color: "#92400E",
      background_type: "solid",
      background_color: "#374151",
      gradient_start: "#6B2C2C",
      gradient_middle: "#6B2C2C",
      gradient_end: "#6B2C2C",
      card_bg: "#FEFCF3",
      card_text: "#1F2937",
      card_placeholder_color: "#9CA3AF",
      input_text_color: "#1F2937",
      card_inner_shadow: true,
      card_shadow_color: "#92400E",
      card_shadow_intensity: 0.20,
      card_transparency: 1.0,
      card_border_width: 0,
      card_border_color: "#D1D5DB",
      card_border_transparency: 1.0,
      kickstarters_background_design: true,
    },
    outdoorsy: {
      name: "Outdoorsy",
      primary_font: "Oswald",
      secondary_font: "Raleway",
      primary_color: "#14532D",
      secondary_color: "#EA580C",
      background_type: "gradient",
      background_color: "#FFFFFF",
      gradient_start: "#1E40AF",
      gradient_middle: "#93C5FD",
      gradient_end: "#FEF3C7",
      card_bg: "#F5F3F0",
      card_text: "#14532D",
      card_placeholder_color: "#6B7280",
      input_text_color: "#1F2937",
      card_inner_shadow: false,
      card_shadow_color: "#000000",
      card_shadow_intensity: 0.10,
      card_transparency: 1,
      card_border_width: 2,
      card_border_color: "#16A34A",
      card_border_transparency: 0.5,
      kickstarters_background_design: false,
    },
    snazzy: {
      name: "Snazzy",
      primary_font: "Bebas Neue",
      secondary_font: "Poppins",
      primary_color: "#BE185D",
      secondary_color: "#EA580C",
      background_type: "gradient",
      background_color: "#FFFFFF",
      gradient_start: "#fff5eb",
      gradient_middle: "#fbb174",
      gradient_end: "#E11D48",
      card_bg: "#FFFFFF",
      card_text: "#1F2937",
      card_placeholder_color: "#9CA3AF",
      input_text_color: "#1F2937",
      card_inner_shadow: false,
      card_shadow_color: "#000000",
      card_shadow_intensity: 0.15,
      card_transparency: 1,
      card_border_width: 2,
      card_border_color: "#FB923C",
      card_border_transparency: 0.5,
      kickstarters_background_design: false,
    }
  };

  // Default to Glassy preset settings - using centralized config
  const [settings, setSettings] = React.useState({
    ...GLASSY_DEFAULTS,
    card_border_width: 1, // Ensure number type
  });

  // Store the business ID for updates
  const [businessId, setBusinessId] = React.useState<string | null>(null);

  // Function to check if current settings match a preset
  const checkIfMatchesPreset = (currentSettings: typeof settings): string | null => {
    for (const [key, preset] of Object.entries(presets)) {
      const { name, ...presetSettings } = preset;
      let matches = true;

      // Compare each setting field
      for (const [field, value] of Object.entries(presetSettings)) {
        if (currentSettings[field as keyof typeof currentSettings] !== value) {
          matches = false;
          break;
        }
      }

      if (matches) {
        return key;
      }
    }
    return null; // No preset matches - it's custom
  };

  // Update parent component whenever settings change (but not on initial load)
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [universalPromptPageSlug, setUniversalPromptPageSlug] = React.useState<string | null>(null);
  // Whether any prompt page has kickstarters enabled (controls visibility of Kickstarters section)
  const [kickstartersEnabled, setKickstartersEnabled] = React.useState<boolean>(false);
  
  // Helper function to validate hex color
  const isValidHexColor = (hex: string): boolean => {
    return /^#[0-9A-F]{6}$/i.test(hex);
  };

  // Helper function to handle hex input changes
  const handleHexInputChange = (field: string, value: string) => {
    // Allow typing # and partial hex codes
    if (value.startsWith('#') && value.length <= 7) {
      setSettings(s => ({ ...s, [field]: value }));
      
      // Only validate and update if it's a complete hex code
      if (value.length === 7 && isValidHexColor(value)) {
        setSettings(s => ({ ...s, [field]: value.toUpperCase() }));
      }
    } else if (value.length === 6 && /^[0-9A-F]+$/i.test(value)) {
      // If user types without #, add it
      const hexValue = '#' + value.toUpperCase();
      setSettings(s => ({ ...s, [field]: hexValue }));
    }
  };

  React.useEffect(() => {
    if (isInitialized && onStyleUpdate) {
      onStyleUpdate({
        primary_font: settings.primary_font,
        secondary_font: settings.secondary_font,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        background_type: settings.background_type,
        background_color: settings.background_color,
        gradient_start: settings.gradient_start,
        gradient_middle: settings.gradient_middle || null,
        gradient_end: settings.gradient_end,
        card_bg: settings.card_bg,
        card_text: settings.card_text,
        card_inner_shadow: settings.card_inner_shadow,
        card_shadow_color: settings.card_shadow_color,
        card_shadow_intensity: settings.card_shadow_intensity,
        card_transparency: settings.card_transparency,
      });
    }
  }, [settings, onStyleUpdate, isInitialized]);

  // Mark as initialized after first load
  React.useEffect(() => {
    if (!loading) {
      setIsInitialized(true);
    }
  }, [loading]);

  // Load current style settings on mount
  async function fetchSettings() {
    setLoading(true);
    try {
      const { data: { user }, error } = await getUserOrMock(supabase);
      if (error || !user) {
        setLoading(false);
        return;
      }

      // Use prop accountId - should always be provided by parent component
      const accountId = propAccountId;
      if (!accountId) {
        console.error('[StyleModal] No accountId provided as prop');
        setLoading(false);
        return;
      }
      console.log('[StyleModal] Loading settings for accountId:', accountId);

      // IMPORTANT: Avoid selecting specific columns to prevent errors if schema hasn't been migrated yet
      // Select all columns and then safely map to settings with fallbacks
      const { data: businessData } = await supabase
        .from("businesses")
        .select("*")
        .eq("account_id", accountId)
        .order("created_at", { ascending: true }); // Get oldest business first

      // Handle multiple businesses - use the first one (oldest)
      const business = businessData && businessData.length > 0 ? businessData[0] : null;
      console.log('[StyleModal] Found businesses:', businessData?.length || 0, 'Selected business ID:', business?.id);
      if (business) {
        console.log('[StyleModal] Loaded gradient values from DB:', {
          gradient_start: business.gradient_start,
          gradient_middle: business.gradient_middle,
          gradient_end: business.gradient_end,
          background_type: business.background_type
        });
      }

      // Store the business ID for updates
      if (business?.id) {
        setBusinessId(business.id);
      } else {
        console.error('[StyleModal] No business found for account:', accountId);
      }

      // Fetch universal prompt page
      const { data: universalPage } = await supabase
        .from("prompt_pages")
        .select('slug, kickstarters_enabled')
        .eq("account_id", accountId)
        .eq("is_universal", true)
        .maybeSingle();

      if (universalPage?.slug) {
        setUniversalPromptPageSlug(universalPage.slug);
      }

      // Determine if kickstarters is enabled anywhere (prefer universal page if present)
      if (universalPage && typeof universalPage.kickstarters_enabled === 'boolean') {
        setKickstartersEnabled(!!universalPage.kickstarters_enabled);
      } else {
        // Fallback: check if any prompt page has kickstarters enabled
        const { data: anyKickstartersEnabled } = await supabase
          .from('prompt_pages')
          .select('id')
          .eq('account_id', accountId)
          .eq('kickstarters_enabled', true)
          .limit(1);
        setKickstartersEnabled((anyKickstartersEnabled?.length || 0) > 0);
      }

      if (business) {
        const newSettings = {
          // Core, older columns (should exist in all deployments)
          primary_font: business.primary_font || "Inter",
          secondary_font: business.secondary_font || "Roboto",
          primary_color: business.primary_color || "#2563EB",
          secondary_color: business.secondary_color || "#FFFFFF",
          background_type: business.background_type || "gradient",
          background_color: business.background_color || "#FFFFFF",
          gradient_start: business.gradient_start || "#2563EB",
          gradient_end: business.gradient_end || "#914AAE",
          card_bg: business.card_bg || "#FFFFFF",
          card_text: business.card_text || "#1A1A1A",
          card_transparency: business.card_transparency ?? 0.30,

          // Newer/optional columns (use the default from our presets if missing in DB)
          gradient_middle: business.gradient_middle || "#7864C8",
          card_placeholder_color: business.card_placeholder_color || settings.card_placeholder_color,
          input_text_color: business.input_text_color || '#1F2937',
          card_inner_shadow: (business.card_inner_shadow ?? settings.card_inner_shadow) as boolean,
          card_shadow_color: business.card_shadow_color || settings.card_shadow_color,
          card_shadow_intensity: (business.card_shadow_intensity ?? settings.card_shadow_intensity) as number,
          card_border_width: (business.card_border_width ?? settings.card_border_width) as number,
          card_border_color: business.card_border_color || settings.card_border_color,
          card_border_transparency: (business.card_border_transparency ?? settings.card_border_transparency) as number,
          kickstarters_background_design: (business.kickstarters_background_design ?? settings.kickstarters_background_design) as boolean,
        };

        setSettings(newSettings);

        // After loading settings, check if they match any preset
        const matchingPreset = checkIfMatchesPreset(newSettings);
        setSelectedPreset(matchingPreset || 'custom');
      } else {
        // No business data, check default settings
        const matchingPreset = checkIfMatchesPreset(settings);
        setSelectedPreset(matchingPreset || 'custom');
      }
    } catch (error) {
      console.error("Error fetching style settings:", error);
    }
    setLoading(false);
  }

  // Center modal on mount
  React.useEffect(() => {
    const modalWidth = 672; // max-w-2xl
    const modalHeight = Math.min(window.innerHeight * 0.9, 800); // Use 90% of viewport height or 800px max
    const x = Math.max(0, (window.innerWidth - modalWidth) / 2);
    const y = Math.max(0, (window.innerHeight - modalHeight) / 2);
    setModalPos({ x, y });
  }, []);

  // Track modal dimensions for backdrop
  React.useEffect(() => {
    if (modalRef.current) {
      const updateDimensions = () => {
        const rect = modalRef.current?.getBoundingClientRect();
        if (rect) {
          setModalDimensions({ width: rect.width, height: rect.height });
        }
      };
      
      // Initial measurement
      updateDimensions();
      
      // Re-measure on window resize
      window.addEventListener('resize', updateDimensions);
      
      // Use ResizeObserver if available to track content changes
      if (typeof ResizeObserver !== 'undefined') {
        const resizeObserver = new ResizeObserver(updateDimensions);
        resizeObserver.observe(modalRef.current);
        
        return () => {
          resizeObserver.disconnect();
          window.removeEventListener('resize', updateDimensions);
        };
      }
      
      return () => {
        window.removeEventListener('resize', updateDimensions);
      };
    }
  }, []);

  // Handle dragging
  React.useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setModalPos({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  React.useEffect(() => {
    fetchSettings();
  }, []);

  async function handleSave() {
    setSaving(true);
    try {
      // Check if we have a business ID to update
      if (!businessId) {
        console.error('[StyleModal] Cannot save - no businessId set.');
        alert("No business profile found. Please create a business profile first.");
        setSaving(false);
        return;
      }
      console.log('[StyleModal] Saving to business ID:', businessId);

      // Prepare the update payload
      const updatePayload = {
        businessId,
        // Core fields
        primary_font: settings.primary_font,
        secondary_font: settings.secondary_font,
        primary_color: settings.primary_color,
        secondary_color: settings.secondary_color,
        background_type: settings.background_type,
        background_color: settings.background_color,
        gradient_start: settings.gradient_start,
        gradient_end: settings.gradient_end,
        card_bg: settings.card_bg,
        card_text: settings.card_text,
        card_transparency: settings.card_transparency,
        // Advanced fields
        gradient_middle: settings.gradient_middle || null,
        card_placeholder_color: settings.card_placeholder_color,
        input_text_color: settings.input_text_color || '#1F2937',
        card_inner_shadow: settings.card_inner_shadow,
        card_shadow_color: settings.card_shadow_color,
        card_shadow_intensity: settings.card_shadow_intensity,
        card_border_width: settings.card_border_width,
        card_border_color: settings.card_border_color,
        card_border_transparency: settings.card_border_transparency,
        kickstarters_background_design: settings.kickstarters_background_design,
      };

      console.log('[StyleModal] Gradient values being sent:', {
        gradient_start: updatePayload.gradient_start,
        gradient_middle: updatePayload.gradient_middle,
        gradient_end: updatePayload.gradient_end,
        background_type: updatePayload.background_type
      });
      console.log('[StyleModal] Full update payload:', updatePayload);

      // Get the selected account from localStorage for the header
      const selectedAccount = localStorage.getItem('selectedAccount');
      console.log('[StyleModal] Selected account from localStorage:', selectedAccount);
      console.log('[StyleModal] PropAccountId:', propAccountId);

      // Build headers with proper account ID
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Try propAccountId first (passed from parent), then localStorage
      const accountIdToUse = propAccountId || selectedAccount;
      if (accountIdToUse) {
        headers['X-Selected-Account'] = accountIdToUse;
        console.log('[StyleModal] Adding X-Selected-Account header:', accountIdToUse);
      } else {
        console.warn('[StyleModal] No account ID available for header!');
      }

      // Use the API endpoint for proper account isolation
      const response = await fetch('/api/businesses/update-style', {
        method: 'POST',
        headers,
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify(updatePayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save styles');
      }

      setSaving(false);
      console.log('[StyleModal] Successfully saved styles to business:', businessId);
      setSuccessMessage("All style changes saved successfully!");
      setSuccess(true);
      fetchSettings();

      // Mark the style-prompt-pages task as completed when successfully saved
      try {
        const accountId = propAccountId;
        if (accountId) {
          await markTaskAsCompleted(accountId, "style-prompt-pages");
        }
      } catch (taskError) {
        console.error("Error marking style task as completed:", taskError);
      }

      // If we're on a prompt page, refresh to apply the new styles
      if (onClose && onStyleUpdate) {
        onStyleUpdate(settings);
        // Delay reload to allow success message to be seen
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

      // Clear success message after showing it
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error saving style settings:", error);
      alert("Failed to save style settings. Please try again.");
      setSaving(false);
    }
  }

  // State for success message
  const [successMessage, setSuccessMessage] = React.useState("");
  
  // Function to apply a preset with confirmation
  const applyPreset = (presetKey: string) => {
    // Don't do anything if selecting custom - it's not a real preset
    if (presetKey === 'custom') {
      setSelectedPreset('custom');
      return;
    }

    const preset = presets[presetKey as keyof typeof presets];
    if (!preset) return;

    const message = `Apply the "${preset.name}" preset? This will replace all current style settings.`;

    if (window.confirm(message)) {
      const { name, ...presetSettings } = preset; // Exclude the name property
      setSettings(presetSettings);
      setSelectedPreset(presetKey);
      // Show success message
      setSuccessMessage(`${preset.name} preset applied! Remember to save your changes.`);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSuccessMessage("");
      }, 4000);
    }
  };

  // Check for custom settings whenever settings change
  React.useEffect(() => {
    if (isInitialized) {
      const matchingPreset = checkIfMatchesPreset(settings);
      setSelectedPreset(matchingPreset || 'custom');
    }
  }, [settings, isInitialized]);

  async function handleReset() {
    if (window.confirm('Are you sure you want to reset all style settings to default? This cannot be undone.')) {
      const defaultSettings = {
        ...GLASSY_DEFAULTS,
        card_border_width: 1,
      };
      
      setSettings(defaultSettings);
      
      // Immediately save the reset values to database
      setTimeout(() => handleSave(), 100);
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target instanceof HTMLElement && e.target.closest('.modal-header')) {
      setIsDragging(true);
      setDragOffset({
        x: e.clientX - modalPos.x,
        y: e.clientY - modalPos.y,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      {/* Clickable backdrop for closing */}
      <div 
        className="absolute inset-0"
        onClick={onClose || (() => window.history.back())}
        aria-label="Close modal"
        style={{ pointerEvents: 'auto' }}
      />
      
      {/* Soft darkening area behind modal - only shows on prompt pages */}
      {onClose && (
        <div
          style={{
            position: 'fixed',
            left: modalPos.x,
            top: modalPos.y,
            width: modalDimensions.width,
            height: modalDimensions.height,
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '1rem',
            pointerEvents: 'none',
            zIndex: 49,
          }}
        />
      )}
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="bg-gradient-to-br from-indigo-50/95 via-white/95 to-purple-50/95 rounded-2xl shadow-2xl w-full max-w-2xl relative border border-white/20 backdrop-blur-sm"
        style={{
          position: 'fixed',
          left: modalPos.x,
          top: modalPos.y,
          transform: 'none',
          maxHeight: '90vh',
          height: 'auto',
          pointerEvents: 'auto',
          zIndex: 50,
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Draggable header */}
        <div className="modal-header flex items-center justify-between p-4 cursor-move bg-gradient-to-r from-indigo-600 via-purple-600 to-fuchsia-600 rounded-t-2xl">
          <div className="w-1/3">
            <h2 className="text-xl font-semibold text-white">Prompt Page Style</h2>
          </div>
          <div className="w-1/3 flex justify-center">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-2">
              <Icon name="FaArrowsAlt" className="text-white" size={16} />
            </div>
          </div>
          <div className="w-1/3 flex justify-end items-center gap-2 pr-8">
            <button
              className="px-5 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>

        {/* Circular close button that exceeds modal borders */}
        <button
          className="absolute -top-3 -right-3 bg-white/70 backdrop-blur-sm border border-white/40 rounded-full shadow-lg flex items-center justify-center hover:bg-white/90 focus:outline-none z-20 transition-colors p-2"
          style={{ width: 36, height: 36 }}
          onClick={onClose || (() => window.history.back())}
          aria-label="Close style modal"
        >
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 5rem)' }}>
          {/* Style Preset Selector */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Style Presets</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Choose a preset
              </label>
              <select
                value={selectedPreset || 'custom'}
                onChange={(e) => applyPreset(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="custom">Custom - Your unique style</option>
                <option value="glassy">Glassy - Like a crystal goblet for your praise</option>
                <option value="solid">Solidy - Dependable like a bullet-proof briefcase</option>
                <option value="paper">Papery - Leather-bound books, rich mahogany</option>
                <option value="outdoorsy">Outdoorsy - Like a Patagonia jacket for your reviews</option>
                <option value="snazzy">Snazzy - It's peachy-keen</option>
              </select>
            </div>
          </div>
          
          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-700 rounded-md p-4 text-center font-medium animate-fadein">
              {successMessage || "Style settings saved!"}
            </div>
          )}

        {/* Only show info banner when NOT on a prompt page (when onClose is not provided) */}
        {!onClose && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-white/80 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-sm text-white/90">
                <p>
                  Design changes affect all Prompt Pages. Try designing live with your{' '}
                  {universalPromptPageSlug ? (
                    <a 
                      href={`/r/${universalPromptPageSlug}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline hover:text-white/80 transition-colors"
                    >
                      Universal Prompt Page
                    </a>
                  ) : (
                    'Universal Prompt Page'
                  )}, it's more fun!
                </p>
              </div>
            </div>
          </div>
        )}
        
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 mb-2">
          <div className="flex flex-col gap-6">
        {/* Font pickers */}
          <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Primary Font</label>
            <select
              value={settings.primary_font}
              onChange={e => setSettings(s => ({ ...s, primary_font: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <optgroup label="Google Fonts">
                {fontOptions.filter(f => !["Arial","Helvetica","Verdana","Tahoma","Trebuchet MS","Times New Roman","Georgia","Courier New","Lucida Console","Palatino","Garamond"].includes(f.name)).map(font => (
                    <option key={font.name} value={font.name}>{font.name}</option>
                ))}
              </optgroup>
              <optgroup label="System Fonts">
                {fontOptions.filter(f => ["Arial","Helvetica","Verdana","Tahoma","Trebuchet MS","Times New Roman","Georgia","Courier New","Lucida Console","Palatino","Garamond"].includes(f.name)).map(font => (
                    <option key={font.name} value={font.name}>{font.name}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-xs text-gray-500 mt-1">System fonts may look different on different devices.</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Secondary Font</label>
            <select
              value={settings.secondary_font}
              onChange={e => setSettings(s => ({ ...s, secondary_font: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <optgroup label="Google Fonts">
                {fontOptions.filter(f => !["Arial","Helvetica","Verdana","Tahoma","Trebuchet MS","Times New Roman","Georgia","Courier New","Lucida Console","Palatino","Garamond"].includes(f.name)).map(font => (
                    <option key={font.name} value={font.name}>{font.name}</option>
                ))}
              </optgroup>
              <optgroup label="System Fonts">
                {fontOptions.filter(f => ["Arial","Helvetica","Verdana","Tahoma","Trebuchet MS","Times New Roman","Georgia","Courier New","Lucida Console","Palatino","Garamond"].includes(f.name)).map(font => (
                    <option key={font.name} value={font.name}>{font.name}</option>
                ))}
              </optgroup>
            </select>
            <p className="text-xs text-gray-500 mt-1">System fonts may look different on different devices.</p>
          </div>
            {/* Primary color */}
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-3">
                <label className="text-sm font-medium text-gray-700">Primary Color</label>
                <Tooltip text="Used for main headings and important text elements on your prompt pages" />
              </div>
                <input type="color" value={settings.primary_color} onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
                <input 
                  type="text" 
                  value={settings.primary_color} 
                  onChange={e => handleHexInputChange('primary_color', e.target.value)}
                  className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                  placeholder="#000000"
                />
          </div>
          {/* Secondary color - moved here */}
          <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-3">
                <label className="text-sm font-medium text-gray-700">Secondary Color</label>
                <Tooltip text="Used for buttons, links, and accent elements throughout your prompt pages" />
              </div>
                <input type="color" value={settings.secondary_color} onChange={e => setSettings(s => ({ ...s, secondary_color: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
                <input 
                  type="text" 
                  value={settings.secondary_color} 
                  onChange={e => handleHexInputChange('secondary_color', e.target.value)}
                  className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                  placeholder="#000000"
                />
          </div>
          </div>
          <div className="flex flex-col gap-6">
        {/* Background type */}
            <div className="bg-white rounded-lg shadow p-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Background Type</label>
          <div className="flex gap-4">
                <label><input type="radio" name="background_type" value="solid" checked={settings.background_type === "solid"} onChange={() => setSettings(s => ({ ...s, background_type: "solid" }))} /><span className="ml-2">Solid</span></label>
                <label><input type="radio" name="background_type" value="gradient" checked={settings.background_type === "gradient"} onChange={() => setSettings(s => ({ ...s, background_type: "gradient" }))} /><span className="ml-2">Gradient</span></label>
          </div>
          {settings.background_type === "solid" && (
            <div className="mt-3">
              <label className="block text-xs text-gray-500 mb-1">Background Color</label>
              <input type="color" value={settings.background_color} onChange={e => setSettings(s => ({ ...s, background_color: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
              <input 
                type="text" 
                value={settings.background_color} 
                onChange={e => handleHexInputChange('background_color', e.target.value)}
                className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                placeholder="#FFFFFF"
              />
            </div>
          )}
          {settings.background_type === "gradient" && (
            <div className="flex gap-4 mt-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Start</label>
                <input type="color" value={settings.gradient_start} onChange={e => setSettings(s => ({ ...s, gradient_start: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
                <input 
                  type="text" 
                  value={settings.gradient_start} 
                  onChange={e => handleHexInputChange('gradient_start', e.target.value)}
                  className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                  placeholder="#000000"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Middle (Optional)</label>
                <input type="color" value={settings.gradient_middle || '#FFFFFF'} onChange={e => setSettings(s => ({ ...s, gradient_middle: e.target.value }))} className="w-full h-10 rounded cursor-pointer" disabled={!settings.gradient_middle} />
                <input 
                  type="text" 
                  value={settings.gradient_middle || ''} 
                  onChange={e => handleHexInputChange('gradient_middle', e.target.value)}
                  className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                  placeholder="Leave empty for 2-color gradient"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">End</label>
                <input type="color" value={settings.gradient_end} onChange={e => setSettings(s => ({ ...s, gradient_end: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
                <input 
                  type="text" 
                  value={settings.gradient_end} 
                  onChange={e => handleHexInputChange('gradient_end', e.target.value)}
                  className="w-full mt-1 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
                  placeholder="#000000"
                />
              </div>
            </div>
          )}
        </div>
        {/* Card background - moved up and with color picker */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-3">
            <label className="text-sm font-medium text-gray-700">Card Background</label>
            <Tooltip text="Background color for review cards and content sections on your prompt pages" />
          </div>
          <input type="color" value={settings.card_bg} onChange={e => setSettings(s => ({ ...s, card_bg: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
          <input 
            type="text" 
            value={settings.card_bg} 
            onChange={e => handleHexInputChange('card_bg', e.target.value)}
            className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent" 
            placeholder="#FFFFFF"
          />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-3">
            <label className="text-sm font-medium text-gray-700">Card Text Color</label>
            <Tooltip text="Text color for content inside review cards and sections" />
          </div>
          <input type="color" value={settings.card_text} onChange={e => setSettings(s => ({ ...s, card_text: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
          <input
            type="text"
            value={settings.card_text}
            onChange={e => handleHexInputChange('card_text', e.target.value)}
            className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="#1A1A1A"
          />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-3">
            <label className="text-sm font-medium text-gray-700">Input Text Color</label>
            <Tooltip text="Text color for input fields and textareas (the text users type)" />
          </div>
          <input type="color" value={settings.input_text_color || '#1F2937'} onChange={e => setSettings(s => ({ ...s, input_text_color: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
          <input
            type="text"
            value={settings.input_text_color || '#1F2937'}
            onChange={e => handleHexInputChange('input_text_color', e.target.value)}
            className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="#1F2937"
          />
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-3">
            <label className="text-sm font-medium text-gray-700">Placeholder Text Color</label>
            <Tooltip text="Color for placeholder text in input fields and text areas" />
          </div>
          <input type="color" value={settings.card_placeholder_color} onChange={e => setSettings(s => ({ ...s, card_placeholder_color: e.target.value }))} className="w-full h-10 rounded cursor-pointer" />
          <input
            type="text"
            value={settings.card_placeholder_color}
            onChange={e => handleHexInputChange('card_placeholder_color', e.target.value)}
            className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
            placeholder="#9CA3AF"
          />
        </div>
          </div>
        </div>

        {/* Card Styling Settings */}
        <div className="mt-8 p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-white/30">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Card Styling</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Card Transparency</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.card_transparency}
                onChange={(e) => setSettings(s => ({ ...s, card_transparency: parseFloat(e.target.value) }))}
                className="w-full"
              />
              <span className="text-xs text-gray-500">{Math.round(settings.card_transparency * 100)}% opacity</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Inner Shadow Vignette</label>
              <select
                value={settings.card_inner_shadow ? 'true' : 'false'}
                onChange={(e) => setSettings(s => ({ ...s, card_inner_shadow: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="false">No Vignette</option>
                <option value="true">Show Vignette</option>
              </select>
            </div>
            {settings.card_inner_shadow && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Vignette Color</label>
                  <input
                    type="color"
                    value={settings.card_shadow_color}
                    onChange={(e) => setSettings(s => ({ ...s, card_shadow_color: e.target.value }))}
                    className="w-full h-10 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Vignette Intensity</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.card_shadow_intensity}
                    onChange={(e) => setSettings(s => ({ ...s, card_shadow_intensity: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <span className="text-xs text-gray-500">{Math.round(settings.card_shadow_intensity * 100)}%</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Kickstarters Section (conditional) */}
        {kickstartersEnabled && (
          <div className="mt-8 p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-white/30">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Kickstarters</h3>
            <p className="text-sm text-gray-600 mb-4">
              Style the Kickstarter prompts shown on your Prompt Pages.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Kickstarters Design Style</label>
                <select
                  value={settings.kickstarters_background_design ? 'true' : 'false'}
                  onChange={(e) => setSettings(s => ({ ...s, kickstarters_background_design: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="true">With Background</option>
                  <option value="false">Without Background</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Choose card-style background or transparent text using your card colors.
                </p>
              </div>
              <div>
                <div className="flex items-center mb-3">
                  <label className="text-sm font-medium text-gray-700">Kickstarters Primary Color</label>
                  <Tooltip text="Color for Kickstarter text and controls (uses Primary Color)." />
                </div>
                <input
                  type="color"
                  value={settings.primary_color}
                  onChange={e => setSettings(s => ({ ...s, primary_color: e.target.value }))}
                  className="w-full h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primary_color}
                  onChange={e => handleHexInputChange('primary_color', e.target.value)}
                  className="w-full mt-2 px-2 py-1 text-xs border rounded bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-blue focus:border-transparent"
                  placeholder="#2563EB"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This uses your Primary Color. Updating it changes other headings too.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Border Settings */}
        <div className="mt-8 p-6 bg-white/95 backdrop-blur-sm rounded-xl border border-white/30">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Border Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Border Thickness</label>
              <select
                value={settings.card_border_width}
                onChange={(e) => setSettings(s => ({ ...s, card_border_width: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="0">No border</option>
                <option value="0.5">0.5px (hairline)</option>
                <option value="1">1px (thin)</option>
                <option value="1.5">1.5px</option>
                <option value="2">2px (medium)</option>
                <option value="3">3px (thick)</option>
                <option value="4">4px (extra thick)</option>
              </select>
            </div>
            
            {settings.card_border_width > 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={settings.card_border_color}
                      onChange={(e) => setSettings(s => ({ ...s, card_border_color: e.target.value }))}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.card_border_color}
                      onChange={(e) => handleHexInputChange('card_border_color', e.target.value)}
                      placeholder="#222222"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Border Transparency: {Math.round(settings.card_border_transparency * 100)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={settings.card_border_transparency}
                    onChange={(e) => setSettings(s => ({ ...s, card_border_transparency: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Transparent</span>
                    <span>Opaque</span>
                  </div>
                </div>
              </>
            )}
          </div>
          
          {settings.card_border_width > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Preview:</strong> {settings.card_border_width}px border with color {settings.card_border_color} at {Math.round(settings.card_border_transparency * 100)}% opacity
              </p>
            </div>
          )}
        </div>

        {/* Bottom action buttons row */}
        <div className="flex justify-end gap-4 mt-10">
          <button
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30"
            onClick={handleReset}
            disabled={saving}
          >
            Reset
          </button>
          <button
            className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition text-sm border border-white/30"
            style={{ minWidth: 90 }}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
