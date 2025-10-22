import asyncio
import httpx
import json

async def test_post():
    url = 'http://127.0.0.1:5555/start'
    start_data = {
        'proxyid': 7,
        'Controller_type': 'ReverseProxy',
        'proxy_ip': '192.168.1.1',
        'proxy_port': '8080',
        'remark': 'TSC1'
    }

    print('Testing POST request with httpx:')
    print(f'URL: {url}')
    print(f'Data: {json.dumps(start_data, indent=2)}')

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=start_data, timeout=5.0)
            print(f'Status Code: {response.status_code}')
            print(f'Response Headers: {dict(response.headers)}')
            if response.text:
                print(f'Response Body: {response.text}')
            else:
                print('Empty response body')
    except Exception as e:
        print(f'Error: {type(e).__name__}: {e}')

if __name__ == "__main__":
    asyncio.run(test_post())