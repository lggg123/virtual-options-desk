#!/usr/bin/env node
/**
 * Script to delete blog posts from Supabase
 * Usage: node delete-blog-post.js [date or id]
 */

import { createClient } from '@supabase/supabase-js';
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

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in frontend/.env');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listBlogPosts() {
  console.log('\n📚 Fetching blog posts...\n');
  
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id, title, slug, published_at, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ Error fetching posts:', error.message);
    return [];
  }

  if (!data || data.length === 0) {
    console.log('No blog posts found.');
    return [];
  }

  console.log('Recent blog posts:');
  console.log('─'.repeat(80));
  data.forEach((post, idx) => {
    const date = new Date(post.published_at || post.created_at);
    console.log(`${idx + 1}. ID: ${post.id}`);
    console.log(`   Title: ${post.title}`);
    console.log(`   Slug: ${post.slug}`);
    console.log(`   Date: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`);
    console.log('─'.repeat(80));
  });

  return data;
}

async function deleteBlogPost(identifier) {
  // Check if identifier is a UUID (id) or date/slug
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
  
  let query = supabase.from('blog_posts').delete();
  
  if (isUUID) {
    console.log(`\n🗑️  Deleting blog post with ID: ${identifier}...`);
    query = query.eq('id', identifier);
  } else {
    // Try to match by date (YYYY-MM-DD format)
    const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(identifier);
    if (dateMatch) {
      console.log(`\n🗑️  Deleting blog posts from date: ${identifier}...`);
      const startDate = new Date(identifier);
      const endDate = new Date(identifier);
      endDate.setDate(endDate.getDate() + 1);
      
      query = query
        .gte('published_at', startDate.toISOString())
        .lt('published_at', endDate.toISOString());
    } else {
      // Try slug
      console.log(`\n🗑️  Deleting blog post with slug: ${identifier}...`);
      query = query.eq('slug', identifier);
    }
  }

  const { data, error } = await query.select();

  if (error) {
    console.error('❌ Error deleting post:', error.message);
    return false;
  }

  if (!data || data.length === 0) {
    console.log('❌ No blog post found matching:', identifier);
    return false;
  }

  console.log(`✅ Successfully deleted ${data.length} blog post(s):`);
  data.forEach(post => {
    console.log(`   - ${post.title} (ID: ${post.id})`);
  });
  
  return true;
}

// Main execution
const args = process.argv.slice(2);
const command = args[0];

if (!command || command === 'list') {
  await listBlogPosts();
} else if (command === 'delete' && args[1]) {
  const identifier = args[1];
  await deleteBlogPost(identifier);
} else if (command === 'delete-today') {
  const today = new Date().toISOString().split('T')[0];
  console.log(`Deleting today's blog post (${today})...`);
  await deleteBlogPost(today);
} else {
  console.log(`
Usage:
  node delete-blog-post.js list              # List recent blog posts
  node delete-blog-post.js delete <id>       # Delete by ID
  node delete-blog-post.js delete <date>     # Delete by date (YYYY-MM-DD)
  node delete-blog-post.js delete <slug>     # Delete by slug
  node delete-blog-post.js delete-today      # Delete today's post
  `);
}
