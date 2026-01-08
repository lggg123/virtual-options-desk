import os
import requests

class EODHDPriceTool:
    """
    Tool to fetch real-time price for a symbol from the EODHD API endpoint.
    """
    def __init__(self, api_url=None, api_key=None):
        self.api_url = api_url or os.getenv("EODHD_API_URL", "http://localhost:3000")
        self.api_key = api_key or os.getenv("EODHD_API_KEY")

    def get_price(self, symbol, exchange="US"):
        # Support both plain and qualified symbols
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
        except Exception as e:
            print(f"[EODHDPriceTool] Error fetching price for {symbol}: {e}")
        return None
