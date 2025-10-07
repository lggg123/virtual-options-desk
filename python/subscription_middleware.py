"""
Subscription Middleware for Pattern Detection and ML APIs
Checks if user has active subscription before allowing access to premium features
"""

from functools import wraps
from typing import Optional, Dict, Any
import os
from fastapi import HTTPException, Request
from supabase import create_client, Client

# Initialize Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_ROLE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    print("WARNING: Supabase credentials not configured. Subscription checks will be disabled.")
    supabase: Optional[Client] = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

# Plan hierarchy for feature access
PLAN_HIERARCHY = {
    'free': 0,
    'premium': 1,
    'pro': 2
}

# Feature limits per plan
PLAN_LIMITS = {
    'free': {
        'picks_per_month': 10,
        'pattern_detection': True,
        'ml_screening': False,
        'api_access': False,
        'priority_support': False
    },
    'premium': {
        'picks_per_month': 100,
        'pattern_detection': True,
        'ml_screening': True,
        'api_access': False,
        'priority_support': False
    },
    'pro': {
        'picks_per_month': -1,  # Unlimited
        'pattern_detection': True,
        'ml_screening': True,
        'api_access': True,
        'priority_support': True
    }
}


class SubscriptionError(HTTPException):
    """Custom exception for subscription-related errors"""
    def __init__(self, message: str, required_plan: str = None):
        detail = {'error': message}
        if required_plan:
            detail['required_plan'] = required_plan
            detail['upgrade_url'] = '/pricing'
        super().__init__(status_code=403, detail=detail)


async def get_user_subscription(user_id: str) -> Dict[str, Any]:
    """
    Get user's subscription details from Supabase
    
    Args:
        user_id: UUID of the user
        
    Returns:
        Dict with plan_id, status, current_period_end, etc.
        
    Raises:
        HTTPException: If subscription check fails
    """
    if not supabase:
        # If Supabase not configured, return free plan
        return {
            'plan_id': 'free',
            'status': 'active',
            'features': PLAN_LIMITS['free']
        }
    
    try:
        # Query subscriptions table
        response = supabase.table('subscriptions').select('*').eq('user_id', user_id).execute()
        
        if not response.data or len(response.data) == 0:
            # No subscription found - free plan
            return {
                'plan_id': 'free',
                'status': 'active',
                'features': PLAN_LIMITS['free']
            }
        
        subscription = response.data[0]
        plan_id = subscription.get('plan_id', 'free')
        status = subscription.get('status', 'inactive')
        
        # Check if subscription is active
        if status not in ['active', 'trialing']:
            return {
                'plan_id': 'free',
                'status': 'inactive',
                'features': PLAN_LIMITS['free']
            }
        
        return {
            'plan_id': plan_id,
            'status': status,
            'current_period_end': subscription.get('current_period_end'),
            'cancel_at_period_end': subscription.get('cancel_at_period_end'),
            'features': PLAN_LIMITS.get(plan_id, PLAN_LIMITS['free'])
        }
        
    except Exception as e:
        print(f"Error checking subscription: {str(e)}")
        # On error, default to free plan for graceful degradation
        return {
            'plan_id': 'free',
            'status': 'error',
            'features': PLAN_LIMITS['free']
        }


def check_plan_access(required_plan: str):
    """
    Decorator to check if user has required plan level
    
    Usage:
        @app.post("/api/premium-feature")
        @check_plan_access('premium')
        async def premium_feature(user_id: str):
            ...
    
    Args:
        required_plan: Minimum plan required ('free', 'premium', or 'pro')
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user_id from kwargs or request
            user_id = kwargs.get('user_id')
            
            # If no user_id, check request object
            if not user_id:
                request: Request = kwargs.get('request') or (args[0] if args else None)
                if request:
                    # Try to get user_id from query params, headers, or body
                    user_id = (
                        request.query_params.get('user_id') or
                        request.headers.get('X-User-ID') or
                        getattr(request.state, 'user_id', None)
                    )
            
            if not user_id:
                raise HTTPException(
                    status_code=401,
                    detail="User authentication required. Please provide user_id."
                )
            
            # Get user's subscription
            subscription = await get_user_subscription(user_id)
            
            # Check plan hierarchy
            user_plan_level = PLAN_HIERARCHY.get(subscription['plan_id'], 0)
            required_plan_level = PLAN_HIERARCHY.get(required_plan, 0)
            
            if user_plan_level < required_plan_level:
                raise SubscriptionError(
                    f"This feature requires {required_plan} plan or higher",
                    required_plan=required_plan
                )
            
            # Add subscription to kwargs for use in endpoint
            kwargs['subscription'] = subscription
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


def check_feature_access(feature: str):
    """
    Decorator to check if user has access to specific feature
    
    Usage:
        @app.post("/api/ml-screening")
        @check_feature_access('ml_screening')
        async def ml_screening(user_id: str):
            ...
    
    Args:
        feature: Feature name to check (e.g., 'ml_screening', 'api_access')
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract user_id (same logic as check_plan_access)
            user_id = kwargs.get('user_id')
            
            if not user_id:
                request: Request = kwargs.get('request') or (args[0] if args else None)
                if request:
                    user_id = (
                        request.query_params.get('user_id') or
                        request.headers.get('X-User-ID') or
                        getattr(request.state, 'user_id', None)
                    )
            
            if not user_id:
                raise HTTPException(
                    status_code=401,
                    detail="User authentication required. Please provide user_id."
                )
            
            # Get user's subscription
            subscription = await get_user_subscription(user_id)
            features = subscription.get('features', PLAN_LIMITS['free'])
            
            # Check if feature is enabled for user's plan
            if not features.get(feature, False):
                # Find which plan includes this feature
                required_plan = 'pro'
                for plan, limits in PLAN_LIMITS.items():
                    if limits.get(feature, False):
                        required_plan = plan
                        break
                
                raise SubscriptionError(
                    f"This feature is not available on your current plan",
                    required_plan=required_plan
                )
            
            # Add subscription to kwargs
            kwargs['subscription'] = subscription
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator


async def check_usage_limit(user_id: str, limit_type: str = 'picks_per_month') -> Dict[str, Any]:
    """
    Check if user has reached their usage limit
    
    Args:
        user_id: UUID of the user
        limit_type: Type of limit to check (e.g., 'picks_per_month')
        
    Returns:
        Dict with usage, limit, remaining, and allowed status
    """
    if not supabase:
        return {
            'allowed': True,
            'usage': 0,
            'limit': 10,
            'remaining': 10
        }
    
    try:
        # Get user's subscription
        subscription = await get_user_subscription(user_id)
        features = subscription.get('features', PLAN_LIMITS['free'])
        limit = features.get(limit_type, 0)
        
        # Unlimited access for pro plan (-1 means unlimited)
        if limit == -1:
            return {
                'allowed': True,
                'usage': 0,
                'limit': -1,
                'remaining': -1,
                'unlimited': True
            }
        
        # Query usage from database
        # This assumes you have a 'usage_tracking' table
        # You'll need to create this table in Supabase
        response = supabase.table('usage_tracking').select('count').eq('user_id', user_id).eq(
            'month', 'CURRENT_MONTH'  # You'll need to implement proper month tracking
        ).execute()
        
        usage = response.data[0]['count'] if response.data else 0
        remaining = max(0, limit - usage)
        allowed = usage < limit
        
        return {
            'allowed': allowed,
            'usage': usage,
            'limit': limit,
            'remaining': remaining
        }
        
    except Exception as e:
        print(f"Error checking usage limit: {str(e)}")
        # On error, allow access (graceful degradation)
        return {
            'allowed': True,
            'usage': 0,
            'limit': 10,
            'remaining': 10,
            'error': str(e)
        }


async def increment_usage(user_id: str, usage_type: str = 'picks'):
    """
    Increment user's usage counter
    
    Args:
        user_id: UUID of the user
        usage_type: Type of usage to increment
    """
    if not supabase:
        return
    
    try:
        # This is a placeholder - implement based on your usage tracking needs
        # You might want to use a separate usage_tracking table
        pass
    except Exception as e:
        print(f"Error incrementing usage: {str(e)}")


# FastAPI middleware to extract user_id from JWT token
async def auth_middleware(request: Request, call_next):
    """
    Middleware to extract user_id from Authorization header
    Expects: Authorization: Bearer <supabase-jwt-token>
    """
    auth_header = request.headers.get('Authorization')
    
    if auth_header and auth_header.startswith('Bearer ') and supabase:
        token = auth_header.split(' ')[1]
        try:
            # Verify JWT token with Supabase
            user = supabase.auth.get_user(token)
            if user:
                request.state.user_id = user.user.id
        except Exception as e:
            print(f"Error verifying token: {str(e)}")
    
    response = await call_next(request)
    return response
