import os
import requests
from typing import Type, Optional
from pydantic import BaseModel, Field
from crewai.tools import BaseTool

class EODHDPriceToolInput(BaseModel):
    symbol: str = Field(..., description="Ticker symbol to fetch price for.")
    exchange: Optional[str] = Field("US", description="Exchange code (default: US)")

class EODHDPriceTool(BaseTool):
    name: str = "EODHDPriceTool"
    description: str = "Fetches real-time price for a given symbol from the EODHD API."
    args_schema: Type[BaseModel] = EODHDPriceToolInput

    def __init__(self, api_url=None, api_key=None):
        """
        Initialize the tool with the EODHD API base URL and optional API key.
        
        Parameters:
            api_url (str | None): Base URL for the EODHD API. If None, reads the EODHD_API_URL environment variable or defaults to "http://localhost:3000".
            api_key (str | None): API token for authenticating requests. If None, reads the EODHD_API_KEY environment variable.
        """
        super().__init__()
        self.api_url = api_url or os.getenv("EODHD_API_URL", "http://localhost:3000")
        self.api_key = api_key or os.getenv("EODHD_API_KEY")

    def get_price(self, symbol: str, exchange: str = "US"):
        if "." not in symbol:
            symbol = f"{symbol}.{exchange}"
        url = f"{self.api_url}/api/market/eodhd?symbols={symbol}"
        headers = {"X-API-Token": self.api_key} if self.api_key else {}
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
            if data.get("success") and data["data"]:
                return data["data"][0]["close"]
        except Exception as e:")
            print(f"[EODHDPriceTool] Error fetching price for {symbol}: {e}")
            return None

    def _run(self, symbol: str, exchange: str = "US") -> Optional[float]:
        """CrewAI tool interface: fetch price for symbol (and optional exchange)."""
        return self.get_price(symbol, exchange)
