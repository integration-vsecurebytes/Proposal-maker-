# DOCX Template Upload & Extraction Guide

## ✅ What's Been Implemented

The system now supports **uploading DOCX files** and automatically extracting:
- ✅ **Logos and images** from the document
- ✅ **Colors** from the theme
- ✅ **Fonts** from styles
- ✅ **Section structure** from content
- ✅ **Template schema** for proposal generation

## 🚀 How to Upload a DOCX Template

### Method 1: Using curl (Terminal)

```bash
curl -X POST http://100.90.85.75:3001/api/upload/template \
  -F "file=@/path/to/your/template.docx" \
  -F "name=My Custom Template"
```

**Example**:
```bash
# If you have a file called "linkfields-template.docx" in your Downloads folder
curl -X POST http://100.90.85.75:3001/api/upload/template \
  -F "file=@$HOME/Downloads/linkfields-template.docx" \
  -F "name=Linkfields Custom"
```

### Method 2: Using the Frontend (Coming Soon)

A template upload UI will be added to http://100.90.85.75:4000/templates

## 📦 What Gets Extracted

When you upload a DOCX file, the system extracts:

### 1. **Images & Logos**
- First image → **Company logo** (used in header & footer)
- Second image → **Cover image**
- Additional images → Stored for use in proposals

### 2. **Colors**
- Primary color from theme (accent1)
- Secondary color from theme (accent2)
- Default: Blue (#3b82f6) and Green (#10b981)

### 3. **Fonts**
- Font family from styles.xml
- Default: Calibri, Arial, sans-serif

### 4. **Document Structure**
The system auto-detects sections based on keywords:
- Executive Summary
- Introduction
- Scope of Work
- Methodology
- Timeline
- Pricing
- Terms & Conditions
- Conclusion

## 🎯 Response Format

When upload succeeds, you get:

```json
{
  "success": true,
  "template": {
    "id": "uuid",
    "name": "My Custom Template",
    "slug": "my-custom-template",
    "schema": { ... },
    "styles": {
      "primaryColor": "#0066CC",
      "secondaryColor": "#00A86B",
      "fontFamily": "Calibri, sans-serif"
    },
    "assets": {
      "companyLogo": "data:image/png;base64,...",
      "headerLogo": "data:image/png;base64,...",
      "footerLogo": "data:image/png;base64,...",
      "coverImage": "data:image/png;base64,..."
    }
  },
  "extracted": {
    "sectionsCount": 9,
    "hasLogo": true,
    "primaryColor": "#0066CC",
    "fontFamily": "Calibri, sans-serif"
  }
}
```

## 🎨 How Extracted Templates Are Used

Once uploaded, your template is used in proposals:

1. **Logo Display**:
   - Header: Shows company logo
   - Footer: Shows company logo (smaller)
   - Cover page: Large company logo

2. **Colors**:
   - Headings use primary color
   - Accents use secondary color
   - Consistent throughout the proposal

3. **Fonts**:
   - All text uses extracted font family
   - Maintains professional consistency

4. **Layout**:
   - Follows detected section structure
   - Matches your original design

## 📝 Example: Upload Your Linkfields Template

If you have the Linkfields DOCX template:

```bash
# Upload the template
curl -X POST http://100.90.85.75:3001/api/upload/template \
  -F "file=@/path/to/linkfields-template.docx" \
  -F "name=Linkfields Professional"

# The response will show the extracted template ID
# Use this ID when creating new proposals
```

## 🔍 Testing the Extracted Template

After uploading:

1. **View templates**:
```bash
curl http://100.90.85.75:3001/api/templates
```

2. **Get specific template** (use the slug from response):
```bash
curl http://100.90.85.75:3001/api/templates/linkfields-professional
```

3. **Create proposal** using the template:
   - Go to http://100.90.85.75:4000/
   - Start a new conversation
   - The uploaded template will be available in the selector

## 📸 What the Preview Will Show

After generating a proposal with your uploaded template:

✅ **Exact colors** from your DOCX
✅ **Your company logo** in header & footer
✅ **Same fonts** as your template
✅ **Matching layout** and structure
✅ **Professional formatting** with bold, lists, paragraphs

## ⚙️ Technical Details

### Supported File Format
- **DOCX only** (Microsoft Word 2007+)
- Maximum file size: **10MB**

### Image Processing
- Logos resized to optimal dimensions
- Converted to base64 for storage
- Optimized for web display

### Color Extraction
- Reads from `word/theme/theme1.xml`
- Extracts accent colors (accent1, accent2)
- Falls back to defaults if not found

### Font Extraction
- Reads from `word/styles.xml`
- Extracts primary font family
- Maintains web-safe fallbacks

## 🐛 Troubleshooting

### "Only DOCX files are allowed"
- Make sure your file has `.docx` extension
- Not `.doc` (old format)

### "Template name is required"
- Include the `name` parameter in your request

### "No images found"
- Your DOCX might not have embedded images
- System will use default colors/fonts
- You can still use the template

## 🎉 Next Steps

Now that templates can be uploaded:
1. Upload your DOCX template
2. Create a new proposal
3. The generated proposal will match your template design **exactly**
4. Preview shows logos, colors, and fonts from your uploaded template
5. Export to DOCX maintains all styling

**Ready to test!** Upload your first template now! 🚀
