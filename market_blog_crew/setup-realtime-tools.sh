#!/bin/bash

echo "🚀 Setting up Real-Time Market Research for Blog Crew"
echo "======================================================"
echo ""

# Check if in correct directory
if [ ! -f "pyproject.toml" ]; then
    echo "❌ Error: Run this script from the market_blog_crew directory"
    exit 1
fi

# Install CrewAI tools
echo "📦 Installing CrewAI tools..."
pip install 'crewai[tools]' --quiet

# Check if successful
if [ $? -eq 0 ]; then
    echo "✅ CrewAI tools installed successfully"
else
    echo "❌ Failed to install CrewAI tools"
    exit 1
fi

# Check for Serper API key
echo ""
echo "🔑 Checking for SERPER_API_KEY..."
if grep -q "SERPER_API_KEY=your-serper-api-key-here" .env; then
    echo "⚠️  WARNING: SERPER_API_KEY not configured!"
    echo ""
    echo "To get real-time market data, you need a Serper API key:"
    echo "  1. Go to https://serper.dev"
    echo "  2. Sign up for free (2,500 searches/month)"
    echo "  3. Copy your API key"
    echo "  4. Update .env file:"
    echo "     SERPER_API_KEY=your-actual-key-here"
    echo ""
elif grep -q "SERPER_API_KEY=" .env; then
    echo "✅ SERPER_API_KEY configured"
else
    echo "⚠️  SERPER_API_KEY not found in .env"
    echo "   Adding placeholder..."
    echo "SERPER_API_KEY=your-serper-api-key-here" >> .env
    echo ""
    echo "📝 Please update SERPER_API_KEY in .env file"
    echo "   Get your key at: https://serper.dev"
fi

# Test tool import
echo ""
echo "🧪 Testing tool imports..."
python -c "from crewai_tools import SerperDevTool, WebsiteSearchTool, ScrapeWebsiteTool; print('✅ All tools imported successfully')" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Tool imports working"
else
    echo "❌ Tool import failed - try installing again"
fi

# Summary
echo ""
echo "======================================================"
echo "✅ Setup Complete!"
echo "======================================================"
echo ""
echo "Next steps:"
echo "  1. Update SERPER_API_KEY in .env (if not done)"
echo "  2. Test the crew: crewai run"
echo "  3. Check REAL_TIME_RESEARCH.md for details"
echo ""
echo "The blog crew will now use real-time web search! 🎉"
