/**
 * Test endpoint to verify ML service connection
 */

import { NextResponse } from 'next/server';

// Remove trailing slash from ML_SERVICE_URL to avoid double slashes
const ML_SERVICE_URL = (process.env.ML_SERVICE_URL || 'http://localhost:8002').replace(/\/$/, '');

export async function GET() {
  try {
    console.log('[ML Test] Testing ML service at:', ML_SERVICE_URL);
    
    // Test health endpoint
    const healthResponse = await fetch(`${ML_SERVICE_URL}/health`, {
      method: 'GET',
    });
    
    console.log('[ML Test] Health check status:', healthResponse.status);
    const healthData = await healthResponse.text();
    console.log('[ML Test] Health response:', healthData);

    // Test root endpoint
    const rootResponse = await fetch(`${ML_SERVICE_URL}/`, {
      method: 'GET',
    });
    
    console.log('[ML Test] Root endpoint status:', rootResponse.status);
    const rootData = await rootResponse.text();
    console.log('[ML Test] Root response:', rootData.substring(0, 500));

    return NextResponse.json({
      ml_service_url: ML_SERVICE_URL,
      health_check: {
        status: healthResponse.status,
        ok: healthResponse.ok,
        data: healthData
      },
      root_endpoint: {
        status: rootResponse.status,
        ok: rootResponse.ok,
        data: rootData.substring(0, 500)
      }
    });
  } catch (error) {
    console.error('[ML Test] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        ml_service_url: ML_SERVICE_URL
      },
      { status: 500 }
    );
  }
}
