import requests

# Authenticate
login_url = "https://helix-3wfv.onrender.com/api/auth/login"
login_payload = {
    "email": "demo@helix.ai",
    "password": "Password123!"
}

print(f"Authenticating...")
login_res = requests.post(login_url, json=login_payload)
print(f"Login status: {login_res.status_code}")
if login_res.status_code != 200:
    print(login_res.text)
    exit(1)

token = login_res.json()["access_token"]
headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/json"
}

# List investigations
list_url = "https://helix-3wfv.onrender.com/api/investigations"
print(f"Fetching investigations list...")
list_res = requests.get(list_url, headers=headers)
print(f"List status: {list_res.status_code}")
if list_res.status_code != 200:
    print(list_res.text)
    exit(1)

items = list_res.json()["items"]
print(f"Total investigations found: {len(items)}")
if len(items) == 0:
    print("No investigations found.")
    exit(0)

# Get detail for the first item
first_id = items[0]["id"]
detail_url = f"https://helix-3wfv.onrender.com/api/investigations/{first_id}"
print(f"Fetching details for investigation {first_id}...")
detail_res = requests.get(detail_url, headers=headers)
print(f"Detail status: {detail_res.status_code}")
print(f"Detail Response: {detail_res.text}")
