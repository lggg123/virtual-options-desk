import asyncio
from alpha_vantage.async_support.alphavantage import AlphaVantage

API_KEY = 'YT2AAXGT9CAE5WEE'  # Replace with your actual key

tickers = ['SYF', 'GLD', 'WDC']

class PriceFetcher(AlphaVantage):
    async def get_price(self, symbol):
        function_name = 'GLOBAL_QUOTE'
        url = f'https://www.alphavantage.co/query?function={function_name}&symbol={symbol}&apikey={self.key}'
        data = await self._handle_api_call(url)
        quote = data.get('Global Quote', {})
        price = quote.get('05. price')
        timestamp = quote.get('07. latest trading day')
        return symbol, price, timestamp

async def main():
    fetcher = PriceFetcher(key=API_KEY, output_format='json')
    for ticker in tickers:
        symbol, price, timestamp = await fetcher.get_price(ticker)
        print(f'{symbol}: Price={price}, Date={timestamp}')
    await fetcher.close()

if __name__ == '__main__':
    asyncio.run(main())
