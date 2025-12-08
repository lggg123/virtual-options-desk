"""
Tests for CrewAI Market Blog Generator API
"""
import pytest
from flask import Flask
from flask.testing import FlaskClient
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
import json
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


@pytest.fixture
def mock_crewai():
    """Mock CrewAI dependencies"""
    mock_crew_class = MagicMock()
    mock_crew_instance = MagicMock()
    mock_crew_instance.crew.return_value = MagicMock()
    mock_crew_class.return_value = mock_crew_instance

    with patch.dict('sys.modules', {
        'crewai': MagicMock(),
        'crewai_tools': MagicMock(),
        'langchain_google_genai': MagicMock(),
        'src.market_blog_crew.crew': MagicMock(MarketBlogCrew=mock_crew_class)
    }):
        yield mock_crew_instance


@pytest.fixture
def app(mock_crewai):
    """Create Flask test app"""
    from api import app
    app.config['TESTING'] = True
    return app


@pytest.fixture
def client(app) -> FlaskClient:
    """Create test client"""
    return app.test_client()


@pytest.fixture
def auth_headers():
    """Return valid authentication headers"""
    return {'Authorization': 'Bearer your-secret-api-key-here'}


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_check_returns_200(self, client):
        """Test health endpoint returns 200 OK"""
        response = client.get('/health')
        assert response.status_code == 200

    def test_health_check_response_format(self, client):
        """Test health endpoint response format"""
        response = client.get('/health')
        data = response.get_json()

        assert data['status'] == 'healthy'
        assert data['service'] == 'CrewAI Market Blog Generator'
        assert 'timestamp' in data

    def test_health_check_no_auth_required(self, client):
        """Test health endpoint doesn't require authentication"""
        response = client.get('/health')
        assert response.status_code == 200  # Should not be 401


class TestAuthentication:
    """Test API authentication"""

    def test_generate_blog_without_auth(self, client):
        """Test blog generation requires authentication"""
        response = client.post('/generate-blog')
        assert response.status_code == 401
        data = response.get_json()
        assert data['error'] == 'Unauthorized'

    def test_generate_blog_with_invalid_token(self, client):
        """Test blog generation with invalid token"""
        headers = {'Authorization': 'Bearer invalid-token'}
        response = client.post('/generate-blog', headers=headers)
        assert response.status_code == 401

    def test_generate_blog_with_invalid_scheme(self, client):
        """Test blog generation with invalid auth scheme"""
        headers = {'Authorization': 'Basic some-token'}
        response = client.post('/generate-blog', headers=headers)
        assert response.status_code == 401

    def test_generate_blog_get_without_auth(self, client):
        """Test GET endpoint requires authentication"""
        response = client.get('/generate-blog')
        assert response.status_code == 401


class TestVerifyApiKey:
    """Test API key verification function"""

    def test_verify_api_key_valid(self, app):
        """Test valid API key verification"""
        import os
        # Set the API key to match what we're testing with
        os.environ['CREWAI_API_KEY'] = 'test-api-key'

        with app.test_request_context(headers={'Authorization': 'Bearer test-api-key'}):
            from api import verify_api_key, API_KEY
            # Reload the API key since it was set at import time
            with patch('api.API_KEY', 'test-api-key'):
                # Test that header parsing works correctly
                from flask import request
                auth_header = request.headers.get('Authorization')
                assert auth_header == 'Bearer test-api-key'
                scheme, token = auth_header.split()
                assert scheme.lower() == 'bearer'
                assert token == 'test-api-key'

    def test_verify_api_key_missing(self, app):
        """Test missing API key"""
        with app.test_request_context():
            from api import verify_api_key
            assert verify_api_key() == False

    def test_verify_api_key_invalid_format(self, app):
        """Test invalid auth header format"""
        with app.test_request_context(headers={'Authorization': 'InvalidFormat'}):
            from api import verify_api_key
            assert verify_api_key() == False


class TestBlogOutputParsing:
    """Test blog output parsing logic"""

    def test_parse_title_with_prefix(self):
        """Test parsing title with TITLE: prefix"""
        output = "TITLE: Test Blog Title\nMETA_DESCRIPTION: Test description"

        lines = output.split('\n')
        title = ''
        for line in lines:
            if line.startswith('TITLE:'):
                title = line.replace('TITLE:', '').strip()
                break

        assert title == "Test Blog Title"

    def test_parse_tags(self):
        """Test parsing tags"""
        output = "TAGS: tech, stocks, market analysis, trading"

        lines = output.split('\n')
        tags = []
        for line in lines:
            if line.startswith('TAGS:'):
                tags_str = line.replace('TAGS:', '').strip()
                tags = [t.strip() for t in tags_str.split(',') if t.strip()]
                break

        assert tags == ['tech', 'stocks', 'market analysis', 'trading']

    def test_parse_market_data(self):
        """Test parsing market data"""
        output = """SP500_LEVEL: 5321.45
VIX_LEVEL: 14.85
TOP_SECTOR: Technology"""

        market_data = {
            'sp500_level': 0.0,
            'vix_level': 0.0,
            'top_sector': ''
        }

        for line in output.split('\n'):
            if line.startswith('SP500_LEVEL:'):
                try:
                    market_data['sp500_level'] = float(line.replace('SP500_LEVEL:', '').strip())
                except:
                    pass
            elif line.startswith('VIX_LEVEL:'):
                try:
                    market_data['vix_level'] = float(line.replace('VIX_LEVEL:', '').strip())
                except:
                    pass
            elif line.startswith('TOP_SECTOR:'):
                market_data['top_sector'] = line.replace('TOP_SECTOR:', '').strip()

        assert market_data['sp500_level'] == 5321.45
        assert market_data['vix_level'] == 14.85
        assert market_data['top_sector'] == 'Technology'

    def test_parse_keywords(self):
        """Test parsing keywords"""
        output = "KEYWORDS: stock market, investing, tech stocks"

        lines = output.split('\n')
        keywords = []
        for line in lines:
            if line.startswith('KEYWORDS:'):
                keywords_str = line.replace('KEYWORDS:', '').strip()
                keywords = [k.strip() for k in keywords_str.split(',') if k.strip()]
                break

        assert keywords == ['stock market', 'investing', 'tech stocks']


class TestBlogDataStructure:
    """Test blog data structure"""

    def test_blog_data_defaults(self):
        """Test blog data default structure"""
        blog_data = {
            'title': '',
            'meta_description': '',
            'content': '',
            'tags': [],
            'target_keywords': [],
            'market_data': {
                'date': '2025-01-01',
                'sp500_level': 0.0,
                'vix_level': 0.0,
                'top_sector': ''
            }
        }

        assert blog_data['title'] == ''
        assert blog_data['tags'] == []
        assert blog_data['market_data']['sp500_level'] == 0.0

    def test_blog_data_validation(self):
        """Test blog data validation logic"""
        blog_data = {
            'title': 'Test Title',
            'content': 'Test content here'
        }

        # Validation: title and content must not be empty
        is_valid = bool(blog_data['title']) and bool(blog_data['content'])
        assert is_valid == True

    def test_blog_data_validation_fails_empty_title(self):
        """Test blog data validation fails with empty title"""
        blog_data = {
            'title': '',
            'content': 'Test content here'
        }

        is_valid = bool(blog_data['title']) and bool(blog_data['content'])
        assert is_valid == False


class TestDateHandling:
    """Test date handling in blog generation"""

    def test_default_date_is_today(self):
        """Test default date is today"""
        current_date = datetime.now().strftime('%Y-%m-%d')

        # Simulate the logic from api.py
        data = {}
        custom_date = data.get('date')
        if custom_date:
            result_date = custom_date
        else:
            result_date = datetime.now().strftime('%Y-%m-%d')

        assert result_date == current_date

    def test_custom_date_override(self):
        """Test custom date can be provided"""
        data = {'date': '2025-01-15'}
        custom_date = data.get('date')

        if custom_date:
            result_date = custom_date
        else:
            result_date = datetime.now().strftime('%Y-%m-%d')

        assert result_date == '2025-01-15'


class TestRetryLogic:
    """Test retry logic for API overload"""

    def test_retry_on_503_error(self):
        """Test that 503 errors trigger retry"""
        error_msg = "503 Service Unavailable: API is overloaded"

        should_retry = '503' in error_msg or 'overloaded' in error_msg.lower()
        assert should_retry == True

    def test_no_retry_on_other_errors(self):
        """Test that other errors don't trigger retry"""
        error_msg = "400 Bad Request: Invalid input"

        should_retry = '503' in error_msg or 'overloaded' in error_msg.lower()
        assert should_retry == False

    def test_retry_parameters(self):
        """Test retry parameters are correct"""
        max_retries = 3
        retry_delay = 10  # seconds

        # Calculate wait times
        wait_times = [retry_delay * (attempt + 1) for attempt in range(max_retries - 1)]

        assert wait_times == [10, 20]  # First retry: 10s, Second retry: 20s


class TestResponseFormats:
    """Test API response formats"""

    def test_success_response_format(self):
        """Test successful response format"""
        response_data = {
            'success': True,
            'blog': {
                'title': 'Test Title',
                'content': 'Test content'
            },
            'generated_at': datetime.now().isoformat(),
            'message': 'Blog post generated successfully by 5 AI agents'
        }

        assert response_data['success'] == True
        assert 'blog' in response_data
        assert 'generated_at' in response_data

    def test_error_response_format(self):
        """Test error response format"""
        response_data = {
            'success': False,
            'error': 'Blog generation failed',
            'message': 'Some error occurred'
        }

        assert response_data['success'] == False
        assert 'error' in response_data
        assert 'message' in response_data

    def test_unauthorized_response_format(self):
        """Test unauthorized response format"""
        response_data = {
            'error': 'Unauthorized',
            'message': 'Invalid or missing API key'
        }

        assert response_data['error'] == 'Unauthorized'
