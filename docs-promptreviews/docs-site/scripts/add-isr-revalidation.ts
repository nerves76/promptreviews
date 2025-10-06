#!/usr/bin/env ts-node
/**
 * Add ISR revalidation to all CMS-connected pages
 * This allows CMS updates to appear without redeployment
 */

import * as fs from 'fs'
import * as path from 'path'

const filesToUpdate = [
  'src/app/advanced/page.tsx',
  'src/app/analytics/page.tsx',
  'src/app/api/page.tsx',
  'src/app/api/reference/page.tsx',
  'src/app/billing/page.tsx',
  'src/app/billing/upgrades-downgrades/page.tsx',
  'src/app/business-profile/page.tsx',
  'src/app/contacts/page.tsx',
  'src/app/faq/page.tsx',
  'src/app/features/page.tsx',
  'src/app/getting-started/account-setup/page.tsx',
  'src/app/getting-started/adding-contacts/page.tsx',
  'src/app/getting-started/choosing-plan/page.tsx',
  'src/app/getting-started/first-prompt-page/page.tsx',
  'src/app/getting-started/first-review-request/page.tsx',
  'src/app/getting-started/page.tsx',
  'src/app/getting-started/review-widget/page.tsx',
  'src/app/google-biz-optimizer/page.tsx',
  'src/app/google-business/bulk-updates/page.tsx',
  'src/app/google-business/business-info/page.tsx',
  'src/app/google-business/categories-services/page.tsx',
  'src/app/google-business/image-upload/page.tsx',
  'src/app/google-business/page.tsx',
  'src/app/google-business/review-import/page.tsx',
  'src/app/google-business/scheduling/page.tsx',
  'src/app/help/page.tsx',
  'src/app/integrations/page.tsx',
  'src/app/prompt-pages/page.tsx',
  'src/app/prompt-pages/settings/page.tsx',
  'src/app/prompt-pages/types/employee/page.tsx',
  'src/app/prompt-pages/types/event/page.tsx',
  'src/app/prompt-pages/types/page.tsx',
  'src/app/prompt-pages/types/photo/page.tsx',
  'src/app/prompt-pages/types/product/page.tsx',
  'src/app/prompt-pages/types/service/page.tsx',
  'src/app/prompt-pages/types/universal/page.tsx',
  'src/app/prompt-pages/types/video/page.tsx',
  'src/app/reviews/page.tsx',
  'src/app/settings/page.tsx',
  'src/app/strategies/double-dip/page.tsx',
  'src/app/strategies/non-ai-strategies/page.tsx',
  'src/app/strategies/novelty/page.tsx',
  'src/app/strategies/page.tsx',
  'src/app/strategies/personal-outreach/page.tsx',
  'src/app/strategies/reciprocity/page.tsx',
  'src/app/strategies/reviews-on-fly/page.tsx',
  'src/app/style-settings/page.tsx',
  'src/app/team/page.tsx',
  'src/app/troubleshooting/page.tsx',
  'src/app/widgets/page.tsx',
]

const revalidationBlock = `
// Revalidate every 60 seconds - allows CMS updates to show without redeployment
export const revalidate = 60
`

function addRevalidation(filePath: string) {
  const fullPath = path.join(process.cwd(), filePath)

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return
  }

  const content = fs.readFileSync(fullPath, 'utf-8')

  // Check if already has revalidate
  if (content.includes('export const revalidate')) {
    console.log(`✓  Already has revalidation: ${filePath}`)
    return
  }

  // Find the position after imports
  const lines = content.split('\n')
  let insertIndex = 0

  // Find last import or first export/const/function
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines and comments at the start
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue
    }

    // If we hit an import, update insert position
    if (line.startsWith('import ')) {
      insertIndex = i + 1
      continue
    }

    // If we hit anything else (export, const, function), we're past imports
    if (line.startsWith('export ') || line.startsWith('const ') ||
        line.startsWith('function ') || line.startsWith('interface ') ||
        line.startsWith('type ')) {
      break
    }
  }

  // Insert the revalidation block
  lines.splice(insertIndex, 0, revalidationBlock)

  const updatedContent = lines.join('\n')
  fs.writeFileSync(fullPath, updatedContent, 'utf-8')

  console.log(`✅ Added revalidation: ${filePath}`)
}

console.log('Adding ISR revalidation to CMS-connected pages...\n')

let successCount = 0
for (const file of filesToUpdate) {
  try {
    addRevalidation(file)
    successCount++
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error)
  }
}

console.log(`\n✅ Complete! Updated ${successCount}/${filesToUpdate.length} files`)
