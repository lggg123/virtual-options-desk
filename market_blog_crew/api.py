#!/usr/bin/env python
"""
Flask API wrapper for CrewAI Market Blog Generation
This service generates daily market analysis blog posts using a 5-agent AI crew
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import sys
import json
import logging
import time
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Configure logging to reduce verbosity
logging.basicConfig(
    level=logging.WARNING,  # Only show warnings and errors
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    stream=sys.stdout
)

# Suppress verbose libraries
logging.getLogger('crewai').setLevel(logging.WARNING)
logging.getLogger('langchain').setLevel(logging.ERROR)
logging.getLogger('langchain_core').setLevel(logging.ERROR)
logging.getLogger('langchain_google_genai').setLevel(logging.ERROR)
logging.getLogger('httpx').setLevel(logging.ERROR)
logging.getLogger('httpcore').setLevel(logging.ERROR)
logging.getLogger('urllib3').setLevel(logging.ERROR)
logging.getLogger('google').setLevel(logging.ERROR)

# Get Flask logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Import the CrewAI crew
from src.market_blog_crew.crew import MarketBlogCrew

app = Flask(__name__)
CORS(app)

# Security: Verify API key for authentication
API_KEY = os.getenv('CREWAI_API_KEY', 'your-secret-api-key-here')

def verify_api_key():
    """Verify the API key from request headers"""
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return False
    
    try:
        scheme, token = auth_header.split()
        if scheme.lower() != 'bearer':
            return False
        return token == API_KEY
    except:
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'CrewAI Market Blog Generator',
        'timestamp': datetime.now().isoformat()
    })

@app.route('/generate-blog', methods=['POST'])
def generate_blog():
    """
    Generate a comprehensive market analysis blog post using CrewAI
    
    Request body (optional):
        {
            "date": "2025-11-20"  // Optional: specify custom date, defaults to today
        }
    
    Returns:
        {
            "success": true,
            "blog": {
                "title": "...",
                "meta_description": "...",
                "content": "...",
                "tags": [...],
                "target_keywords": [...],
                "market_data": {
                    "date": "2025-11-20",
                    "sp500_level": 5321.45,
                    "vix_level": 14.85,
                    "top_sector": "Technology"
                }
            },
            "generated_at": "2025-11-20T08:00:00Z"
        }
    """
    # Verify API key
    if not verify_api_key():
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid or missing API key'}), 401
    
    try:
        # Get custom date if provided, otherwise use today
        data = request.get_json() or {}
        custom_date = data.get('date')
        
        if custom_date:
            current_date = custom_date
        else:
            current_date = datetime.now().strftime('%Y-%m-%d')
        
        logger.info(f"Starting blog generation for {current_date}")
        
        # Set up inputs for the crew
        inputs = {
            'current_date': current_date
        }
        
        # Run the CrewAI crew with retry logic for API overload
        max_retries = 3
        retry_delay = 10  # seconds
        
        for attempt in range(max_retries):
            try:
                crew = MarketBlogCrew().crew()
                result = crew.kickoff(inputs=inputs)
                break  # Success, exit retry loop
            except Exception as e:
                error_msg = str(e)
                if '503' in error_msg or 'overloaded' in error_msg.lower():
                    if attempt < max_retries - 1:
                        wait_time = retry_delay * (attempt + 1)
                        logger.warning(f"API overloaded (attempt {attempt + 1}/{max_retries}). Retrying in {wait_time}s...")
                        time.sleep(wait_time)
                        continue
                raise  # Re-raise if not a 503 or last attempt
        
        # Parse the structured text output
        output_text = str(result.raw) if hasattr(result, 'raw') else str(result)
        
        # Extract fields using simple parsing
        blog_data = {
            'title': '',
            'meta_description': '',
            'content': '',
            'tags': [],
            'target_keywords': [],
            'market_data': {
                'date': current_date,
                'sp500_level': 0.0,
                'vix_level': 0.0,
                'top_sector': ''
            }
        }
        
        # Parse the output
        lines = output_text.split('\n')
        current_section = None
        content_lines = []
        
        for line in lines:
            if line.startswith('TITLE:'):
                blog_data['title'] = line.replace('TITLE:', '').strip()
            elif line.startswith('META_DESCRIPTION:'):
                blog_data['meta_description'] = line.replace('META_DESCRIPTION:', '').strip()
            elif line.startswith('TAGS:'):
                tags_str = line.replace('TAGS:', '').strip()
                blog_data['tags'] = [t.strip() for t in tags_str.split(',') if t.strip()]
            elif line.startswith('KEYWORDS:'):
                keywords_str = line.replace('KEYWORDS:', '').strip()
                blog_data['target_keywords'] = [k.strip() for k in keywords_str.split(',') if k.strip()]
            elif line.startswith('SP500_LEVEL:'):
                try:
                    blog_data['market_data']['sp500_level'] = float(line.replace('SP500_LEVEL:', '').strip())
                except:
                    pass
            elif line.startswith('VIX_LEVEL:'):
                try:
                    blog_data['market_data']['vix_level'] = float(line.replace('VIX_LEVEL:', '').strip())
                except:
                    pass
            elif line.startswith('TOP_SECTOR:'):
                blog_data['market_data']['top_sector'] = line.replace('TOP_SECTOR:', '').strip()
            elif line.startswith('CONTENT:'):
                current_section = 'content'
            elif current_section == 'content':
                content_lines.append(line)
        
        blog_data['content'] = '\n'.join(content_lines).strip()
        
        # Also save to output directory
        output_dir = Path(__file__).parent / 'output'
        output_dir.mkdir(exist_ok=True)
        
        # Save as JSON
        json_file = output_dir / f'blog-{current_date}.json'
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(blog_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"Blog generated: {blog_data['title'][:50]}...")
        
        return jsonify({
            'success': True,
            'blog': blog_data,
            'generated_at': datetime.now().isoformat(),
            'message': 'Blog post generated successfully by 5 AI agents'
        }), 200
        
    except Exception as e:
        logger.error(f"Blog generation failed: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'Blog generation failed',
            'message': str(e)
        }), 500

@app.route('/generate-blog', methods=['GET'])
def generate_blog_get():
    """GET endpoint for testing (same as POST)"""
    if not verify_api_key():
        return jsonify({'error': 'Unauthorized', 'message': 'Invalid or missing API key'}), 401
    
    # Create a mock request with today's date
    return generate_blog()

if __name__ == '__main__':
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('FLASK_ENV') == 'development'
    
    logger.info(f"Starting CrewAI Blog Generator API on port {port}")
    logger.info(f"Environment: {'development' if debug else 'production'}")
    logger.info(f"API Key configured: {bool(API_KEY and API_KEY != 'your-secret-api-key-here')}")
    
    # Use gunicorn in production for better performance and stability
    if os.getenv('FLASK_ENV') == 'production':
        logger.info("Using Gunicorn WSGI server (production mode)")
        import subprocess
        subprocess.run([
            'gunicorn',
            '-w', '2',  # Reduce worker processes
            '-b', f'0.0.0.0:{port}',
            '--timeout', '600',  # Increase timeout to 10 minutes
            '--log-level', 'warning',
            '--access-logfile', '-',
            '--error-logfile', '-',
            'api:app'
        ])
    else:
        logger.warning("Using Flask development server (not for production)")
        app.run(host='0.0.0.0', port=port, debug=debug)

    print("Current working directory:", os.getcwd())
    print("Files in cwd:", os.listdir(os.getcwd()))
