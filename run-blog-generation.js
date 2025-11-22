#!/usr/bin/env node
/**
 * Script to manually trigger blog generation locally
 * This simulates the cron job running locally
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from frontend/.env manually
const envPath = join(__dirname, 'frontend', '.env');
const envContent = readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

async function triggerBlogGeneration() {
  const port = process.env.PORT || 3000;
  const cronSecret = process.env.CRON_SECRET || 'local-dev-secret';
  const url = `http://localhost:${port}/api/cron/generate-daily-blog`;
  
  console.log('🤖 Triggering blog generation locally...');
  console.log(`📡 URL: ${url}`);
  console.log(`🔑 Using CRON_SECRET from .env\n`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Request failed:', response.status, response.statusText);
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('✅ Blog generation successful!\n');
    console.log('📄 Response:', JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\n💡 Make sure your Next.js dev server is running:');
    console.error('   cd frontend && bun run dev\n');
    process.exit(1);
  }
}

triggerBlogGeneration();
