import os
import requests
from typing import Type, Optional
from pydantic import BaseModel, Field
from crewai_tools import BaseTool
from pydantic import PrivateAttr

class AlphaVantagePriceToolInput(BaseModel):
    symbol: str = Field(..., description="Ticker symbol to fetch price for.")

class AlphaVantagePriceTool(BaseTool):
        def _run(self, symbol: str) -> Optional[float]:
            """
            Required by BaseTool: fetches the price for the given symbol.
            """
            return self.get_price(symbol)
    name: str = "AlphaVantagePriceTool"
    description: str = "Fetches real-time price for a given symbol from the Alpha Vantage API."
    args_schema: Type[BaseModel] = AlphaVantagePriceToolInput
    _api_key: str = PrivateAttr()

    def __init__(self, api_key=None):
        super().__init__()
        self._api_key = api_key or os.getenv("ALPHA_VANTAGE_API_KEY")

    def get_price(self, symbol: str):
        """
        Fetches the latest price for a symbol from the Alpha Vantage API.
        Returns float or None.
        """
        if not self._api_key:
            raise ValueError("Alpha Vantage API key not set in environment or constructor.")
        url = f"https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol={symbol}&apikey={self._api_key}"
        try:
            response = requests.get(url, timeout=10)
            response.raise_for_status()
            data = response.json()
            quote = data.get("Global Quote", {})
            price = quote.get("05. price")
            if price:
                return float(price)
        except Exception:
            pass
        return None
