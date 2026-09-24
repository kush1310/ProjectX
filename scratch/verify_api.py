import json
import urllib.request
import urllib.parse

BASE_URL = 'http://localhost:8000/api'

def test_api():
    print("Testing GET /api/canteens ...")
    try:
        req = urllib.request.Request(f'{BASE_URL}/canteens')
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print("Canteens raw response structure:", type(data), list(data.keys()) if isinstance(data, dict) else len(data))
            canteens = data.get('canteens', data.get('data', data)) if isinstance(data, dict) else data
            print(f"Status: {resp.status} - Retrieved {len(canteens)} canteens:")
            for c in canteens:
                c_id = c.get('id')
                name = c.get('name')
                is_open = c.get('isOpen')
                print(f"  [{c_id}] {name} - Open: {is_open}")

                # Test menu for each canteen
                menu_req = urllib.request.Request(f'{BASE_URL}/canteens/{c_id}/menu')
                with urllib.request.urlopen(menu_req) as menu_resp:
                    menu_data = json.loads(menu_resp.read().decode())
                    menu_items = menu_data.get('items', menu_data.get('data', menu_data)) if isinstance(menu_data, dict) else menu_data
                    print(f"      Menu item count: {len(menu_items)}")
                    if menu_items:
                        sample = menu_items[0]
                        print(f"      Sample: {sample.get('name')} - Rs {sample.get('price')} ({sample.get('category')})")
    except Exception as e:
        print("API Error:", e)

    # Test Vendor Login
    print("\nTesting Vendor Login (sweetspot@charusat.edu.in / Owner123) ...")
    try:
        login_data = json.dumps({
            "email": "sweetspot@charusat.edu.in",
            "password": "Owner123"
        }).encode('utf-8')
        login_req = urllib.request.Request(
            f'{BASE_URL}/auth/login',
            data=login_data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(login_req) as login_resp:
            res = json.loads(login_resp.read().decode())
            print("Vendor Login raw response:", res)
    except Exception as e:
        print("Vendor Login Error:", e)

    # Test Student Login
    print("\nTesting Student Login (kush@charusat.edu.in / Owner123) ...")
    try:
        s_data = json.dumps({
            "email": "kush@charusat.edu.in",
            "password": "Owner123"
        }).encode('utf-8')
        s_req = urllib.request.Request(
            f'{BASE_URL}/auth/login',
            data=s_data,
            headers={'Content-Type': 'application/json'}
        )
        with urllib.request.urlopen(s_req) as s_resp:
            res = json.loads(s_resp.read().decode())
            print("Student Login raw response:", res)
    except Exception as e:
        print("Student Login Error:", e)

if __name__ == '__main__':
    test_api()
