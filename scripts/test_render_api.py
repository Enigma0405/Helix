import requests

# Live render URL from the user's curl:
url = "https://helix-3wfv.onrender.com/api/auth/login"

payload = {
    "email": "demo@helix.ai",
    "password": "Password123!" # Updated password
}

print(f"Testing POST {url}")
try:
    response = requests.post(url, json=payload)
    print(f"Status Code: {response.status_code}")
    print(f"Response Body: {response.text}")
except Exception as e:
    print(f"Request failed: {e}")
