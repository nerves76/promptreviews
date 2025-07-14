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

  // Check 1: Verify Supabase Authentication Configuration
  console.log('📍 Check 1: Supabase Authentication Configuration');
  const signinPath = path.join(process.cwd(), 'src/app/auth/sign-in/page.tsx');
  const authContextPath = path.join(process.cwd(), 'src/contexts/AuthContext.tsx');
  
  if (fs.existsSync(signinPath)) {
    console.log('✅ Sign-in page exists');
    
    // Check for proper authentication pattern (either direct or through AuthContext)
    const signinContent = fs.readFileSync(signinPath, 'utf8');
    const hasDirectAuth = signinContent.includes('supabase.auth.signInWithPassword');
    const hasAuthContext = signinContent.includes('useAuth()') || signinContent.includes('signIn(');
    
    if (hasDirectAuth || hasAuthContext) {
      console.log('✅ Authentication pattern found');
      
      // If using AuthContext, verify it has proper Supabase calls
      if (hasAuthContext && fs.existsSync(authContextPath)) {
        const authContent = fs.readFileSync(authContextPath, 'utf8');
        if (authContent.includes('supabase.auth.signInWithPassword')) {
          console.log('✅ AuthContext has proper Supabase authentication');
        } else {
          issues.push('❌ AuthContext missing Supabase authentication');
        }
      }
    } else {
      issues.push('❌ No authentication pattern found');
    }
    
    // Check that old API route calls are removed
    if (signinContent.includes('/api/auth/signin')) {
      warnings.push('⚠️ Old API route call still present in sign-in page');
    } else {
      console.log('✅ Old API route calls removed');
    }
  } else {
    issues.push('❌ Sign-in page missing');
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
    if (content.includes('getUser()')) {
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
    if (content.includes('_browserClient')) {
      console.log('✅ Singleton pattern implemented');
    } else {
      warnings.push('⚠️ Singleton pattern not clearly implemented');
    }
  } else {
    issues.push('❌ Supabase client file missing');
  }

  // Check 4: Session API Endpoint
  console.log('\n📍 Check 4: Session Validation API');
  const sessionApiPath = path.join(process.cwd(), 'src/app/api/auth/session/route.ts');
  if (fs.existsSync(sessionApiPath)) {
    console.log('✅ Session API endpoint exists');
    
    const content = fs.readFileSync(sessionApiPath, 'utf8');
    if (content.includes('getUser()')) {
      console.log('✅ Session validation logic present');
    } else {
      issues.push('❌ Session validation logic missing');
    }
  } else {
    issues.push('❌ Session API endpoint missing');
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
    console.log('2. Test sign-in flow manually with valid credentials');
    console.log('3. Check browser console for detailed error messages');
  } else {
    console.log('1. Test sign-in flow manually with valid credentials');
    console.log('2. If issues persist, check server logs during auth attempts');
  }

  return { issues, warnings };
}

// Run if called directly
if (require.main === module) {
  debugAuthIssues().catch(console.error);
}

module.exports = { debugAuthIssues }; 