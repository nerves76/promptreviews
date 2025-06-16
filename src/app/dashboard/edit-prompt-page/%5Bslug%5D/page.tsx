        setReviews(data || []);
        
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          // Log current user UID for debugging
        }