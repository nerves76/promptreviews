#!/usr/bin/env ts-node
/**
 * Fix incorrectly placed ISR revalidation statements
 * They were inserted inside import blocks - need to move them after imports
 */

import * as fs from 'fs'
import * as path from 'path'
import { execSync } from 'child_process'

// Get all files that were modified in the last commit
const modifiedFiles = execSync('git diff --name-only HEAD~1 HEAD', { encoding: 'utf-8' })
  .split('\n')
  .filter(f => f.endsWith('page.tsx') && f.includes('src/app/'))
  .filter(f => !f.includes('ai-reviews')) // Skip ai-reviews, it was done correctly

console.log(`Found ${modifiedFiles.length} files to fix\n`)

function fixFile(filePath: string) {
  const fullPath = path.join(process.cwd(), filePath)

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  File not found: ${filePath}`)
    return false
  }

  let content = fs.readFileSync(fullPath, 'utf-8')

  // Remove the incorrectly placed revalidation block
  const badPattern = /\n+\/\/ Revalidate every 60 seconds - allows CMS updates to show without redeployment\nexport const revalidate = 60\n*/g
  content = content.replace(badPattern, '\n')

  // Find where to insert it correctly
  const lines = content.split('\n')
  let insertIndex = -1

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Skip empty lines and comments
    if (!line || line.startsWith('//') || line.startsWith('/*') || line.startsWith('*')) {
      continue
    }

    // If we're in an import block, skip to the end
    if (line.startsWith('import ') && line.includes('{') && !line.includes('}')) {
      // Multi-line import - find the closing }
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].includes('}')) {
          i = j
          insertIndex = j + 1
          break
        }
      }
      continue
    }

    // Single-line import
    if (line.startsWith('import ')) {
      insertIndex = i + 1
      continue
    }

    // If we hit a non-import statement, stop
    if (!line.startsWith('import ')) {
      break
    }
  }

  if (insertIndex === -1) {
    console.log(`⚠️  Could not find insertion point: ${filePath}`)
    return false
  }

  // Insert at correct position
  lines.splice(insertIndex, 0, '', '// Revalidate every 60 seconds - allows CMS updates to show without redeployment', 'export const revalidate = 60')

  fs.writeFileSync(fullPath, lines.join('\n'), 'utf-8')
  console.log(`✅ Fixed: ${filePath}`)
  return true
}

let fixed = 0
for (const file of modifiedFiles) {
  if (fixFile(file)) {
    fixed++
  }
}

console.log(`\n✅ Fixed ${fixed}/${modifiedFiles.length} files`)
