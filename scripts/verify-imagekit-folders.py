#!/usr/bin/env python3
"""
verify-imagekit-folders.py

Verifies and provisions the CharusatNeeds ImageKit CDN directory hierarchy.
Ensures idempotent execution across base directories and vendor-specific paths.
Safe to execute repeatedly. Does NOT log API keys or secrets.
"""

import os
import sys
import json
import base64
import urllib.request
import urllib.error

BASE_FOLDERS = [
    ("charusatneeds", "/"),
    ("canteens", "/charusatneeds"),
    ("menu-items", "/charusatneeds"),
    ("offers", "/charusatneeds"),
    ("banners", "/charusatneeds"),
    ("videos", "/charusatneeds"),
]

DYNAMIC_VENDOR_TEST_PATHS = [
    ("campus-bites", "/charusatneeds/menu-items"),
    ("campus-bites", "/charusatneeds/canteens"),
    ("campus-bites", "/charusatneeds/offers"),
]

def get_credentials():
    private_key = os.environ.get("IMAGEKIT_PRIVATE_KEY")
    # If not in environment, check fallback in local application properties
    if not private_key:
        app_props_path = os.path.join(
            os.path.dirname(__file__), "..", "Backend", "src", "main", "resources", "application.properties"
        )
        if os.path.exists(app_props_path):
            with open(app_props_path, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("imagekit.private-key="):
                        val = line.split("=", 1)[1].strip()
                        if val and not val.startswith("${"):
                            private_key = val
                            break

    url_endpoint = os.environ.get("IMAGEKIT_URL_ENDPOINT", "https://ik.imagekit.io/cyseckush/")
    public_key = os.environ.get("IMAGEKIT_PUBLIC_KEY", "public_+grCFOmI0qDm3NTqiEhsvLFrhgc=")

    if not private_key:
        # Check command line arg if provided: --private-key <key>
        for i, arg in enumerate(sys.argv):
            if arg == "--private-key" and i + 1 < len(sys.argv):
                private_key = sys.argv[i + 1]
                break

    return private_key, public_key, url_endpoint

def create_folder(private_key, folder_name, parent_folder_path):
    url = "https://api.imagekit.io/v1/folder/"
    payload = json.dumps({
        "folderName": folder_name,
        "parentFolderPath": parent_folder_path
    }).encode("utf-8")

    auth_token = base64.b64encode(f"{private_key}:".encode()).decode()
    req = urllib.request.Request(
        url,
        data=payload,
        headers={
            "Authorization": f"Basic {auth_token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
            "User-Agent": "CharusatNeeds-FolderVerifier/1.0"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status in (200, 201)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")
        if e.code == 400 and "already exists" in body.lower():
            return True
        print(f"  [WARN] ImageKit API HTTP {e.code} for folder '{folder_name}': {body}")
        return False
    except Exception as e:
        print(f"  [ERROR] Network error creating '{folder_name}': {e}")
        return False

def verify_folder(private_key, folder_path):
    url = f"https://api.imagekit.io/v1/files?path={folder_path.lstrip('/')}"
    auth_token = base64.b64encode(f"{private_key}:".encode()).decode()
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": f"Basic {auth_token}",
            "Accept": "application/json",
            "User-Agent": "CharusatNeeds-FolderVerifier/1.0"
        }
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception:
        return False

def main():
    print("=================================================================")
    print("  CharusatNeeds ImageKit CDN — Folder Hierarchy Verification")
    print("=================================================================")

    private_key, public_key, url_endpoint = get_credentials()

    if not private_key:
        print("[ERROR] IMAGEKIT_PRIVATE_KEY environment variable is not set.")
        print("Please export IMAGEKIT_PRIVATE_KEY or supply via --private-key <key>.")
        sys.exit(1)

    print(f"  CDN Endpoint: {url_endpoint}")
    print(f"  Public Key:   {public_key[:12]}... (sanitized)")
    print(f"  Private Key:  [PROTECTED - length {len(private_key)} chars]")
    print("-----------------------------------------------------------------")
    print("Verifying and ensuring required base folder hierarchy:")

    all_passed = True

    # 1. Base Hierarchy
    for folder_name, parent_path in BASE_FOLDERS:
        full_path = (parent_path.rstrip('/') + '/' + folder_name).lstrip('/')
        created = create_folder(private_key, folder_name, parent_path)
        exists = verify_folder(private_key, full_path)
        status = "VERIFIED [OK]" if (created or exists) else "FAILED [X]"
        print(f"  -> Path: {full_path:<35} Status: {status}")
        if not (created or exists):
            all_passed = False

    # 2. Dynamic Vendor Paths
    print("-----------------------------------------------------------------")
    print("Testing dynamic vendor folder provisioning:")
    for folder_name, parent_path in DYNAMIC_VENDOR_TEST_PATHS:
        full_path = (parent_path.rstrip('/') + '/' + folder_name).lstrip('/')
        created = create_folder(private_key, folder_name, parent_path)
        exists = verify_folder(private_key, full_path)
        status = "VERIFIED [OK]" if (created or exists) else "FAILED [X]"
        print(f"  -> Vendor Path: {full_path:<28} Status: {status}")
        if not (created or exists):
            all_passed = False

    print("=================================================================")
    if all_passed:
        print("RESULT: All ImageKit folders successfully verified and provisioned.")
        sys.exit(0)
    else:
        print("RESULT: Some folders failed to provision. Check logs above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
