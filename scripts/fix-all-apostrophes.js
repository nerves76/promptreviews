#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix a single file
function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Fix contractions in any context
  const replacements = [
    [/isn't/g, "is not"],
    [/doesn't/g, "does not"],
    [/won't/g, "will not"],
    [/can't/g, "cannot"],
    [/it's/g, "it is"],
    [/It's/g, "It is"],
    [/they're/g, "they are"],
    [/They're/g, "They are"],
    [/we're/g, "we are"],
    [/We're/g, "We are"],
    [/you're/g, "you are"],
    [/You're/g, "You are"],
    [/that's/g, "that is"],
    [/That's/g, "That is"],
    [/there's/g, "there is"],
    [/There's/g, "There is"],
    [/what's/g, "what is"],
    [/What's/g, "What is"],
    [/who's/g, "who is"],
    [/Who's/g, "Who is"],
    [/here's/g, "here is"],
    [/Here's/g, "Here is"],
    [/let's/g, "let us"],
    [/Let's/g, "Let us"],
    [/haven't/g, "have not"],
    [/Haven't/g, "Have not"],
    [/hasn't/g, "has not"],
    [/Hasn't/g, "Has not"],
    [/hadn't/g, "had not"],
    [/Hadn't/g, "Had not"],
    [/weren't/g, "were not"],
    [/Weren't/g, "Were not"],
    [/wasn't/g, "was not"],
    [/Wasn't/g, "Was not"],
    [/aren't/g, "are not"],
    [/Aren't/g, "Are not"],
    [/wouldn't/g, "would not"],
    [/Wouldn't/g, "Would not"],
    [/couldn't/g, "could not"],
    [/Couldn't/g, "Could not"],
    [/shouldn't/g, "should not"],
    [/Shouldn't/g, "Should not"],
    [/didn't/g, "did not"],
    [/Didn't/g, "Did not"],
    [/don't/g, "do not"],
    [/Don't/g, "Do not"],
    [/I'm/g, "I am"],
    [/I've/g, "I have"],
    [/I'll/g, "I will"],
    [/I'd/g, "I would"],
    [/we've/g, "we have"],
    [/We've/g, "We have"],
    [/we'll/g, "we will"],
    [/We'll/g, "We will"],
    [/we'd/g, "we would"],
    [/We'd/g, "We would"],
    [/you've/g, "you have"],
    [/You've/g, "You have"],
    [/you'll/g, "you will"],
    [/You'll/g, "You will"],
    [/you'd/g, "you would"],
    [/You'd/g, "You would"],
    [/they've/g, "they have"],
    [/They've/g, "They have"],
    [/they'll/g, "they will"],
    [/They'll/g, "They will"],
    [/they'd/g, "they would"],
    [/They'd/g, "They would"]
  ];

  const originalContent = content;

  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }

  if (content !== originalContent) {
    changed = true;
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
  } else {
    console.log(`✓ No changes needed: ${path.relative(process.cwd(), filePath)}`);
  }

  return changed;
}

// Find all page.tsx files
const docsDir = '/Users/chris/promptreviews/docs-promptreviews/docs-site/src/app/google-biz-optimizer';

const files = [
  'metrics/average-rating/page.tsx',
  'metrics/review-trends/page.tsx',
  'metrics/monthly-patterns/page.tsx',
  'optimization/seo-score/page.tsx',
  'optimization/categories/page.tsx',
  'optimization/services/page.tsx',
  'optimization/photos/page.tsx',
  'optimization/quick-wins/page.tsx',
  'engagement/review-responses/page.tsx',
  'engagement/questions-answers/page.tsx',
  'engagement/posts/page.tsx',
  'performance/customer-actions/page.tsx'
];

console.log('Fixing apostrophes in all Google Biz Optimizer pages...\n');

let changedCount = 0;
files.forEach(file => {
  const fullPath = path.join(docsDir, file);
  if (fs.existsSync(fullPath)) {
    if (fixFile(fullPath)) {
      changedCount++;
    }
  }
});

console.log(`\n✨ Fixed ${changedCount} files!`);