#!/usr/bin/env node
/**
 * Test script for Blog Agent with CrewAI integration
 */

import { getBlogAgent } from './src/lib/blog/index.js';

async function testBlogAgent() {
  console.log('🤖 Testing Blog Agent...\n');
  
  try {
    // Initialize blog agent
    const blogAgent = getBlogAgent();
    
    console.log('📊 Generating daily market blog...');
    const dailyBlog = await blogAgent.generateDailyBlog();
    
    console.log('\n✅ Daily Blog Generated:');
    console.log('========================');
    console.log(`📰 Title: ${dailyBlog.title}`);
    console.log(`📝 Summary: ${dailyBlog.summary}`);
    console.log(`⏱️  Reading Time: ${dailyBlog.readingTime} minutes`);
    console.log(`🏷️  Tags: ${dailyBlog.tags.join(', ')}`);
    console.log(`📅 Published: ${dailyBlog.publishedAt.toLocaleString()}`);
    
    if (dailyBlog.marketData) {
      console.log('\n📈 Market Analysis:');
      console.log(`   Trend: ${dailyBlog.marketData.trend.toUpperCase()}`);
      console.log(`   Confidence: ${Math.round(dailyBlog.marketData.confidence * 100)}%`);
      console.log(`   Reasoning: ${dailyBlog.marketData.reasoning.substring(0, 100)}...`);
    }
    
    console.log('\n📄 Content Preview:');
    console.log('=' + '='.repeat(50));
    console.log(dailyBlog.content.substring(0, 500) + '...\n');
    
    // Test custom blog generation
    console.log('🎯 Generating custom blog about "Options Strategies"...');
    const customBlog = await blogAgent.generateCustomBlog('Options Strategies');
    
    console.log('\n✅ Custom Blog Generated:');
    console.log('=========================');
    console.log(`📰 Title: ${customBlog.title}`);
    console.log(`📝 Summary: ${customBlog.summary}`);
    console.log(`⏱️  Reading Time: ${customBlog.readingTime} minutes`);
    console.log(`🏷️  Tags: ${customBlog.tags.join(', ')}`);
    
    console.log('\n📄 Custom Content Preview:');
    console.log('=' + '='.repeat(50));
    console.log(customBlog.content.substring(0, 400) + '...\n');
    
    // Test scheduler status
    console.log('📅 Scheduler Status:');
    const status = blogAgent.getStatus();
    console.log(`   Running: ${status.isRunning}`);
    console.log(`   Next Run: ${status.nextRun || 'Not scheduled'}`);
    console.log(`   API Key: ${status.hasApiKey ? 'Configured' : 'Not configured'}`);
    
    console.log('\n🎉 Blog Agent test completed successfully!');
    console.log('\n💡 To start daily scheduling, call: blogAgent.startDailySchedule()');
    
  } catch (error) {
    console.error('\n❌ Blog Agent test failed:', error.message);
    process.exit(1);
  }
}

// Run test
testBlogAgent();