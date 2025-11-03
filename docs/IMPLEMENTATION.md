# Podmate - Implementation Documentation

## Purpose And Scope

This application is a local-only web tool for bulk-creating Gelato print-on-demand (POD) products from existing Gelato product templates. The app allows users to:

- Load one or more Gelato product templates
- Upload high-resolution artwork images locally
- Map uploaded images to template placeholders
- Set product metadata (title, description, tags, visibility, sales channels)
- Batch-create products via the Gelato API
- Review results, retry failures, and export outcomes to CSV

**Key Constraint**: This application uses **only** fields and endpoints documented in the official Gelato API documentation. No undocumented fields are assumed or added.

## Authoritative References

All API integrations must reference these official sources. Do not invent or assume any undocumented fields.

### Gelato Getting Started – API integration
https://support.gelato.com/en/articles/8996572-getting-started-with-api-integration

### Gelato API Reference
https://dashboard.gelato.com/docs/

### Tailwind with Vite
https://tailwindcss.com/docs/installation/using-vite

## Environment And Secrets

The application reads configuration from a `.env` file at the repository root. The following variables are expected:

### Required Variables

- `GELATO_API_KEY` - Gelato API key for authentication (server-only, never exposed to client)
- `GELATO_STORE_ID` - Gelato store identifier
- `GELATO_TEMPLATE_ID` - Default template ID (optional)
- `GELATO_IMAGES_FOLDER` - Local file path to scan for candidate images (e.g., `G:\Dropbox\AI Art\commercial.walljazzle\Gigapixel\Named`)
- `GELATO_PRODUCT_TITLE` - Default product title (e.g., `Walljazzle`)
- `GELATO_PRODUCT_DESCRIPTION` - Default product description (e.g., `A beautiful Walljazzle print`)
- `PUBLIC_BASE_URL` - Public HTTPS URL of the server (e.g., `https://<your-tunnel-subdomain>.trycloudflare.com`)
- `SERVER_PORT` - Server port (default: `5175`)

**Security Notes:**
- `GELATO_API_KEY` is only read by the server and never sent to the client
- Tokens in logs are masked
- Public file URLs use short-lived HMAC tokens (15-minute expiry)

## Local-Only Architecture

This application does **not** use cloud object storage (e.g., S3, GCS). Instead, files are stored locally and served by the backend over HTTPS through a secure tunnel.

### File Publication Endpoint

**Route**: `GET /public-files/:fileId?t=<token>&e=<expiry>`

The server generates signed URLs with the following structure:
```
${PUBLIC_BASE_URL}/public-files/<fileId>?t=<token>&e=<unix-expiry>
```

**Security:**
- Files are stored in `server/tmp/` with opaque identifiers
- Each file URL includes a short-lived HMAC token (15-minute expiry)
- Token verification prevents unauthorized access
- Directory traversal protection prevents accessing files outside the temp directory
- Tokens are validated using timing-safe comparison

### Token Scheme

Tokens are generated using HMAC-SHA256:
- Payload: `${fileId}.${expiryUnixTimestamp}`
- Secret: Random 32-byte key generated at server startup
- Format: `${hmacHex}.${expiryUnixTimestamp}`

Verification checks:
1. Token format validity
2. Expiry timestamp (current time must be < expiry)
3. HMAC signature match

### Tunnel Setup

The application requires a public HTTPS endpoint so Gelato can fetch uploaded files. This is achieved using a secure tunnel service.

#### Tunnel Setup Checklist

1. **Install Cloudflare Tunnel or ngrok**
   - Cloudflare: Install `cloudflared` CLI
   - ngrok: Install `ngrok` CLI and sign up for an account

2. **Start Tunnel**
   - **Cloudflare Tunnel**:
     ```bash
     cloudflared tunnel --url http://localhost:5175
     ```
     Copy the generated HTTPS URL (e.g., `https://<subdomain>.trycloudflare.com`)
   
   - **ngrok**:
     ```bash
     ngrok http 5175
     ```
     Copy the generated HTTPS URL (e.g., `https://<subdomain>.ngrok.io`)

3. **Set PUBLIC_BASE_URL**
   - Update `.env` file with the tunnel URL:
     ```
     PUBLIC_BASE_URL=https://<your-tunnel-subdomain>.trycloudflare.com
     ```

4. **Verify Health Endpoint**
   - Visit `{PUBLIC_BASE_URL}/health` from a separate network (e.g., mobile data)
   - Should return `200 OK` with body `"ok"`

5. **Test File Access**
   - Upload one image through the UI
   - Copy the generated `publicUrl`
   - Open the URL from a separate network
   - Image should load successfully

## Exact Endpoint Mapping

This section maps our backend routes to the official Gelato API endpoints.

### Our Backend Routes → Gelato API

| Our Route | Method | Gelato Endpoint | Gelato Method | Notes |
|-----------|--------|----------------|---------------|-------|
| `/api/templates/:id` | GET | `https://ecommerce.gelatoapis.com/v1/templates/{id}` | GET | Proxies Get Template request |
| `/api/products/create-from-template` | POST | `https://ecommerce.gelatoapis.com/v1/stores/{storeId}/products:create-from-template` | POST | Proxies Create Product From Template request |
| `/api/uploads/local` | POST | N/A | N/A | Local upload handler, returns signed URL |
| `/public-files/:fileId` | GET | N/A | N/A | Serves local files with token validation |
| `/health` | GET | N/A | N/A | Health check endpoint |

**Important**: All Gelato API requests include the `X-API-KEY` header with the value from `GELATO_API_KEY` environment variable.

## Payload Shapes

**CRITICAL**: Copy the exact request and response schemas from the official Gelato API documentation. Do not guess or add undocumented fields.

### Get Template

**Endpoint**: `GET https://ecommerce.gelatoapis.com/v1/templates/{templateId}`

**Headers**:
- `X-API-KEY: {GELATO_API_KEY}`
- `Content-Type: application/json`

**Response Schema**: 
Refer to the official Gelato API documentation for the exact response structure. The response typically includes:
- Template metadata (id, name, etc.)
- Variants array with:
  - Variant ID and name
  - Image placeholders with names and optional size information
  - Other variant-specific data

**Implementation Note**: The `TemplatePicker` component extracts variant and placeholder information from this response. Ensure the extraction logic matches the exact field names from the Gelato API response.

### Create Product From Template

**Endpoint**: `POST https://ecommerce.gelatoapis.com/v1/stores/{storeId}/products:create-from-template`

**Headers**:
- `X-API-KEY: {GELATO_API_KEY}`
- `Content-Type: application/json`

**Request Body Schema**: 
Refer to the official Gelato API documentation for the exact request body structure. Typically includes:
- `templateId` (string, required)
- `title` (string, required)
- `description` (string, required)
- `tags` (string[], optional)
- `isVisibleInTheOnlineStore` (boolean, optional)
- `salesChannels` (string[], optional) - Use exact enum values from docs
- `variants` (array, required):
  - `templateVariantId` (string, required)
  - `imagePlaceholders` (array, required):
    - `name` (string, required) - Must match placeholder name from template
    - `fileUrl` (string, required) - Public HTTPS URL (our signed URL)
    - `fitMethod` (string, optional) - Only include if documented in API (e.g., "slice", "meet")

**Response Schema**:
Refer to the official Gelato API documentation. Typically includes:
- Product ID
- Preview URL (if available)
- Admin URL (if available)
- Status and metadata

**Implementation Note**: The `Review` page extracts `productId`, `previewUrl`, and `adminUrl` from the response. Update the extraction logic to match the exact field names from the Gelato API response.

## Frontend UI And Flows

The application uses a three-page flow:

### Page 1: Home (`/`)

**Component**: `TemplatePicker`

- User pastes one or more template IDs (one per line or comma-separated)
- Clicks "Load Templates"
- Component fetches each template via `/api/templates/:id`
- Displays template name, variant count, and placeholder names for each loaded template
- "Continue to Mapping" button appears after templates are loaded

### Page 2: Mapping (`/mapping`)

**Components**: `FileBrowser`, `MappingGrid`, `MetadataPanel`

1. **FileBrowser**:
   - Drag-and-drop or browse to upload images
   - Files are uploaded to `/api/uploads/local`
   - Each file receives a signed `publicUrl` based on `PUBLIC_BASE_URL`
   - Uploaded files are displayed in a list

2. **MappingGrid**:
   - Displays templates → variants → placeholders hierarchy
   - User selects which variants to include (checkboxes)
   - For each placeholder, user selects an uploaded image from dropdown
   - Fit method selector (if supported by API)
   - "Auto-Map by Filename" button applies heuristics:
     - Filename contains "front|back|left|right" → maps to matching placeholder names
     - Can broadcast one image to all variants sharing the same placeholder name

3. **MetadataPanel**:
   - Title (required)
   - Description (required)
   - Tags (optional, add/remove)
   - Visibility toggle (`isVisibleInTheOnlineStore`)
   - Sales channels (placeholder for API enum values)

"Review & Create" button appears when variants are selected and files are uploaded.

### Page 3: Review (`/review`)

**Component**: `RunSheet`

- Shows summary of templates, variants, files, and metadata
- "Create Products" button triggers batch creation
- For each selected template + variant combination:
  - Validates all required placeholders have assigned images
  - Constructs request payload matching exact Gelato schema
  - Submits via `/api/products/create-from-template`
  - Updates results table with status, product ID, preview URL, admin URL, or error

**RunSheet Features**:
- Status column (pending/success/error) with color coding
- Product ID, Preview URL, Admin URL columns
- Error message display
- "Retry" button for failed rows (exponential backoff on 5xx errors)
- "Export CSV" button downloads results as CSV

## Validation, Errors, And Security

### Validation Rules

1. **Required Placeholders**: All placeholders for each selected variant must have an assigned `fileUrl`
2. **Image Resolution Warning**: If placeholder physical size is available from template response, warn when uploaded image dimensions are likely below 300 DPI (e.g., if placeholder is 200mm × 300mm and image is 1000px × 1500px)
3. **Metadata Requirements**: Title and description are required
4. **Variant Selection**: At least one variant must be selected before proceeding to review

### Error Handling

1. **Gelato API Errors**: Display error status code and body text verbatim in the RunSheet
2. **Retry Logic**: 
   - Retry button available for failed rows only
   - Exponential backoff with jitter for 5xx server errors
   - Max retries: 3
3. **Network Errors**: Display user-friendly message with option to retry
4. **Validation Errors**: Show inline errors in the UI with clear guidance

### Security

1. **API Key Protection**: `GELATO_API_KEY` is never sent to the client. All Gelato requests are proxied through the backend.
2. **Token Signing**: Public file URLs use HMAC-SHA256 tokens with 15-minute expiry
3. **Token Masking**: Tokens are masked in logs (first 4 and last 4 characters shown)
4. **Directory Traversal Protection**: File paths are resolved and validated against the temp directory
5. **CORS**: Configured for `http://localhost:5173` during development only

## Runbook

### Development

1. **Install Dependencies**:
   ```bash
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Configure Environment**:
   - Copy `.env.example` to `.env` (if provided) or create `.env` manually
   - Set all required variables (see Environment And Secrets section)

3. **Start Development Servers**:
   ```bash
   npm run dev
   ```
   This runs both client (port 5173) and server (port 5175) concurrently with hot reload.

4. **Set Up Tunnel**:
   - Start Cloudflare Tunnel or ngrok (see Tunnel Setup Checklist)
   - Update `PUBLIC_BASE_URL` in `.env` with the tunnel URL
   - Restart the server if needed

5. **Access Application**:
   - Open `http://localhost:5173` in your browser

### Building for Production

1. **Build Both Client and Server**:
   ```bash
   npm run build
   ```

2. **Client Build**: Outputs to `client/dist/`
3. **Server Build**: Outputs to `server/dist/`

4. **Run Production Server**:
   ```bash
   cd server
   NODE_ENV=production node dist/index.js
   ```

### Testing

```bash
npm test
```

Currently outputs placeholder messages. Add unit and integration tests as needed.

### Troubleshooting

1. **Tunnel URL Not Working**:
   - Verify tunnel is running and accessible from external network
   - Check `PUBLIC_BASE_URL` is set correctly in `.env`
   - Verify firewall/network settings allow tunnel traffic

2. **Gelato API Errors**:
   - Verify `GELATO_API_KEY` is correct
   - Check `GELATO_STORE_ID` is valid
   - Review Gelato API documentation for exact field requirements
   - Ensure request payload matches exact schema from docs

3. **File Upload Issues**:
   - Verify `server/tmp/` directory exists and is writable
   - Check file size limits (default: 100MB)
   - Ensure tunnel URL is accessible for file serving

## Acceptance Criteria

The application meets the following acceptance criteria:

✅ **Template Selection**: Multiple template IDs can be pasted, loaded, and their variants and placeholder names are displayed for each template.

✅ **Image Upload**: Images can be added via drag-and-drop or file browser. Files are uploaded to the server, stored locally, and receive working public URLs under `PUBLIC_BASE_URL` that Gelato can access via the tunnel.

✅ **Image Mapping**: Images can be mapped to placeholders per variant. Fit method selection is available where the API supports it. Variant subset selection is supported.

✅ **Metadata Configuration**: Title, description, tags, visibility toggle, and sales channels can be set (using exact enum values from Gelato docs).

✅ **Product Creation**: When the batch is run, products are created via the Gelato API. Product IDs and any preview or admin URLs returned by the API are displayed in the results table.

✅ **Results Management**: Failed rows can be retried individually. A CSV export of all results (template ID, status, product ID, URLs, errors) is available.

---

**Last Updated**: Generated during initial implementation  
**Note**: This document references official Gelato API documentation. Always verify field names and schemas against the latest API docs before implementing new features or fixing issues.

