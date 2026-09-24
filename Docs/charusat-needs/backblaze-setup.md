# Charusat Needs — Backblaze B2 Cloud Storage Setup & Architecture

---

## 1. Overview & Free-Tier Specifications

Backblaze B2 provides S3-compatible cloud object storage for heavy media archives, vendor tax documentation, high-resolution food videos, and database logical dump backups.

### Zero-Cost Constraints:
* **Cost:** $0.00 / month (Free Tier).
* **Credit Card Requirement:** None.
* **Storage Allowance:** 10 GB free persistent storage.
* **Download Bandwidth:** 1 GB / day free egress.
* **API Calls:** 2,500 Class A transactions / day free (List, Upload, Delete).

---

## 2. Step-by-Step Provisioning Runbook

1. **Sign Up / Login:**
   - Navigate to `https://www.backblaze.com/b2/cloud-storage.html`.
   - Create a free account.
2. **Create Storage Bucket:**
   - In the B2 Cloud Storage dashboard, click **Create a Bucket**.
   - Bucket Name: `charusatneeds-media-prod` (must be globally unique).
   - Files in Bucket: `Public` (for public canteen media) or `Private` (for vendor documents and database backups).
   - Default Encryption: `Disable` (or SSE-B2).
   - Object Lock: `Disable`.
3. **Retrieve S3 Endpoint:**
   - Check the bucket details for the S3 Endpoint URL (e.g., `s3.us-west-004.backblazeb2.com` or `s3.eu-central-003.backblazeb2.com`).
4. **Generate Application Key:**
   - Navigate to **App Keys** → **Add a New Application Key**.
   - Name of Key: `charusatneeds-backend-key`
   - Allow access to Bucket: `charusatneeds-media-prod`
   - Type of Access: `Read and Write`
   - Copy:
     - `keyID`: Application Key ID
     - `applicationKey`: Application Key Secret (shown only once)

---

## 3. Configuration Mapping

In production Render environment variables or `.env`:

```env
B2_ENDPOINT=s3.[region].backblazeb2.com
B2_BUCKET=charusatneeds-media-prod
B2_KEY_ID=[keyID]
B2_APPLICATION_KEY=[applicationKey]
```

In the local Docker Compose environment, this S3 interface is emulated 100% offline by the MinIO container running on `http://minio:9000`.
