# Branding Customization Feature

## Overview

The Proposal Maker now includes comprehensive branding customization features that allow you to fully customize the appearance of your proposals including headers, footers, logos, colors, thank you slides, and back covers.

## Features

### 1. **Database Schema**
- Added `branding` JSONB column to the `proposals` table
- Stores all branding configuration including colors, fonts, logos, and layout settings

### 2. **Backend API Endpoints**

#### Get Branding Configuration
```
GET /api/proposals/:id/branding
```
Returns the branding configuration for a specific proposal.

#### Update Complete Branding
```
PUT /api/proposals/:id/branding
```
Updates the entire branding configuration (merges with existing).

**Request Body:**
```json
{
  "primaryColor": "#F7941D",
  "secondaryColor": "#0066B3",
  "companyLogo": "base64_or_url",
  "header": {
    "enabled": true,
    "text": "Company Name",
    "backgroundColor": "#ffffff"
  }
}
```

#### Partial Branding Update
```
PATCH /api/proposals/:id/branding
```
Updates specific branding sections without affecting others.

**Request Body:**
```json
{
  "section": "header",
  "data": {
    "enabled": true,
    "text": "My Company",
    "logoPosition": "left"
  }
}
```

### 3. **Branding Editor Component**

Located at: `apps/web/src/components/branding/BrandingEditor.tsx`

**Features:**
- **Colors Tab**: Customize primary, secondary, and accent colors with color pickers
- **Logos Tab**: Upload company and client logos with preview
- **Fonts Tab**: Select heading and body fonts from predefined list
- **Header Tab**: Configure header appearance, text, logo position, and background color
- **Footer Tab**: Customize footer with company info, contact details, and page numbers
- **Slides Tab**: Design thank you slide and back cover with custom messaging

**Usage:**
```tsx
import { BrandingEditor } from '@/components/branding/BrandingEditor';

<BrandingEditor
  proposalId={proposalId}
  currentBranding={proposal.branding}
  onSave={(branding) => {
    // Save branding via API
  }}
/>
```

### 4. **Preview Component Updates**

The `ProposalPreview` component now supports:

#### Customizable Header
- Toggle header visibility
- Custom header text
- Logo positioning (left, center, right)
- Background color customization
- Auto-displays page numbers

#### Customizable Footer
- Toggle footer visibility
- Company information display
- Contact details (email, phone, website, address)
- Logo positioning
- Page number toggle
- Background color customization

#### Thank You Slide
```typescript
branding: {
  thankYouSlide: {
    enabled: true,
    title: "Thank You",
    message: "We look forward to working with you...",
    contactPerson: "John Doe",
    contactEmail: "john@company.com",
    contactPhone: "+1 234 567 8900"
  }
}
```

#### Back Cover
```typescript
branding: {
  backCover: {
    enabled: true,
    tagline: "Innovation Through Technology",
    socialMedia: {
      website: "https://yourcompany.com",
      linkedin: "https://linkedin.com/company/yourcompany",
      twitter: "https://twitter.com/yourcompany"
    },
    backgroundColor: "#f9fafb"
  }
}
```

### 5. **A4 Page Layout**

Added proper A4 page dimensions for print-ready proposals:

**CSS Classes:**
- `.proposal-preview.a4-layout` - Applies A4 dimensions (210mm x 297mm)
- Sections automatically paginate
- Print-optimized with proper margins (20mm standard)

**Print Styles:**
```css
@media print {
  @page {
    size: A4;
    margin: 0;
  }
}
```

## TypeScript Types

### BrandingConfig Interface

```typescript
export interface BrandingConfig {
  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  successColor?: string;
  warningColor?: string;

  // Typography
  fontFamily?: string;
  headingFont?: string;

  // Logos
  companyLogo?: string;
  clientLogo?: string;

  // Header customization
  header?: {
    enabled: boolean;
    logo?: string;
    logoPosition?: 'left' | 'center' | 'right';
    text?: string;
    textPosition?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    height?: number;
  };

  // Footer customization
  footer?: {
    enabled: boolean;
    logo?: string;
    logoPosition?: 'left' | 'center' | 'right';
    companyInfo?: string;
    contactInfo?: string;
    website?: string;
    email?: string;
    phone?: string;
    address?: string;
    backgroundColor?: string;
    height?: number;
    showPageNumbers?: boolean;
  };

  // Thank you slide
  thankYouSlide?: {
    enabled: boolean;
    title?: string;
    message?: string;
    logo?: string;
    backgroundColor?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  };

  // Back cover
  backCover?: {
    enabled: boolean;
    logo?: string;
    tagline?: string;
    socialMedia?: {
      linkedin?: string;
      twitter?: string;
      facebook?: string;
      website?: string;
    };
    backgroundColor?: string;
    backgroundImage?: string;
  };

  // Cover page
  coverPage?: {
    layout?: 'minimal' | 'standard' | 'modern' | 'elegant';
    showClientLogo?: boolean;
    showCompanyLogo?: boolean;
    backgroundImage?: string;
    backgroundColor?: string;
  };
}
```

## Database Migration

Run the following SQL to add the branding column:

```sql
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS branding JSONB;
```

Or use the migration file:
```bash
cd apps/api
psql -U your_user -d your_database < add-branding-column.sql
```

## Example: Complete Branding Setup

```typescript
const branding: BrandingConfig = {
  primaryColor: "#F7941D",
  secondaryColor: "#0066B3",
  accentColor: "#FFB347",
  fontFamily: "Arial",
  headingFont: "Helvetica",
  companyLogo: "data:image/png;base64,...",

  header: {
    enabled: true,
    text: "AstraZenith Technologies",
    logoPosition: "left",
    backgroundColor: "#ffffff"
  },

  footer: {
    enabled: true,
    companyInfo: "AstraZenith Technologies Pvt. Ltd.",
    email: "contact@astrazenith.com",
    phone: "+1 234 567 8900",
    website: "www.astrazenith.com",
    address: "123 Innovation Drive, Tech City",
    showPageNumbers: true,
    backgroundColor: "#f9fafb"
  },

  thankYouSlide: {
    enabled: true,
    title: "Thank You for Your Consideration",
    message: "We look forward to the opportunity to partner with you and deliver exceptional results.",
    contactPerson: "Jane Smith, Business Development Manager",
    contactEmail: "jane.smith@astrazenith.com",
    contactPhone: "+1 234 567 8901"
  },

  backCover: {
    enabled: true,
    tagline: "Transforming Ideas into Reality",
    socialMedia: {
      website: "https://astrazenith.com",
      linkedin: "https://linkedin.com/company/astrazenith",
      twitter: "https://twitter.com/astrazenith"
    },
    backgroundColor: "#f0f9ff"
  }
};

// Save to proposal
await fetch(`/api/proposals/${proposalId}/branding`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(branding)
});
```

## Integration with Existing Proposals

For the specific proposal `13986494-f166-4a7e-826b-e94bcd9cd2f0`:

1. **Access the branding editor** through your proposal dashboard
2. **Customize each section** using the tabbed interface
3. **Preview changes** in real-time in the proposal preview
4. **Save branding** to persist across sessions
5. **Export to PDF** with all customizations applied

## Best Practices

1. **Logo Format**: Use PNG with transparent background for best results
2. **Logo Size**: Recommended max size 2MB, dimensions 500x500px
3. **Colors**: Use hex color codes for consistency
4. **A4 Layout**: Enable for print-ready proposals
5. **Contact Info**: Always include in footer for professional appearance
6. **Thank You Slide**: Personalize message for each client
7. **Back Cover**: Keep social media links current

## Troubleshooting

### Logo Not Displaying
- Check image format (PNG, JPG, SVG supported)
- Verify base64 encoding is correct
- Check network tab for loading errors

### Colors Not Applying
- Ensure hex codes include `#` prefix
- Verify CSS variables are loaded
- Check browser compatibility

### A4 Layout Issues
- Clear browser cache
- Verify CSS file is imported
- Check print preview settings

## Future Enhancements

- [ ] Background image uploads for covers
- [ ] Custom font uploads (Google Fonts integration)
- [ ] Template presets for quick branding
- [ ] Brand guidelines import
- [ ] Multi-language support for thank you messages
- [ ] QR code generation for contact info
