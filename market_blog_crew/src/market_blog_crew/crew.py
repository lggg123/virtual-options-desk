from crewai import Agent, Crew, Process, Task
from crewai.project import CrewBase, agent, crew, task
from crewai.agents.agent_builder.base_agent import BaseAgent
from typing import List
from pydantic import BaseModel, Field

# Import crewAI tools for real-time research
from crewai_tools import (
    SerperDevTool,
    WebsiteSearchTool,
    ScrapeWebsiteTool
)

# If you want to run a snippet of code before or after the crew starts,
# you can use the @before_kickoff and @after_kickoff decorators
# https://docs.crewai.com/concepts/crews#example-crew-class-with-decorators

class MarketData(BaseModel):
    """Market data summary"""
    date: str = Field(description="Date of the analysis (YYYY-MM-DD)")
    sp500_level: float = Field(description="S&P 500 index level")
    vix_level: float = Field(description="VIX volatility index level")
    top_sector: str = Field(description="Best performing sector")

class BlogPost(BaseModel):
    """Blog post output structure"""
    title: str = Field(description="SEO-optimized article title")
    meta_description: str = Field(description="155 character meta description")
    content: str = Field(description="Full article in markdown format")
    tags: List[str] = Field(description="Article tags for categorization")
    target_keywords: List[str] = Field(description="Primary SEO keywords")
    market_data: MarketData = Field(description="Summary of market data used")

@CrewBase
class MarketBlogCrew():
    """MarketBlogCrew crew"""

    agents_config = 'config/agents.yaml'
    tasks_config = 'config/tasks.yaml'

    def __init__(self):
        # Initialize research tools
        self.search_tool = SerperDevTool()
        self.web_scraper = ScrapeWebsiteTool()
        # EODHD price fetch tool
        from market_blog_crew.tools.eodhd_tool import EODHDPriceTool
        self.eodhd_price_tool = EODHDPriceTool()
        # Alpha Vantage price fetch tool
        from market_blog_crew.tools.alpha_vantage_tool import AlphaVantagePriceTool
        self.alpha_vantage_price_tool = AlphaVantagePriceTool()
        # Financial news and data websites for targeted research
        self.financial_websites = [
            'https://finance.yahoo.com',
            'https://www.cnbc.com/markets',
            'https://www.investing.com'
        ]
        # Create website-specific search tools
        self.web_rag_tools = [
            WebsiteSearchTool(website=site) for site in self.financial_websites
        ]

    # Learn more about YAML configuration files here:
    # Agents: https://docs.crewai.com/concepts/agents#yaml-configuration-recommended
    # Tasks: https://docs.crewai.com/concepts/tasks#yaml-configuration-recommended
    
    # If you would like to add tools to your agents, you can learn more about it here:
    # https://docs.crewai.com/concepts/agents#agent-tools
    @agent
    def market_researcher(self) -> Agent:
        return Agent(
            config=self.agents_config['market_researcher'], # type: ignore[index]
            tools=[self.search_tool, self.web_scraper] + self.web_rag_tools,
            verbose=True
        )

    @agent
    def technical_analyst(self) -> Agent:
        return Agent(
            config=self.agents_config['technical_analyst'], # type: ignore[index]
            tools=[self.search_tool, self.web_scraper, self.eodhd_price_tool, self.alpha_vantage_price_tool],
            verbose=True
        )

    @agent
    def options_strategist(self) -> Agent:
        return Agent(
            config=self.agents_config['options_strategist'], # type: ignore[index]
            tools=[self.search_tool, self.eodhd_price_tool, self.alpha_vantage_price_tool],
            verbose=True
        )

    @agent
    def risk_manager(self) -> Agent:
        return Agent(
            config=self.agents_config['risk_manager'], # type: ignore[index]
            verbose=True
        )

    @agent
    def content_writer(self) -> Agent:
        return Agent(
            config=self.agents_config['content_writer'], # type: ignore[index]
            verbose=True
        )

    # To learn more about structured task outputs,
    # task dependencies, and task callbacks, check out the documentation:
    # https://docs.crewai.com/concepts/tasks#overview-of-a-task
    @task
    def research_market_task(self) -> Task:
        return Task(
            config=self.tasks_config['research_market_task'], # type: ignore[index]
        )

    @task
    def analyze_technicals_task(self) -> Task:
        return Task(
            config=self.tasks_config['analyze_technicals_task'], # type: ignore[index]
        )

    @task
    def identify_options_opportunities_task(self) -> Task:
        return Task(
            config=self.tasks_config['identify_options_opportunities_task'], # type: ignore[index]
        )

    @task
    def assess_risks_task(self) -> Task:
        return Task(
            config=self.tasks_config['assess_risks_task'], # type: ignore[index]
        )

    @task
    def write_blog_post_task(self) -> Task:
        return Task(
            config=self.tasks_config['write_blog_post_task'], # type: ignore[index]
        )

    @crew
    def crew(self) -> Crew:
        """Creates the MarketBlogCrew crew"""
        # To learn how to add knowledge sources to your crew, check out the documentation:
        # https://docs.crewai.com/concepts/knowledge#what-is-knowledge

        return Crew(
            agents=self.agents, # Automatically created by the @agent decorator
            tasks=self.tasks, # Automatically created by the @task decorator
            process=Process.sequential,
            verbose=True,
            # process=Process.hierarchical, # In case you wanna use that instead https://docs.crewai.com/how-to/Hierarchical/
        )
