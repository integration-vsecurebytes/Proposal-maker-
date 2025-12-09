# Dynamic Image Placement System

## Overview

The AI extraction system now includes **100% dynamic image placement detection** with ZERO hardcoded positions.

## How It Works

### 1. Gemini AI Extracts Placement Data

For each image, Gemini 2.0 Flash analyzes and extracts:

**Placement Properties**:
- `position`: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right"
- `alignment`: "left" | "center" | "right"
- `repeatsOnPages`: "all" | "first_only" | "last_only" | "none"
- `size`: "small" | "medium" | "large" | "full-width"

**Example AI Output**:
```json
{
  "type": "header_logo",
  "location": "header",
  "placement": {
    "position": "top-right",
    "alignment": "right",
    "repeatsOnPages": "all",
    "size": "small"
  }
}
```

### 2. Placement Data Stored in Template

The extracted placement data is stored in the template's assets:

```json
{
  "assets": {
    "headerLogo": {
      "data": "data:image/png;base64,...",
      "placement": {
        "location": "header",
        "position": "top-right",
        "alignment": "right",
        "repeatsOnPages": "all",
        "maxWidth": "120px",
        "maxHeight": "60px"
      },
      "metadata": {
        "description": "Company logo in header",
        "confidence": 92
      }
    }
  }
}
```

### 3. Usage in Preview/Generation

When rendering or generating proposals, the placement data tells the system:

- **Where** to place the image (header, footer, cover_page, body, end_slide)
- **How** to position it (top-right, center, bottom-left, etc.)
- **Size constraints** (maxWidth, maxHeight based on AI-detected size)
- **Repetition** (which pages should show the image)

## Image Types & Typical Placements

### Company Logo
- **Location**: cover_page
- **Typical Position**: top-left or top-center
- **Size**: medium
- **Repeats**: none (cover only)

### Header Logo
- **Location**: header
- **Typical Position**: top-right
- **Size**: small
- **Repeats**: all pages

### Footer Logo
- **Location**: footer
- **Typical Position**: bottom-left
- **Size**: small
- **Repeats**: all pages

### Cover Image
- **Location**: cover_page
- **Typical Position**: center
- **Size**: full-width
- **Repeats**: first_only

### Thank You Slide
- **Location**: end_slide
- **Typical Position**: center
- **Size**: full-width (fullPage: true)
- **Repeats**: last_only

### Charts & Diagrams
- **Location**: body (in sections)
- **Typical Position**: inline or center
- **Size**: large
- **Repeats**: none

### Photos & Decorative Images
- **Location**: body
- **Typical Position**: varies (center, float-right)
- **Size**: medium
- **Repeats**: none

## Size Mapping

AI sizes are mapped to responsive dimensions:

```typescript
{
  'small':      { maxWidth: '120px', maxHeight: '60px' },
  'medium':     { maxWidth: '200px', maxHeight: '100px' },
  'large':      { maxWidth: '400px', maxHeight: '200px' },
  'full-width': { maxWidth: '100%',  maxHeight: '400px' }
}
```

## Fallback Logic

**Only applied when AI can't detect specific header/footer logos**:

1. If no `headerLogo` detected → Use `companyLogo` with smart placement:
   - Location: header
   - Position: top-right
   - Size: small
   - Repeats: all

2. If no `footerLogo` detected → Use `companyLogo` with smart placement:
   - Location: footer
   - Position: bottom-left
   - Size: small
   - Repeats: all

## Benefits

✅ **100% Dynamic**: No hardcoded positions
✅ **AI-Driven**: Gemini analyzes actual document layout
✅ **Accurate**: Respects original document structure
✅ **Flexible**: Works with any template design
✅ **Preview-Ready**: Placement data can be used directly in UI
✅ **Generation-Ready**: DOCX/PDF generators can use placement metadata

## Example Complete Template Structure

```json
{
  "schema": {
    "name": "Business Proposal Template",
    "sections": [...],
    "imageLocations": {
      "companyLogo": "cover_page",
      "headerLogo": "header",
      "footerLogo": "footer",
      "coverImage": "cover_page",
      "thankYouSlide": "end_slide"
    }
  },
  "assets": {
    "companyLogo": {
      "data": "...",
      "placement": { "location": "cover_page", "position": "top-left", ... }
    },
    "headerLogo": {
      "data": "...",
      "placement": { "location": "header", "position": "top-right", "repeatsOnPages": "all", ... }
    },
    "footerLogo": {
      "data": "...",
      "placement": { "location": "footer", "position": "bottom-left", "repeatsOnPages": "all", ... }
    },
    "coverImage": {
      "data": "...",
      "placement": { "location": "cover_page", "position": "center", "size": "full-width", ... }
    },
    "thankYouSlide": {
      "data": "...",
      "placement": { "location": "end_slide", "position": "center", "fullPage": true, ... }
    },
    "images": [
      {
        "data": "...",
        "type": "chart",
        "placement": { "location": "body", "position": "inline", "size": "large", ... }
      }
    ]
  }
}
```

## Next Steps

When implementing preview/generation:

1. **Read placement data** from assets
2. **Respect location** (header, footer, body, etc.)
3. **Apply position** (CSS: justify-content, align-items based on position)
4. **Use size constraints** (maxWidth, maxHeight)
5. **Handle repetition** (which pages to show on)

Example CSS usage:
```typescript
const positionStyles = {
  'top-left': { justifyContent: 'flex-start', alignItems: 'flex-start' },
  'top-center': { justifyContent: 'center', alignItems: 'flex-start' },
  'top-right': { justifyContent: 'flex-end', alignItems: 'flex-start' },
  'center': { justifyContent: 'center', alignItems: 'center' },
  // ... etc
};
```
