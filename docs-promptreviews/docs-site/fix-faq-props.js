const fs = require('fs');
const path = require('path');

const files = [
  'src/app/business-profile/page.tsx',
  'src/app/style-settings/page.tsx',
  'src/app/contacts/page.tsx',
  'src/app/team/page.tsx',
  'src/app/billing/page.tsx',
  'src/app/analytics/page.tsx',
  'src/app/google-business/page.tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove lines with faqPageTitle and faqPageUrl
  content = content.split('\n').filter(line => {
    return !line.includes('faqPageTitle=') && !line.includes('faqPageUrl=');
  }).join('\n');

  fs.writeFileSync(filePath, content);
  console.log(`Fixed: ${file}`);
});

console.log('All files fixed!');