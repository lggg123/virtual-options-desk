#!/bin/bash

echo "🤖 ML Model Training Setup"
echo "================================"
echo ""

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "📦 Activating virtual environment..."
    source .venv/bin/activate
fi

echo "📥 Installing ML dependencies..."
pip install -q pandas numpy scikit-learn==1.7.2 xgboost lightgbm joblib

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "🚀 Starting training..."
echo ""

# Change to ml-service directory and run training
cd ml-service
python train_ml_models.py
cd ..

echo ""
echo "✅ Training complete!"
echo ""
echo "📦 Next steps:"
echo "  1. Models saved in ml-service/ml_models/"
echo "  2. Upload to Railway or copy to your ML service deployment"
echo "  3. Restart the ML service"
