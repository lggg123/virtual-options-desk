#!/usr/bin/env python
import sys
import warnings
import os
import json
from pathlib import Path

from datetime import datetime
from dotenv import load_dotenv

from market_blog_crew.crew import MarketBlogCrew

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

warnings.filterwarnings("ignore", category=SyntaxWarning, module="pysbd")

# This main file is intended to be a way for you to run your
# crew locally, so refrain from adding unnecessary logic into this file.
# Replace with inputs you want to test with, it will automatically
# interpolate any tasks and agents information

def run():
    """
    Run the crew and save output to markdown and JSON files.
    """
    current_date = datetime.now().strftime('%Y-%m-%d')
    inputs = {
        'current_date': current_date
    }

    try:
        result = MarketBlogCrew().crew().kickoff(inputs=inputs)
        
        # Create output directory if it doesn't exist
        output_dir = Path(__file__).parent.parent.parent / 'output'
        output_dir.mkdir(exist_ok=True)
        
        # Extract blog post data from result
        blog_data = result.pydantic.dict() if hasattr(result, 'pydantic') else result
        
        # Save as JSON
        json_file = output_dir / f'blog-{current_date}.json'
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(blog_data, f, indent=2, ensure_ascii=False)
        
        # Save as Markdown with YAML frontmatter
        md_file = output_dir / f'blog-{current_date}.md'
        with open(md_file, 'w', encoding='utf-8') as f:
            # Write YAML frontmatter
            f.write('---\n')
            f.write(f'title: "{blog_data.get("title", "").replace(chr(34), chr(39))}"\n')
            f.write(f'date: {current_date}\n')
            f.write(f'meta_description: "{blog_data.get("meta_description", "").replace(chr(34), chr(39))}"\n')
            f.write(f'tags: {json.dumps(blog_data.get("tags", []))}\n')
            f.write(f'keywords: {json.dumps(blog_data.get("target_keywords", []))}\n')
            
            # Add market data if available
            if 'market_data' in blog_data:
                md = blog_data['market_data']
                f.write(f'market_date: {md.get("date", "")}\n')
                f.write(f'sp500_level: {md.get("sp500_level", 0)}\n')
                f.write(f'vix_level: {md.get("vix_level", 0)}\n')
                f.write(f'top_sector: "{md.get("top_sector", "")}"\n')
            
            f.write('---\n\n')
            
            # Write content
            f.write(blog_data.get('content', ''))
        
        print("\n" + "="*50)
        print("CREW EXECUTION COMPLETE")
        print("="*50)
        print(f"\n📄 Markdown saved: {md_file}")
        print(f"📊 JSON saved: {json_file}")
        print(f"\nTitle: {blog_data.get('title', 'N/A')}")
        print(f"Tags: {', '.join(blog_data.get('tags', []))}")
        print(f"Keywords: {', '.join(blog_data.get('target_keywords', []))}")
        
        return result
    except Exception as e:
        raise Exception(f"An error occurred while running the crew: {e}")


def train():
    """
    Train the crew for a given number of iterations.
    """
    inputs = {
        "topic": "AI LLMs",
        'current_year': str(datetime.now().year)
    }
    try:
        MarketBlogCrew().crew().train(n_iterations=int(sys.argv[1]), filename=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while training the crew: {e}")

def replay():
    """
    Replay the crew execution from a specific task.
    """
    try:
        MarketBlogCrew().crew().replay(task_id=sys.argv[1])

    except Exception as e:
        raise Exception(f"An error occurred while replaying the crew: {e}")

def test():
    """
    Test the crew execution and returns the results.
    """
    inputs = {
        "topic": "AI LLMs",
        "current_year": str(datetime.now().year)
    }

    try:
        MarketBlogCrew().crew().test(n_iterations=int(sys.argv[1]), eval_llm=sys.argv[2], inputs=inputs)

    except Exception as e:
        raise Exception(f"An error occurred while testing the crew: {e}")

def run_with_trigger():
    """
    Run the crew with trigger payload.
    """
    import json

    if len(sys.argv) < 2:
        raise Exception("No trigger payload provided. Please provide JSON payload as argument.")

    try:
        trigger_payload = json.loads(sys.argv[1])
    except json.JSONDecodeError:
        raise Exception("Invalid JSON payload provided as argument")

    inputs = {
        "crewai_trigger_payload": trigger_payload,
        "topic": "",
        "current_year": ""
    }

    try:
        result = MarketBlogCrew().crew().kickoff(inputs=inputs)
        return result
    except Exception as e:
        raise Exception(f"An error occurred while running the crew with trigger: {e}")
