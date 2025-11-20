#!/usr/bin/env node

/**
 * Manual Blog Post Generation Script
 * Triggers the cron endpoint to generate a blog post immediately
 * 
 * Usage:
 *   node scripts/generate-blog.js
 *   CRON_SECRET=xxx node scripts/generate-blog.js
 */

import https from 'https';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  });
  console.log('✓ Loaded environment variables from .env\n');
}

// Configuration
const CRON_SECRET = process.env.CRON_SECRET || 'your-cron-secret-here';
const API_URL = process.env.API_URL || 'http://localhost:3000';
const endpoint = '/api/cron/generate-daily-blog';

console.log('🚀 Triggering blog generation...');
console.log(`📡 API URL: ${API_URL}${endpoint}\n`);

// Parse URL
const url = new URL(API_URL + endpoint);
const client = url.protocol === 'https:' ? https : http;

// Make request
const options = {
  hostname: url.hostname,
  port: url.port,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${CRON_SECRET}`,
    'Content-Type': 'application/json'
  }
};

const req = client.request(options, (res) => {
  let data = '';

  console.log(`📊 HTTP Status: ${res.statusCode}\n`);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('📝 Response:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response.success) {
        console.log('\n✅ Blog generation completed successfully!');
        console.log(`📄 Title: ${response.post?.title}`);
        console.log(`🔗 Slug: ${response.post?.slug}`);
        console.log(`📅 Published: ${response.post?.published_at}`);
      } else {
        console.error('\n❌ Blog generation failed!');
        console.error(`Error: ${response.error || response.message}`);
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Failed to parse response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.end();
