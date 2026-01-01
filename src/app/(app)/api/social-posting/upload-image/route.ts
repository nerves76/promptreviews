import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from '@/auth/providers/supabase';
import { createHash } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const folderFromPayload = formData.get("folder");
    const folder = typeof folderFromPayload === 'string' && folderFromPayload.trim().length > 0
      ? folderFromPayload.trim()
      : 'social-posts/scheduled';
    const bucket = process.env.GBP_SCHEDULED_MEDIA_BUCKET || 'post-images';

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: "Invalid file type. Only PNG, JPG, GIF, or WebP images are allowed."
      }, { status: 400 });
    }

    // Supabase has strict limits - check compressed file size
    const MAX_UPLOAD_SIZE = 1 * 1024 * 1024; // 1MB max for Supabase
    if (file.size > MAX_UPLOAD_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      console.error(`File too large: ${file.name} is ${sizeMB}MB, max is 1MB`);
      return NextResponse.json(
        { error: `Image is ${sizeMB}MB after compression. Maximum size is 1MB. Please use a smaller image.` },
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
    const ext = file.name.includes('.') ? file.name.split(".").pop() : undefined;
    const safeExt = ext ? `.${ext}` : '';
    const filename = `${folder.replace(/\/+$/,'')}/user_${user.id}_${Date.now()}_${Math.random().toString(36).slice(2)}${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const checksum = createHash('sha256').update(buffer).digest('hex');

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filename, buffer, {
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
      .from(bucket)
      .getPublicUrl(filename);
    
    return NextResponse.json({
      url: publicUrlData.publicUrl,
      bucket,
      path: filename,
      size: file.size,
      mime: file.type,
      checksum,
      originalName: file.name,
    });
  } catch (err) {
    console.error('Server error:', err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
} 
