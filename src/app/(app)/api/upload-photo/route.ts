import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const promptPageId = formData.get("promptPageId");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (!promptPageId || typeof promptPageId !== "string") {
      return NextResponse.json({ error: "Missing promptPageId" }, { status: 400 });
    }

    // Validate file type and size
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Only PNG, JPG, or WebP images are allowed." }, { status: 400 });
    }
    if (file.size > 1 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large (max 1MB)" },
        { status: 400 },
      );
    }

    // 1. Look up account_id for this prompt page
    const { data: promptPage, error: promptPageError } = await supabase
      .from("prompt_pages")
      .select("account_id")
      .eq("id", promptPageId)
      .single();
    if (promptPageError || !promptPage?.account_id) {
      return NextResponse.json({ error: "Prompt page not found" }, { status: 400 });
    }
    const accountId = promptPage.account_id;

    // 2. List all files in testimonial-photos bucket
    let totalSize = 0;
    let page = 1;
    let allFiles: any[] = [];
    while (true) {
      const { data: files, error: listError } = await supabase.storage
        .from("testimonial-photos")
        .list("", { limit: 1000, offset: (page - 1) * 1000 });
      if (listError) {
        return NextResponse.json({ error: "Failed to list testimonial photos" }, { status: 500 });
      }
      if (!files || files.length === 0) break;
      allFiles = allFiles.concat(files);
      if (files.length < 1000) break;
      page++;
    }

    // 3. For each file, find the review_submissions row and join to prompt_pages for account_id
    //    (We only need the size for files belonging to this account)
    //    We'll do this in batches for performance
    const fileNames = allFiles.map(f => f.name);
    let accountFileSizes = 0;
    for (let i = 0; i < fileNames.length; i += 100) {
      const batch = fileNames.slice(i, i + 100);
      // Find review_submissions with photo_url containing the filename
      const { data: submissions, error: subError } = await supabase
        .from("review_submissions")
        .select("photo_url,prompt_page_id")
        .in("photo_url", batch.map(name => ["testimonial-photos", name].join("/")))
        .neq("photo_url", null);
      if (subError) continue; // skip batch on error
      const promptPageIds = submissions.map(s => s.prompt_page_id);
      if (promptPageIds.length === 0) continue;
      // Get prompt_pages for these IDs
      const { data: pages, error: pagesError } = await supabase
        .from("prompt_pages")
        .select("id,account_id")
        .in("id", promptPageIds);
      if (pagesError) continue;
      // For each submission, if its prompt_page.account_id matches, add the file size
      for (const sub of submissions) {
        const page = pages.find(p => p.id === sub.prompt_page_id);
        if (page && page.account_id === accountId) {
          const fileObj = allFiles.find(f => ["testimonial-photos", f.name].join("/") === sub.photo_url);
          if (fileObj) accountFileSizes += fileObj.metadata?.size || 0;
        }
      }
    }

    // 4. If total + new file > 50MB, reject
    if (accountFileSizes + file.size > 50 * 1024 * 1024) {
      return NextResponse.json({
        error: "You have reached your 50MB storage limit for testimonial photos. Please delete old photos or contact support to increase your limit."
      }, { status: 400 });
    }

    // Generate a unique filename
    const ext = file.name.split(".").pop();
    const filename = `photo_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("testimonial-photos")
      .upload(filename, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from("testimonial-photos")
      .getPublicUrl(filename);
    return NextResponse.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
