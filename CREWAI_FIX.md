# CrewAI Service Deployment Fix

## Issue
```
Warning: CrewAI not installed. Using mock analysis.
```

The CrewAI package wasn't being imported successfully even though it was in requirements.txt.

## Root Causes

1. **Old LangChain Import**: Used deprecated `from langchain.llms import OpenAI`
2. **Strict Version Pinning**: `crewai==0.35.8` might have dependency conflicts
3. **Missing langchain-openai**: New LangChain structure requires separate package

## Solution

### 1. Updated requirements.txt
```txt
# Before
crewai==0.35.8
langchain==0.1.20
openai==1.35.7

# After
crewai>=0.35.0
langchain>=0.1.0
langchain-openai>=0.0.5
openai>=1.35.0
```

### 2. Updated Import in crewai_analysis.py
```python
# Before
from langchain.llms import OpenAI

# After
from langchain_openai import ChatOpenAI
```

### 3. Updated LLM Initialization
```python
# Before
self.llm = OpenAI(api_key=api_key, temperature=0.1)

# After
self.llm = ChatOpenAI(
    api_key=api_key,
    model="gpt-4-turbo-preview",
    temperature=0.1
)
```

## Why These Changes

- **LangChain 0.1.x** split LLM providers into separate packages
- **`langchain-openai`** is now required for OpenAI integration
- **`ChatOpenAI`** is the modern interface (replaces deprecated `OpenAI` class)
- **Flexible versioning** (`>=`) allows pip to resolve dependencies better

## Railway Configuration

Make sure you have:

**Settings → Variables:**
```
OPENAI_API_KEY=your-openai-api-key-here
```

**Settings → General:**
- Root Directory: `crewai-service`

**Settings → Build:**
- Nixpacks Config: `../nixpacks-crewai.toml`

## After Redeployment

You should see:
```
INFO:     Started server process [1]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:XXXX
```

No more "CrewAI not installed" warning!

## Testing

```bash
curl https://your-crewai-service.up.railway.app/health

# Should return:
{
  "status": "healthy",
  "service": "CrewAI Market Analysis",
  "crewai_available": true
}
```

## Cost Note

- **gpt-4-turbo-preview**: ~$0.01 per 1K tokens input, $0.03 per 1K tokens output
- **Average analysis**: ~5K tokens = $0.05-$0.15 per request
- **Alternative**: Change model to `gpt-3.5-turbo` for ~$0.01 per analysis

To use cheaper model, update in `crewai_analysis.py`:
```python
model="gpt-3.5-turbo"  # Instead of gpt-4-turbo-preview
```
