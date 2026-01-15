/**
 * Server-side Cloudflare Turnstile verification
 *
 * Documentation: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */

interface TurnstileVerifyResponse {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
  cdata?: string;
}

interface VerifyResult {
  success: boolean;
  error?: string;
}

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify a Turnstile token server-side
 *
 * @param token - The token received from the Turnstile widget
 * @param ip - Optional IP address of the user (for additional validation)
 * @returns Promise<VerifyResult>
 */
export async function verifyTurnstileToken(
  token: string,
  ip?: string
): Promise<VerifyResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  if (!secretKey) {
    console.error("Turnstile: TURNSTILE_SECRET_KEY is not configured");
    // In development without keys, allow signup
    if (process.env.NODE_ENV === "development") {
      console.warn("Turnstile: Skipping verification in development mode");
      return { success: true };
    }
    return { success: false, error: "CAPTCHA verification is not configured" };
  }

  if (!token) {
    return { success: false, error: "Please complete the CAPTCHA verification" };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("secret", secretKey);
    formData.append("response", token);
    if (ip) {
      formData.append("remoteip", ip);
    }

    const response = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    if (!response.ok) {
      console.error("Turnstile: Verification request failed", response.status);
      return { success: false, error: "CAPTCHA verification failed. Please try again." };
    }

    const result: TurnstileVerifyResponse = await response.json();

    if (result.success) {
      return { success: true };
    }

    // Log error codes for debugging
    if (result["error-codes"]) {
      console.error("Turnstile: Verification failed with errors:", result["error-codes"]);
    }

    // Map common error codes to user-friendly messages
    const errorCodes = result["error-codes"] || [];
    if (errorCodes.includes("timeout-or-duplicate")) {
      return { success: false, error: "CAPTCHA expired. Please try again." };
    }
    if (errorCodes.includes("invalid-input-response")) {
      return { success: false, error: "Invalid CAPTCHA response. Please try again." };
    }

    return { success: false, error: "CAPTCHA verification failed. Please try again." };
  } catch (error) {
    console.error("Turnstile: Verification error:", error);
    return { success: false, error: "CAPTCHA verification failed. Please try again." };
  }
}
