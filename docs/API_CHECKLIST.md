# API Documentation Checklist

**STRICT RULE**: Always check the official API documentation before writing any code that interacts with external APIs.

## Required Steps Before Writing Code

1. ✅ Check the official API documentation for the exact field names and response structure
2. ✅ Verify request/response schemas match the documentation exactly
3. ✅ Never assume field names - only use fields documented in official sources
4. ✅ Document any assumptions or TODOs if exact structure is unclear

## Authoritative API References

### Gelato APIs

**Getting Started – API integration**
https://support.gelato.com/en/articles/8996572-getting-started-with-api-integration

**Gelato API Reference (Full Documentation)**
https://dashboard.gelato.com/docs/

**Key Endpoints:**
- `GET /v1/templates/{templateId}` - Get Template
- `POST /v1/stores/{storeId}/products:create-from-template` - Create Product From Template

### UI Framework

**Tailwind CSS with Vite**
https://tailwindcss.com/docs/installation/using-vite

https://flowbite.com/docs/getting-started/introduction/

## Current Known Issues / TODOs

### Template Name Extraction
- **Status**: ✅ VERIFIED - Checked official API docs
- **Official Field**: `templateName` (string) - "Template name"
- **Secondary Field**: `title` (string) - "Product title"
- **Fixed**: Updated code to use `data.templateName` as primary field per official documentation

### Template Response Fields
- **Status**: ✅ VERIFIED - Checked official API docs
- **Verified Fields**:
  - `templateName` (string) - "Template name") - ✅ Using this
  - `title` (string - "Product title") - ✅ Fallback
  - `variants[]` (VariantObject[]) - ✅ Verified structure:
    - `id` (string) - Variant id
    - `title` (string) - Variant title (NOT `name`) - ✅ Using `variant.title`
    - `imagePlaceholders[]` with:
      - `name` (string) - Image placeholder name
      - `height` (number) - Height in mm - ✅ Using this
      - `width` (number) - Width in mm - ✅ Using this
      - `printArea` (string) - Print area location

### Create Product From Template
- Verify request body structure matches official docs exactly
- Verify response structure for product IDs, preview URLs, admin URLs

## Code Review Checklist

Before committing any code that uses external APIs:

- [ ] Consulted official API documentation
- [ ] Verified request payload structure matches docs
- [ ] Verified response parsing matches docs
- [ ] Added TODO comments if exact structure is unclear
- [ ] No assumptions made about undocumented fields
- [ ] Error handling accounts for actual API error response format

## How to Use This Checklist

1. Before writing any API-related code, open this file
2. Search the official API documentation for the relevant endpoint
3. Document any findings or uncertainties here
4. Only then proceed to write code using the documented fields

