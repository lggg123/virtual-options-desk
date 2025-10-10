#!/usr/bin/env python3
"""
Test script to verify ML models load correctly
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def test_pro_tier_models():
    """Test Pro tier ensemble models"""
    print("=" * 60)
    print("🧪 Testing Pro Tier Models (Ensemble)")
    print("=" * 60)
    
    try:
        from python.ml_ensemble import StockScreeningEnsemble
        
        ensemble = StockScreeningEnsemble()
        models_path = 'ml_models'
        
        print(f"\n📂 Loading models from: {models_path}/")
        print(f"   Looking for:")
        print(f"   - xgboost.pkl")
        print(f"   - random_forest.pkl")
        print(f"   - lightgbm.pkl")
        print(f"   - feature_engineer.pkl")
        
        ensemble.load_models(models_path)
        
        print(f"\n✅ Pro tier models loaded successfully!")
        print(f"   Is trained: {ensemble.is_trained}")
        print(f"   Models available: {list(ensemble.models.keys())}")
        print(f"   Feature count: {len(getattr(ensemble.feature_engineer, 'feature_names_in_', []))}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error loading Pro tier models:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_premium_tier_models():
    """Test Premium tier LSTM model"""
    print("\n" + "=" * 60)
    print("🧪 Testing Premium Tier Models (LSTM)")
    print("=" * 60)
    
    try:
        import torch
        import joblib
        
        models_path = 'ml_models/premium'
        
        print(f"\n📂 Loading LSTM model from: {models_path}/")
        print(f"   Looking for:")
        print(f"   - lstm.pth")
        print(f"   - lstm_scaler.pkl")
        
        # Load LSTM model
        if not os.path.exists(f'{models_path}/lstm.pth'):
            print(f"\n⚠️  LSTM model not found at {models_path}/lstm.pth")
            print("   This is optional - Premium tier will use ensemble only")
            return False
        
        lstm_checkpoint = torch.load(f'{models_path}/lstm.pth', map_location='cpu')
        print(f"\n✅ LSTM checkpoint loaded successfully!")
        print(f"   Keys: {list(lstm_checkpoint.keys())}")
        
        # Load scaler
        scaler = joblib.load(f'{models_path}/lstm_scaler.pkl')
        print(f"✅ LSTM scaler loaded successfully!")
        
        # Load metadata
        if os.path.exists(f'{models_path}/lstm_metadata.json'):
            import json
            with open(f'{models_path}/lstm_metadata.json', 'r') as f:
                metadata = json.load(f)
            print(f"✅ LSTM metadata loaded:")
            print(f"   Model type: {metadata.get('model_type')}")
            print(f"   Trained at: {metadata.get('trained_at')}")
            print(f"   Config: {metadata.get('config')}")
        
        return True
        
    except ImportError:
        print(f"\n⚠️  PyTorch not installed - LSTM model disabled")
        print("   Premium tier will use ensemble only")
        return False
    except Exception as e:
        print(f"\n❌ Error loading Premium tier models:")
        print(f"   {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False


def check_model_files():
    """Check if all required model files exist"""
    print("\n" + "=" * 60)
    print("📋 Checking Model Files")
    print("=" * 60)
    
    required_files = {
        'Pro Tier': [
            'ml_models/xgboost.pkl',
            'ml_models/random_forest.pkl',
            'ml_models/lightgbm.pkl',
            'ml_models/feature_engineer.pkl',
            'ml_models/metadata.json'
        ],
        'Premium Tier': [
            'ml_models/premium/lstm.pth',
            'ml_models/premium/lstm_scaler.pkl',
            'ml_models/premium/lstm_metadata.json'
        ]
    }
    
    for tier, files in required_files.items():
        print(f"\n{tier}:")
        all_exist = True
        for file in files:
            exists = os.path.exists(file)
            size = os.path.getsize(file) if exists else 0
            status = "✅" if exists else "❌"
            size_str = f"{size / 1024 / 1024:.2f} MB" if size > 1024 * 1024 else f"{size / 1024:.2f} KB" if size > 1024 else f"{size} bytes"
            print(f"   {status} {file} ({size_str if exists else 'not found'})")
            if not exists:
                all_exist = False
        
        if all_exist:
            print(f"   ✅ All {tier} files present")
        else:
            print(f"   ⚠️  Some {tier} files missing")


if __name__ == "__main__":
    print("\n🚀 ML Models Test Suite")
    print("=" * 60)
    
    # Check files first
    check_model_files()
    
    # Test Pro tier
    pro_success = test_pro_tier_models()
    
    # Test Premium tier
    premium_success = test_premium_tier_models()
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 Test Summary")
    print("=" * 60)
    print(f"\n   Pro Tier (Ensemble):  {'✅ PASSED' if pro_success else '❌ FAILED'}")
    print(f"   Premium Tier (LSTM):  {'✅ PASSED' if premium_success else '⚠️  SKIPPED (optional)'}")
    
    if pro_success:
        print("\n🎉 SUCCESS! Pro tier models are ready for deployment!")
        print("\n📝 Next steps:")
        print("   1. Enable ML in pattern_detection_api.py: use_ml=True")
        print("   2. Deploy to Railway")
        print("   3. Test API endpoint: /api/ml/screen")
    else:
        print("\n❌ Pro tier models failed to load. Check the errors above.")
        sys.exit(1)
    
    print("\n" + "=" * 60)
