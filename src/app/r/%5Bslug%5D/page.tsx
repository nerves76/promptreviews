        if (businessProfile && businessProfile.background_type === 'gradient') {
          gradientStyle = {
            background: `linear-gradient(135deg, ${businessProfile.gradient_start || '#667eea'} 0%, ${businessProfile.gradient_middle || '#764ba2'} 50%, ${businessProfile.gradient_end || '#f093fb'} 100%)`
          };
        }