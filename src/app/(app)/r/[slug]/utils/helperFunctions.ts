/**
 * Helper Functions
 * 
 * Utility functions extracted from the main prompt page component
 * for better organization and reusability.
 */

import { IconName } from "@/components/Icon";

// Helper to get platform icon based on URL or platform name
export function getPlatformIcon(
  url: string,
  platform: string,
): { icon: IconName; label: string } {
  const lowerUrl = url?.toLowerCase() || "";
  const lowerPlatform = (platform || "").toLowerCase();
  if (lowerUrl.includes("google") || lowerPlatform.includes("google"))
    return { icon: "FaGoogle", label: "Google" };
  if (lowerUrl.includes("facebook") || lowerPlatform.includes("facebook"))
    return { icon: "FaFacebook", label: "Facebook" };
  if (lowerUrl.includes("yelp") || lowerPlatform.includes("yelp"))
    return { icon: "FaYelp", label: "Yelp" };
  if (lowerUrl.includes("tripadvisor") || lowerPlatform.includes("tripadvisor"))
    return { icon: "FaTripadvisor", label: "TripAdvisor" };
  if (lowerUrl.includes("amazon") || lowerPlatform.includes("amazon"))
    return { icon: "FaAmazon", label: "Amazon" };
  if (lowerUrl.includes("bbb") || lowerPlatform.includes("bbb") || lowerPlatform.includes("better business"))
    return { icon: "FaBbb", label: "BBB" };
  if (lowerUrl.includes("g2") || lowerPlatform.includes("g2"))
    return { icon: "SiG2", label: "G2" };
  return { icon: "FaRegStar", label: "Other" };
}

// Helper to split full name into first and last
export function splitName(fullName: string) {
  if (!fullName) return { first: "", last: "" };
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return { first: parts[0], last: "" };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

// Helper to send analytics events
export async function sendAnalyticsEvent(event: Record<string, any>) {
  try {
    await fetch("/api/track-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  } catch (e) {
    // Optionally log error
  }
}

// Helper to determine if card_bg is off-white or cream
export function isOffWhiteOrCream(color: string) {
  const offWhites = ["#F8FAFC", "#F9FAFB", "#F3F4F6", "#FAF3E3", "#FFF9E3", "#FFF8E1", "#FDF6EC", "#F5F5DC", "#FFFDD0", "#FFFDE7", "#FFFBEA"];
  return offWhites.map(c => c.toUpperCase()).includes(color.toUpperCase());
} 