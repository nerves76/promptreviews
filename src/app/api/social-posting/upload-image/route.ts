import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/utils/supabaseClient';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "social-posts";

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: "Invalid file type. Only PNG, JPG, or WebP images are allowed." 
      }, { status: 400 });
    }
    
    // 10MB limit for social media images
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 400 },
      );
    }

    // Get authenticated user
    const supabase = await createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Generate a unique filename with folder structure
    const ext = file.name.split(".").pop();
    const filename = `${folder}/user_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("testimonial-photos")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      console.error('Upload error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("testimonial-photos")
      .getPublicUrl(filename);
    
    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 