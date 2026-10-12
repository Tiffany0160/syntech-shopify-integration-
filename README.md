# Syntech → Shopify Integration

This project automatically imports Syntech supplier products into Shopify.

The integration handles:

* Product creation
* Product updates
* SKU matching
* Product prices
* Product stock
* Product images
* Shopify inventory
* Duplicate prevention
* Failed-product tracking
* Automatic retries
* Large catalogue processing in batches

---

# 1. Project Location

The project is located at:

```text
C:\Users\tiffa\OneDrive\Desktop\syntech-shopify-integration
```

Open PowerShell in this folder before running commands.

---

# 2. Requirements

The project uses:

* Node.js
* Axios
* dotenv
* fast-xml-parser
* Shopify Admin API
* Syntech product feed

Node.js version currently used:

```text
Node v24.14.0
```

---

# 3. Project Structure

```text
syntech-shopify-integration
│
├── data
│   ├── syntech-full-cache.xml
│   ├── failed-products.json
│   └── failed-products.corrupt-*.json
│
├── src
│   │
│   ├── batch-sync.js
│   ├── server.js
│   ├── sync.js
│   │
│   ├── syntech
│   │   ├── client.js
│   │   ├── mapper.js
│   │   ├── parser.js
│   │   └── products.js
│   │
│   └── shopify
│       ├── client.js
│       ├── inventory.js
│       ├── media.js
│       └── products.js
│
├── .env
├── package.json
└── README.md
```

---

# 4. Syntech Feed

The integration uses the Syntech supplier feed.

There are two main feeds:

```text
SYNTECH_FULL_FEED_URL
SYNTECH_UPDATE_FEED_URL
```

## Full Feed

The full feed contains the complete Syntech product catalogue.

It is used when building or refreshing the complete catalogue.

## Update Feed

The update feed is intended for ongoing updates such as:

* Price changes
* Stock changes
* Product changes

---

# 5. Environment Variables

The `.env` file should contain the required configuration.

Example:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com

SHOPIFY_CLIENT_ID=YOUR_CLIENT_ID
SHOPIFY_CLIENT_SECRET=YOUR_CLIENT_SECRET

SHOPIFY_API_VERSION=2026-07

SHOPIFY_LOCATION_ID=YOUR_LOCATION_ID

SYNTECH_FULL_FEED_URL=YOUR_FULL_FEED_URL
SYNTECH_UPDATE_FEED_URL=YOUR_UPDATE_FEED_URL

CONCURRENCY=1

CREATE_AS_DRAFT=false

PORT=4000
```

Do not put Markdown formatting around values.

For example, use:

```env
SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
```

Not:

```env
*SHOPIFY_STORE_DOMAIN*=your-store.myshopify.com
```

Do not commit `.env` to GitHub.

---

# 6. Shopify Authentication

The project uses Shopify Client Credentials OAuth.

The application obtains an access token using:

```text
SHOPIFY_CLIENT_ID
SHOPIFY_CLIENT_SECRET
```

The integration then uses the token for Shopify API requests.

Do not replace this with an old permanent Admin API access-token setup unless the project is intentionally changed.

---

# 7. Shopify Location

Inventory is updated at the Shopify location specified by:

```env
SHOPIFY_LOCATION_ID=
```

The location should be the Shopify location where Syntech stock must be managed.

---

# 8. Product Matching

Products are matched using the SKU.

The integration first checks whether a Syntech SKU already exists in Shopify.

If it exists:

```text
UPDATE PRODUCT
```

If it does not exist:

```text
CREATE PRODUCT
```

This prevents the integration from creating duplicate products when the same batch is run again.

---

# 9. Product Status

The current configuration uses:

```env
CREATE_AS_DRAFT=false
```

Therefore products are intended to be created as active products rather than drafts.

---

# 10. Product Images

Syntech image URLs are downloaded and uploaded to Shopify.

The integration checks existing Shopify images before uploading.

Images are matched using their filenames.

For example:

```text
product-image-001.jpg
```

will not be uploaded again if that image already exists on the Shopify product.

---

# 11. Image Failure Handling

Images are processed one at a time.

If a product has:

```text
5 images
```

and:

```text
3 succeed
2 fail
```

the product is treated as failed.

The product is added to:

```text
data\failed-products.json
```

This allows the product to be retried later.

---

# 12. Shopify Rate Limits

Shopify can return:

```text
HTTP 429
Exceeded 2 calls per second for api client
```

The Shopify client includes request throttling and retry handling.

Requests are deliberately slowed down so that the integration does not continuously hit Shopify rate limits.

If Shopify returns a 429 response, the client waits before trying again.

The integration can retry a request several times before marking it as failed.

---

# 13. Full Catalogue Cache

The full Syntech XML feed is cached locally.

The cache is stored at:

```text
data\syntech-full-cache.xml
```

This prevents the integration from repeatedly downloading the full feed while testing batches.

If the cache exists, the batch process can use the cached feed.

---

# 14. Batch Processing

The full catalogue is processed in batches of:

```text
500 products
```

The current Syntech catalogue contains approximately:

```text
2,838 products
```

Therefore there are:

| Batch   |    Products |
| ------- | ----------: |
| Batch 1 |       1–500 |
| Batch 2 |   501–1,000 |
| Batch 3 | 1,001–1,500 |
| Batch 4 | 1,501–2,000 |
| Batch 5 | 2,001–2,500 |
| Batch 6 | 2,501–2,838 |

Total:

```text
6 batches
```

---

# 15. Running Batch 1

Open PowerShell in:

```text
C:\Users\tiffa\OneDrive\Desktop\syntech-shopify-integration
```

Run:

```powershell
node .\src\batch-sync.js 1
```

This processes:

```text
Products 1–500
```

---

# 16. Running Batch 2

```powershell
node .\src\batch-sync.js 2
```

Processes:

```text
Products 501–1000
```

---

# 17. Running Batch 3

```powershell
node .\src\batch-sync.js 3
```

Processes:

```text
Products 1001–1500
```

---

# 18. Running Batch 4

```powershell
node .\src\batch-sync.js 4
```

Processes:

```text
Products 1501–2000
```

---

# 19. Running Batch 5

```powershell
node .\src\batch-sync.js 5
```

Processes:

```text
Products 2001–2500
```

---

# 20. Running Batch 6

```powershell
node .\src\batch-sync.js 6
```

Processes:

```text
Products 2501–2838
```

---

# 21. Batch Summary

At the end of each batch, the system reports:

```text
BATCH COMPLETE

Products processed: 500
Successful: ...
Created: ...
Updated: ...
Failed: ...
```

For the final batch, fewer than 500 products will be processed.

---

# 22. Failed Products

Failed products are stored in:

```text
data\failed-products.json
```

A product can be placed into the failed queue because of:

* Shopify API errors
* Shopify rate limits
* Image upload failures
* Inventory errors
* Product creation errors
* Product update errors
* Network errors

---

# 23. Retry Failed Products

After the batches have been completed, retry the failed products with:

```powershell
node .\src\batch-sync.js retry-failed
```

The system will:

1. Read `failed-products.json`
2. Find the product by SKU
3. Update the existing Shopify product if it already exists
4. Update inventory
5. Retry missing images
6. Remove the product from the failed queue if successful

---

# 24. Important: Do Not Run Retry While a Batch Is Running

Only run:

```powershell
node .\src\batch-sync.js retry-failed
```

after the current batch has completely finished.

Do not run two sync processes at the same time.

This can cause:

* Shopify rate limits
* Duplicate requests
* Conflicting updates
* Incorrect failed-product records

---

# 25. If a Batch Is Interrupted

If the PowerShell window is closed or the process is stopped with:

```text
Ctrl + C
```

the Shopify products that were already created remain in Shopify.

Running the same batch again is safe because the integration checks the SKU.

Existing products are updated rather than recreated.

---

# 26. Failed Products File Safety

The failed-products file is written using a temporary file before replacing the main file.

This protects:

```text
data\failed-products.json
```

from becoming empty or corrupted if the process is interrupted while writing.

If a corrupt file is detected, a backup can be created as:

```text
failed-products.corrupt-XXXXXXXX.json
```

---

# 27. Recommended Running Order

For the complete catalogue, use:

```powershell
node .\src\batch-sync.js 1
```

Then:

```powershell
node .\src\batch-sync.js 2
```

Then:

```powershell
node .\src\batch-sync.js 3
```

Then:

```powershell
node .\src\batch-sync.js 4
```

Then:

```powershell
node .\src\batch-sync.js 5
```

Then:

```powershell
node .\src\batch-sync.js 6
```

Finally:

```powershell
node .\src\batch-sync.js retry-failed
```

---

# 28. Do Not Skip Failed Products

After all six batches have finished, check:

```text
data\failed-products.json
```

If products are still listed, run:

```powershell
node .\src\batch-sync.js retry-failed
```

Again if necessary.

The goal is:

```text
Still failed: 0
```

---

# 29. Testing

Before processing the entire catalogue, test with:

```powershell
node .\src\batch-sync.js 1
```

Monitor:

* Product creation
* Product updates
* SKU matching
* Price
* Stock
* Images
* Shopify rate limits
* Failed products

Do not immediately start all six batches until Batch 1 is confirmed to be working correctly.

---

# 30. Common Errors

## Error: Cannot find module

Example:

```text
Error: Cannot find module './syntech/feed'
```

This means the code is trying to load a file that does not exist.

The current project uses:

```text
src\syntech\parser.js
```

not:

```text
src\syntech\feed.js
```

---

# 31. Error: HTTP 429

Example:

```text
Exceeded 2 calls per second for api client.
```

This means Shopify rate limiting was triggered.

The current `client.js` includes request throttling and retries.

Do not start multiple sync processes simultaneously.

---

# 32. Error: failed-products.json Cannot Be Read

If you see:

```text
Could not read failed-products.json
```

check:

```text
data\failed-products.json
```

The system should preserve a backup if the JSON is corrupt.

Do not manually delete the file unless you know which failed products have already been recovered.

---

# 33. Checking JavaScript Syntax

Before running the sync, you can check the main files.

For example:

```powershell
node --check .\src\batch-sync.js
```

Check the Shopify client:

```powershell
node --check .\src\shopify\client.js
```

Check the media file:

```powershell
node --check .\src\shopify\media.js
```

If there is no output, the JavaScript syntax is valid.

---

# 34. Starting the Server

The project also contains:

```text
src\server.js
```

The server can be started with:

```powershell
node .\src\server.js
```

The configured port is:

```env
PORT=4000
```

The server functionality should be tested separately from the large batch import.

---

# 35. Important Safety Rules

Before running a large sync:

1. Make sure `.env` contains the correct Shopify store.
2. Make sure the Shopify location is correct.
3. Make sure the Syntech feed URLs are correct.
4. Make sure `CREATE_AS_DRAFT=false` is intentional.
5. Do not run multiple batch processes at the same time.
6. Do not delete the cached feed unnecessarily.
7. Do not delete `failed-products.json` until failed products have been reviewed.
8. Monitor the first batch before starting the remaining batches.

---

# 36. Complete Batch Command List

```powershell
# Batch 1
node .\src\batch-sync.js 1

# Batch 2
node .\src\batch-sync.js 2

# Batch 3
node .\src\batch-sync.js 3

# Batch 4
node .\src\batch-sync.js 4

# Batch 5
node .\src\batch-sync.js 5

# Batch 6
node .\src\batch-sync.js 6

# Retry failed products
node .\src\batch-sync.js retry-failed
```

---

# 37. Expected Final Result

After successful processing:

```text
Syntech products
        ↓
Shopify
        ↓
Products created/updated
        ↓
Inventory updated
        ↓
Images uploaded
        ↓
Failed products retried
        ↓
Failed queue reduced to 0
```

The final target is:

```text
Products processed: 2838
Failed: 0
```

and all Syntech products should exist in Shopify without duplicate products.
