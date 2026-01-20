import { createServiceRoleClient } from "@/auth/providers/supabase";

interface LogLoginParams {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isNewUser?: boolean;
  loginType?: "email" | "google" | "magic_link" | "password";
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log a user login event to the database
 * Uses service role client to bypass RLS
 */
export async function logUserLogin(params: LogLoginParams): Promise<void> {
  try {
    const supabaseAdmin = createServiceRoleClient();

    const { error } = await supabaseAdmin
      .from("user_logins")
      .insert({
        user_id: params.userId,
        email: params.email,
        first_name: params.firstName || null,
        last_name: params.lastName || null,
        is_new_user: params.isNewUser || false,
        login_type: params.loginType || "email",
        ip_address: params.ipAddress || null,
        user_agent: params.userAgent || null,
      });

    if (error) {
      console.error("[Login Tracking] Failed to log login:", error);
    } else {
      console.log(`[Login Tracking] Logged login for ${params.email} (new: ${params.isNewUser})`);
    }
  } catch (error) {
    console.error("[Login Tracking] Error logging login:", error);
    // Don't throw - login tracking should never break the auth flow
  }
}
