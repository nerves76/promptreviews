#!/bin/bash

# Files that need inline loaders replaced
files=(
  "src/app/prompt-pages/page.tsx"
  "src/app/dashboard/reviews/page.tsx"
  "src/app/dashboard/analytics/page.tsx"
  "src/app/dashboard/business-profile/page.tsx"
  "src/app/dashboard/page.tsx"
  "src/app/dashboard/account/page.tsx"
)

for file in "${files[@]}"; do
  echo "Processing $file..."
  
  # Check if InlineLoader is already imported
  if ! grep -q "InlineLoader" "$file"; then
    # Add import after existing imports
    if grep -q "import.*AppLoader" "$file"; then
      # Replace AppLoader import with InlineLoader
      sed -i '' "s|import AppLoader from.*|import InlineLoader from \"@/app/components/InlineLoader\";|" "$file"
    else
      # Add new import at the top after "use client" if present
      if grep -q '"use client"' "$file"; then
        sed -i '' '/"use client"/a\
import InlineLoader from "@/app/components/InlineLoader";
' "$file"
      else
        # Add at the very top
        sed -i '' '1i\
import InlineLoader from "@/app/components/InlineLoader";
' "$file"
      fi
    fi
  fi
  
  # Replace AppLoader usage in min-h-[400px] divs with InlineLoader
  sed -i '' 's|<AppLoader />|<InlineLoader showText={true} />|g' "$file"
done

echo "✅ Fixed inline loaders in dashboard pages"