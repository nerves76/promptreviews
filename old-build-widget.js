const { build } = require('esbuild');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined in .env.local');
  process.exit(1);
}

build({
  entryPoints: [path.resolve(__dirname, 'src/widget-embed/index.tsx')],
  bundle: true,
  outfile: path.resolve(__dirname, 'public/widget.js'),
  platform: 'browser',
  target: ['es2015'],
  format: 'iife',
  minify: true,
  sourcemap: true,
  define: {
    'process.env.NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(supabaseUrl),
    'process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
  },
}).catch(() => process.exit(1)); 