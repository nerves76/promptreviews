/**
 * Authentication Issue Debugging Utility
 * Identifies common authentication problems automatically
 */

require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function debugAuthIssues() {
  console.log('🔍 AUTHENTICATION ISSUE DEBUGGING');
  console.log('==================================\n');

  const issues = [];
  const warnings = [];

  // Check 1: Verify API route exists
  console.log('📍 Check 1: API Route Configuration');
  const apiRoutePath = path.join(process.cwd(), 'src/app/api/auth/signin/route.ts');
  if (fs.existsSync(apiRoutePath)) {
    console.log('✅ API route file exists');
    
    // Check route content
    const content = fs.readFileSync(apiRoutePath, 'utf8');
    if (content.includes('export async function POST')) {
      console.log('✅ POST handler defined');
    } else {
      issues.push('❌ POST handler missing in API route');
    }
    
    if (content.includes('supabase.auth.signInWithPassword')) {
      console.log('✅ Supabase auth integration present');
    } else {
      issues.push('❌ Supabase auth call missing');
    }
  } else {
    issues.push('❌ API route file missing: ' + apiRoutePath);
  }

  // Check 2: Middleware Configuration
  console.log('\n📍 Check 2: Middleware Configuration');
  const middlewarePath = path.join(process.cwd(), 'src/middleware.ts');
  if (fs.existsSync(middlewarePath)) {
    const content = fs.readFileSync(middlewarePath, 'utf8');
    
    if (content.includes('createServerClient')) {
      console.log('✅ Server client creation found');
    } else {
      issues.push('❌ Server client creation missing');
    }
    
    // Check for old manual cookie logic
    if (content.includes('sb-access-token') || content.includes('sb-refresh-token')) {
      warnings.push('⚠️ Manual cookie references still present in middleware');
    } else {
      console.log('✅ Manual cookie references removed');
    }
    
    // Check for session validation
    if (content.includes('getSession()')) {
      console.log('✅ Session validation present');
    } else {
      issues.push('❌ Session validation missing');
    }
  } else {
    issues.push('❌ Middleware file missing');
  }

  // Check 3: Supabase Client Configuration
  console.log('\n📍 Check 3: Supabase Client Configuration');
  const clientPath = path.join(process.cwd(), 'src/utils/supabaseClient.ts');
  if (fs.existsSync(clientPath)) {
    const content = fs.readFileSync(clientPath, 'utf8');
    
    if (content.includes('persistSession: true')) {
      console.log('✅ Session persistence enabled');
    } else {
      warnings.push('⚠️ Session persistence not explicitly enabled');
    }
    
    if (content.includes('autoRefreshToken: true')) {
      console.log('✅ Auto refresh enabled');
    } else {
      warnings.push('⚠️ Auto refresh not explicitly enabled');
    }
    
    // Check for singleton pattern
    if (content.includes('let supabaseInstance')) {
      console.log('✅ Singleton pattern implemented');
    } else {
      warnings.push('⚠️ Singleton pattern not clearly implemented');
    }
  } else {
    issues.push('❌ Supabase client file missing');
  }

  // Check 4: Sign-in Page Configuration
  console.log('\n📍 Check 4: Sign-in Page Configuration');
  const signinPath = path.join(process.cwd(), 'src/app/auth/sign-in/page.tsx');
  if (fs.existsSync(signinPath)) {
    const content = fs.readFileSync(signinPath, 'utf8');
    
    // Check if manual cookie setting was removed
    if (content.includes('document.cookie = `sb-access-token')) {
      issues.push('❌ Manual cookie setting still present in sign-in page');
    } else {
      console.log('✅ Manual cookie setting removed');
    }
    
    // Check for API call
    if (content.includes('/api/auth/signin')) {
      console.log('✅ API call to signin endpoint present');
    } else {
      issues.push('❌ API call to signin endpoint missing');
    }
    
    // Check for proper error handling
    if (content.includes('catch') && content.includes('error')) {
      console.log('✅ Error handling present');
    } else {
      warnings.push('⚠️ Error handling might be insufficient');
    }
  } else {
    issues.push('❌ Sign-in page missing');
  }

  // Check 5: Environment Variables
  console.log('\n📍 Check 5: Environment Variables');
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_URL set');
  } else {
    issues.push('❌ NEXT_PUBLIC_SUPABASE_URL missing');
  }
  
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY set');
  } else {
    issues.push('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY missing');
  }

  // Check 6: Debug Tools
  console.log('\n📍 Check 6: Debug Tools Status');
  const debugPaths = [
    'src/app/debug-cookies/page.tsx',
    'src/app/auth-test/page.tsx'
  ];
  
  debugPaths.forEach(debugPath => {
    const fullPath = path.join(process.cwd(), debugPath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ Debug tool available: /${debugPath.split('/').slice(-2, -1)[0]}`);
    } else {
      warnings.push(`⚠️ Debug tool missing: ${debugPath}`);
    }
  });

  // Summary
  console.log('\n🏁 DEBUGGING SUMMARY');
  console.log('====================');
  
  if (issues.length === 0 && warnings.length === 0) {
    console.log('🎉 No issues found! Configuration looks good.');
  } else {
    if (issues.length > 0) {
      console.log('\n❌ CRITICAL ISSUES FOUND:');
      issues.forEach(issue => console.log(`  ${issue}`));
    }
    
    if (warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      warnings.forEach(warning => console.log(`  ${warning}`));
    }
  }

  // Recommendations
  console.log('\n💡 NEXT STEPS:');
  if (issues.length > 0) {
    console.log('1. Fix critical issues listed above');
    console.log('2. Run the automated auth test: node scripts/test-auth-flow.js');
    console.log('3. Test sign-in flow manually if needed');
  } else {
    console.log('1. Run the automated auth test: node scripts/test-auth-flow.js');
    console.log('2. If issues persist, check server logs during auth attempts');
  }

  return { issues, warnings };
}

// Run if called directly
if (require.main === module) {
  debugAuthIssues().catch(console.error);
}

module.exports = { debugAuthIssues }; 