#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase for Errdaycoin...\n');

// Check if .env.local exists
const envPath = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env.local file...');
  const envTemplate = `# Site Configuration
NEXT_PUBLIC_SITE_NAME="Errdaycoin"
NEXT_PUBLIC_DEFAULT_LANG=ko
NEXT_PUBLIC_I18N_LOCALES=en,ko,ja,zh,es,fr
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Supabase Configuration
# Replace these with your actual Supabase project credentials
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Development
NODE_ENV=development
`;
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env.local file');
}

console.log('\n📋 Next steps:');
console.log('1. Create a Supabase project at https://supabase.com');
console.log('2. Update your .env.local file with your project credentials');
console.log('3. Run the database migrations:');
console.log('   - Copy the content of supabase/migrations/001_initial_schema.sql');
console.log('   - Copy the content of supabase/migrations/002_market_data_schema.sql');
console.log('   - Paste and run them in your Supabase SQL Editor');
console.log('4. Run: npm run dev');

console.log('\n🎉 Setup complete! Happy coding!');
