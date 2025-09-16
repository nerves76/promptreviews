#!/bin/bash

# Update imports script for auth module reorganization

echo "Updating auth import paths..."

# Update AuthContext imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "src/auth/*" -not -path "src/contexts/AuthContext.tsx" -exec sed -i '' \
  -e "s|from '@/contexts/AuthContext'|from '@/auth'|g" \
  -e "s|from '../contexts/AuthContext'|from '../auth'|g" \
  -e "s|from '../../contexts/AuthContext'|from '../../auth'|g" \
  -e "s|from '../../../contexts/AuthContext'|from '../../../auth'|g" \
  {} +

# Update BusinessGuard imports  
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "src/auth/*" -not -path "src/components/BusinessGuard.tsx" -exec sed -i '' \
  -e "s|from '@/components/BusinessGuard'|from '@/auth/guards/BusinessGuard'|g" \
  -e "s|from '../components/BusinessGuard'|from '../auth/guards/BusinessGuard'|g" \
  -e "s|from '../../components/BusinessGuard'|from '../../auth/guards/BusinessGuard'|g" \
  {} +

# Update admin utility imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "src/auth/*" -not -path "src/utils/admin.ts" -exec sed -i '' \
  -e "s|from '@/utils/admin'|from '@/auth/utils/admin'|g" \
  -e "s|from '../utils/admin'|from '../auth/utils/admin'|g" \
  -e "s|from '../../utils/admin'|from '../../auth/utils/admin'|g" \
  -e "s|from '../../../utils/admin'|from '../../../auth/utils/admin'|g" \
  {} +

# Update accountUtils imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "src/auth/*" -not -path "src/utils/accountUtils.ts" -exec sed -i '' \
  -e "s|from '@/utils/accountUtils'|from '@/auth/utils/accounts'|g" \
  -e "s|from '../utils/accountUtils'|from '../auth/utils/accounts'|g" \
  -e "s|from '../../utils/accountUtils'|from '../../auth/utils/accounts'|g" \
  -e "s|from '../../../utils/accountUtils'|from '../../../auth/utils/accounts'|g" \
  -e "s|from './accountUtils'|from '@/auth/utils/accounts'|g" \
  {} +

# Update accountSelection imports
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "src/auth/*" -not -path "src/utils/accountSelection.ts" -exec sed -i '' \
  -e "s|from '@/utils/accountSelection'|from '@/auth/utils/accountSelection'|g" \
  -e "s|from '../utils/accountSelection'|from '../auth/utils/accountSelection'|g" \
  -e "s|from '../../utils/accountSelection'|from '../../auth/utils/accountSelection'|g" \
  -e "s|from './accountSelection'|from '@/auth/utils/accountSelection'|g" \
  {} +

# Update supabaseClient imports  
find src -type f \( -name "*.ts" -o -name "*.tsx" \) -not -path "src/auth/*" -not -path "src/utils/supabaseClient.ts" -exec sed -i '' \
  -e "s|from '@/utils/supabaseClient'|from '@/auth/providers/supabase'|g" \
  -e "s|from '../utils/supabaseClient'|from '../auth/providers/supabase'|g" \
  -e "s|from '../../utils/supabaseClient'|from '../../auth/providers/supabase'|g" \
  -e "s|from '../../../utils/supabaseClient'|from '../../../auth/providers/supabase'|g" \
  -e "s|from './supabaseClient'|from '@/auth/providers/supabase'|g" \
  -e "s|from \"./supabaseClient\"|from '@/auth/providers/supabase'|g" \
  {} +

echo "Import paths updated!"