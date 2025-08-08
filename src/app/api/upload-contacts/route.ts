import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { parse } from "csv-parse/sync";
import slugify from "slugify";
import { checkAccountLimits } from "@/utils/accountLimits";
import { authenticateApiRequest } from "@/utils/apiAuth";

export async function POST(request: NextRequest) {
  try {
    console.log("Starting upload-contacts API route");
    
    // Authenticate the request
    const { user, supabase, error: authError } = await authenticateApiRequest(request);
    
    if (authError || !user) {
      console.log("Upload contacts API: Authentication failed:", authError);
      return NextResponse.json({ error: authError || "Authentication required" }, { status: 401 });
    }

    console.log("User authenticated:", { userId: user.id, email: user.email });

    // ENFORCE ACCOUNT LIMITS
    const limitCheck = await checkAccountLimits(supabase, user.id, "contact");
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.reason || `Limit reached for your plan (${limitCheck.limit || 'unknown'} contacts). Upgrade required to add contacts.` },
        { status: 403 },
      );
    }

    // Get the form data
    console.log("Getting form data...");
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      console.error("No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read and parse the CSV file
    console.log("Starting CSV processing...");
    const text = await file.text();
    console.log("Raw CSV content:", text);

    // First, split the text into lines and clean them
    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter(
        (line) =>
          line.length > 0 &&
          line.split(",").some((cell) => cell.trim().length > 0),
      );

    console.log("Cleaned lines:", lines);
    console.log("Number of lines:", lines.length);

    // Parse the CSV with more lenient settings
    const records = parse(lines.join("\n"), {
      columns: (headers) => {
        console.log("Raw headers before mapping:", headers);
        // Normalize header: lowercase, remove spaces/underscores
        const normalize = (h: string) => h.toLowerCase().replace(/\s|_/g, "");
        const expected = {
          first_name: ["firstname", "first name", "first_name"],
          last_name: ["lastname", "last name", "last_name"],
          email: ["email", "emailaddress", "email_address"],
          phone: ["phone", "phonenumber", "phone_number", "phone#"],
          offer_url: ["offerurl", "offer url"],
          offer_title: ["offertitle", "offer title"],
          offer_body: ["offerbody", "offer body"],
          role: ["role"],
          review_type: ["reviewtype", "review type"],
          friendly_note: ["friendlynote", "friendly note"],
          features_or_benefits: ["featuresorbenefits", "features or benefits"],
          product_description: ["productdescription", "product description"],
          address_line1: ["addressline1", "address line1"],
          address_line2: ["addressline2", "address line2"],
          city: ["city"],
          state: ["state"],
          postal_code: ["postalcode", "postal code"],
          country: ["country"],
          business_name: ["businessname", "business name"],
          notes: ["notes"],
          category: ["category"],
          // Review fields (up to 15 reviews)
          review_1_content: ["review1content", "review 1 content", "review_1_content"],
          review_1_platform: ["review1platform", "review 1 platform", "review_1_platform"],
          review_1_rating: ["review1rating", "review 1 rating", "review_1_rating"],
          review_1_date: ["review1date", "review 1 date", "review_1_date"],
          review_1_reviewer_first_name: ["review1reviewerfirstname", "review 1 reviewer first name", "review_1_reviewer_first_name"],
          review_1_reviewer_last_name: ["review1reviewerlastname", "review 1 reviewer last name", "review_1_reviewer_last_name"],
          review_1_reviewer_role: ["review1reviewerrole", "review 1 reviewer role", "review_1_reviewer_role"],
          review_2_content: ["review2content", "review 2 content", "review_2_content"],
          review_2_platform: ["review2platform", "review 2 platform", "review_2_platform"],
          review_2_rating: ["review2rating", "review 2 rating", "review_2_rating"],
          review_2_date: ["review2date", "review 2 date", "review_2_date"],
          review_2_reviewer_first_name: ["review2reviewerfirstname", "review 2 reviewer first name", "review_2_reviewer_first_name"],
          review_2_reviewer_last_name: ["review2reviewerlastname", "review 2 reviewer last name", "review_2_reviewer_last_name"],
          review_2_reviewer_role: ["review2reviewerrole", "review 2 reviewer role", "review_2_reviewer_role"],
          review_3_content: ["review3content", "review 3 content", "review_3_content"],
          review_3_platform: ["review3platform", "review 3 platform", "review_3_platform"],
          review_3_rating: ["review3rating", "review 3 rating", "review_3_rating"],
          review_3_date: ["review3date", "review 3 date", "review_3_date"],
          review_3_reviewer_first_name: ["review3reviewerfirstname", "review 3 reviewer first name", "review_3_reviewer_first_name"],
          review_3_reviewer_last_name: ["review3reviewerlastname", "review 3 reviewer last name", "review_3_reviewer_last_name"],
          review_3_reviewer_role: ["review3reviewerrole", "review 3 reviewer role", "review_3_reviewer_role"],
        };
        // Map normalized header to expected field
        return headers.map((header: string) => {
          const norm = normalize(header);
          for (const [key, aliases] of Object.entries(expected)) {
            if (aliases.includes(norm)) return key;
          }
          // Ignore unknown columns by returning null
          return null;
        });
      },
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      relax_quotes: true,
      quote: '"',
      escape: '"',
      delimiter: ",",
      skip_records_with_empty_values: true,
    });

    console.log("Raw parsed records:", records);
    // Filter out any records that are completely empty
    const validRecords = records.filter((record: any, index: number) => {
      // Only keep fields that are in our expected list
      const filtered = Object.fromEntries(
        Object.entries(record).filter(
          ([k, v]) => k && v !== undefined && v !== null,
        ),
      );
      // Remove keys for columns that mapped to null
      for (const key in filtered) {
        if (key === "null") delete filtered[key];
      }
      // Trim all values
      Object.keys(filtered).forEach((k) => {
        if (typeof filtered[k] === "string") filtered[k] = filtered[k].trim();
      });
      // Check if all values are empty
      const hasData = Object.values(filtered).some(
        (value) => value && value.toString().trim().length > 0,
      );
      if (!hasData) return false;
      records[index] = filtered; // update record in place
      return true;
    });

    console.log("Valid records after filtering and trimming:", validRecords);
    console.log("Number of valid records:", validRecords.length);

    // Validate required fields
    const invalidRecords = validRecords.filter((record: any, index: number) => {
      const hasFirstName = record.first_name && record.first_name.trim();
      const hasEmail = record.email && record.email.trim();
      const hasPhone = record.phone && record.phone.trim();
      const isValid = hasFirstName && (hasEmail || hasPhone);
      if (!isValid) {
        console.log(`Record ${index + 1} is invalid:`, record);
      }
      return !isValid;
    });

    console.log("Invalid records:", invalidRecords);

    // Prepare contacts for insertion
    console.log("Preparing contacts for insertion...");
    const contacts = validRecords.map((record: any) => ({
      account_id: user.id,
      first_name: record.first_name?.trim() || null,
      last_name: record.last_name?.trim() || null,
      email: record.email?.trim() || null,
      phone: record.phone?.trim() || null,
      address_line1: record.address_line1?.trim() || null,
      address_line2: record.address_line2?.trim() || null,
      city: record.city?.trim() || null,
      state: record.state?.trim() || null,
      postal_code: record.postal_code?.trim() || null,
      country: record.country?.trim() || null,
      business_name: record.business_name?.trim() || null,
      notes: record.notes?.trim() || null,
      category: record.category?.trim() || null,
      status: "in_queue",
    }));

    console.log("Contacts to insert:", contacts);
    console.log("User ID:", user.id);
    if (contacts.length === 0) {
      console.log("No contacts to insert. Exiting early.");
    }

    // Insert contacts into the database
    console.log("Inserting contacts into database...");
    if (contacts.length > 0) {
      console.log("First contact data:", contacts[0]); // Log the first contact's data
    }
    console.log("User ID being used:", user.id); // Log the user ID

    const { data: insertedContacts, error: insertError } = await supabase
      .from("contacts")
      .insert(contacts)
      .select();

    console.log("Insert result:", insertedContacts);
    if (insertError) {
      console.error("Error inserting contacts:", insertError);
      console.error("Error details:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      return NextResponse.json(
        {
          error: "Failed to save contacts",
          details:
            insertError.message || "Database error while inserting contacts",
        },
        { status: 500 },
      );
    }

    console.log(
      `Successfully inserted ${insertedContacts?.length || 0} contacts:`,
      insertedContacts,
    );

    // Create reviews if any were provided in the CSV
    let totalReviewsCreated = 0;
    if (insertedContacts && insertedContacts.length > 0) {
      console.log("Processing reviews from CSV...");
      
      for (let i = 0; i < insertedContacts.length; i++) {
        const contact = insertedContacts[i];
        const record = validRecords[i];
        
        // Extract reviews from the record (up to 15 reviews)
        const reviews = [];
        for (let reviewIndex = 1; reviewIndex <= 15; reviewIndex++) {
          const contentKey = `review_${reviewIndex}_content`;
          const platformKey = `review_${reviewIndex}_platform`;
          
          if (record[contentKey]?.trim() && record[platformKey]?.trim()) {
            reviews.push({
              prompt_page_id: null, // No prompt page association for manual reviews
              contact_id: contact.id,
              platform: record[platformKey].trim(),
              review_content: record[contentKey].trim(),
              first_name: record[`review_${reviewIndex}_reviewer_first_name`]?.trim() || null,
              last_name: record[`review_${reviewIndex}_reviewer_last_name`]?.trim() || null,
              reviewer_role: record[`review_${reviewIndex}_reviewer_role`]?.trim() || null,
              star_rating: record[`review_${reviewIndex}_rating`] ? parseInt(record[`review_${reviewIndex}_rating`]) : null,
              created_at: record[`review_${reviewIndex}_date`] || new Date().toISOString(),
              status: "submitted",
              verified: true, // Manual reviews are verified by default
              emoji_sentiment_selection: null, // Not applicable for manual reviews
            });
          }
        }
        
        // Insert reviews for this contact
        if (reviews.length > 0) {
          console.log(`Creating ${reviews.length} reviews for contact ${contact.id}`);
          const { error: reviewInsertError } = await supabase
            .from("review_submissions")
            .insert(reviews);
          
          if (reviewInsertError) {
            console.error(`Error inserting reviews for contact ${contact.id}:`, reviewInsertError);
          } else {
            totalReviewsCreated += reviews.length;
            console.log(`Successfully created ${reviews.length} reviews for contact ${contact.id}`);
          }
        }
      }
    }

    return NextResponse.json({
      message: "Successfully uploaded contacts",
      contactsCreated: insertedContacts?.length || 0,
      reviewsCreated: totalReviewsCreated,
    });
  } catch (error) {
    console.error("Error processing upload:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
