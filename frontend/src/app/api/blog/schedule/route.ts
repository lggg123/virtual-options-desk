// app/api/blog/schedule/route.ts
import { NextRequest, NextRe      })
    });
    
  } catch {
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    ); from 'next/server';
import { getBlogAgent } from '@/lib/blog';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, schedule, apiKey } = body;
    
    const blogAgent = getBlogAgent(apiKey);
    
    switch (action) {
      case 'start':
        blogAgent.startDailySchedule(schedule);
        return NextResponse.json({
          success: true,
          message: 'Daily blog schedule started',
          status: blogAgent.getStatus()
        });
        
      case 'stop':
        blogAgent.stopDailySchedule();
        return NextResponse.json({
          success: true,
          message: 'Daily blog schedule stopped',
          status: blogAgent.getStatus()
        });
        
      case 'status':
        return NextResponse.json({
          success: true,
          status: blogAgent.getStatus()
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use "start", "stop", or "status".' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Blog schedule API error:', error);
    return NextResponse.json(
      { error: 'Schedule operation failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const blogAgent = getBlogAgent();
    const status = blogAgent.getStatus();
    
    return NextResponse.json({
      success: true,
      status,
      info: {
        description: 'Blog scheduling service',
        defaultSchedule: '0 9 * * 1-5', // 9 AM weekdays
        timezone: 'America/New_York'
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}