# Image Management Feature

## Overview

The Image Asset Manager provides users with complete control over all images extracted from their templates. Users can rename, reorder, reassign roles, and delete images through an intuitive interface.

## Features

### 1. **Manage All Images in One Place**
   - View all extracted images (logos, charts, diagrams, photos) in a unified interface
   - See image previews, names, roles, and AI-generated metadata
   - Access from template preview dialog via "Manage Images" button

### 2. **Rename Images**
   - Click edit icon next to image name
   - Enter custom name
   - Save or cancel changes

### 3. **Assign Image Roles via Dropdown**
   - Select from predefined roles:
     - **Company Logo** - Main brand logo
     - **Header Logo** - Logo in header (repeats on all pages)
     - **Footer Logo** - Logo in footer (repeats on all pages)
     - **Cover Image** - Hero image on cover page
     - **Thank You Slide** - Final slide/page
     - **Chart/Graph** - Data visualization
     - **Diagram** - Flowchart or architecture diagram
     - **Photo** - Professional photo
     - **Icon** - Small decorative icon
     - **Decorative** - Background or decoration
     - **Unused** - Not used in template
   - Each role has description shown in dropdown
   - Color-coded badges show current role

### 4. **Reorder Images**
   - Use up/down arrows to change order
   - Affects display order in preview
   - First image in each role takes precedence

### 5. **Delete Unused Images**
   - Click trash icon to delete
   - Confirmation dialog prevents accidents
   - Reduces template size

### 6. **See AI Metadata**
   - View AI-generated description
   - See placement information (location, position)
   - Check which pages image repeats on

### 7. **Track Unused Images**
   - Footer shows count of unused images
   - Easily identify images to delete

## User Workflow

### Opening Image Manager

1. Click template card to open preview
2. Click **"Manage Images"** button in top right
3. Image Asset Manager dialog opens

### Managing Images

**Example workflow**:
```
1. Upload DOCX with 10 images
2. AI extracts:
   - 2 logos
   - 1 cover image
   - 5 charts
   - 2 decorative images

3. User opens Image Manager:
   - Sees all 10 images
   - Renames "image1.png" → "Company Logo"
   - Changes "decorative" images to "unused"
   - Deletes 2 unused images
   - Reorders charts to put most important first
   - Saves changes

4. Template now has:
   - 8 images total
   - Clear, meaningful names
   - Proper role assignments
```

## UI Components

### Image Card

Each image displays:
```
┌─────────────────────────────────────────────────────┐
│ [Preview]  | Name: Company Logo    [Edit] [Save] [X]│
│  (24x24)   | Role: [Dropdown: Company Logo ▼]       │
│            | AI: Blue brand logo with text           │
│            | Placement: cover_page @ top-left        │
│                                          [↑] [↓] [🗑]│
└─────────────────────────────────────────────────────┘
```

**Components**:
- **Preview**: 24x24px thumbnail
- **Name**: Editable field with edit/save/cancel buttons
- **Role Dropdown**: Select from 11 predefined roles
- **Badge**: Color-coded role indicator
- **AI Description**: From Gemini analysis
- **Placement Info**: Location and position
- **Actions**: Move up, move down, delete

### Role Badge Colors

| Role | Color |
|------|-------|
| Company Logo | Blue |
| Header Logo | Purple |
| Footer Logo | Purple |
| Cover Image | Green |
| Thank You Slide | Pink |
| Chart/Graph | Orange |
| Diagram | Cyan |
| Photo | Yellow |
| Icon | Gray |
| Decorative | Gray |
| Unused | Red |

### Footer

Shows:
- Count of unused images
- Cancel button
- Save Changes button (disabled while saving)

## Technical Implementation

### File Structure

```
/apps/web/src/components/templates/
├── ImageAssetManager.tsx      # Main component
├── TemplatePreviewDialog.tsx  # Updated with button
└── TemplateCard.tsx            # Fixed image loading
```

### Data Flow

```
1. User clicks "Manage Images"
   ↓
2. ImageAssetManager loads current assets
   ↓
3. Combines named assets + additional images into single array
   ↓
4. User makes changes (rename, reorder, assign roles, delete)
   ↓
5. User clicks "Save Changes"
   ↓
6. Reconstructs assets object from modified array
   ↓
7. Calls templateApi.update(templateId, { assets })
   ↓
8. Backend updates template in database
   ↓
9. Updates local state in TemplatePreviewDialog
   ↓
10. Closes ImageAssetManager
```

### Assets Structure

**Before Management** (AI extracted):
```typescript
{
  companyLogo: {
    data: "data:image/png;base64,...",
    placement: { location: "cover_page", position: "top-left", ... },
    metadata: { description: "Blue logo", confidence: 95 }
  },
  headerLogo: { ... },
  footerLogo: { ... },
  coverImage: { ... },
  thankYouSlide: { ... },
  images: [
    { data: "...", type: "chart", metadata: { ... } },
    { data: "...", type: "diagram", metadata: { ... } }
  ]
}
```

**After User Management**:
```typescript
{
  companyLogo: {
    data: "data:image/png;base64,...",
    placement: { ... },
    metadata: { ... }
  },
  headerLogo: {
    // User reassigned a chart to header logo
    data: "data:image/png;base64,...",
    type: "chart",  // Original type preserved
    name: "Quarterly Chart",  // User's custom name
    placement: { location: "header", ... },
    metadata: { ... }
  },
  images: [
    // Only images not assigned to named roles
    { data: "...", type: "diagram", name: "Architecture Diagram", ... }
  ]
  // Unused images deleted (not in output)
}
```

### API Endpoint

**PUT** `/api/templates/:id`

```typescript
// Request
{
  "assets": {
    "companyLogo": { ... },
    "headerLogo": { ... },
    // ... other assets
  }
}

// Response
{
  "id": "uuid",
  "name": "Template Name",
  "assets": { ... },  // Updated assets
  "schema": { ... },
  "styles": { ... },
  "updatedAt": "2025-01-08T..."
}
```

## Use Cases

### Use Case 1: Fix Incorrect AI Detection

**Scenario**: AI incorrectly assigned a chart as company logo

**Solution**:
1. Open Image Manager
2. Find the chart image
3. Change role from "Company Logo" → "Chart/Graph"
4. Select correct company logo
5. Change role to "Company Logo"
6. Save

### Use Case 2: Remove Unnecessary Images

**Scenario**: Template has decorative images that aren't needed

**Solution**:
1. Open Image Manager
2. Find decorative images
3. Change role to "Unused" or click delete
4. Save
5. Template size reduced

### Use Case 3: Organize Charts

**Scenario**: Multiple charts need better names and order

**Solution**:
1. Open Image Manager
2. Rename "image3.png" → "Q1 Revenue Chart"
3. Rename "image4.png" → "Q2 Revenue Chart"
4. Use up/down arrows to order chronologically
5. Save

### Use Case 4: Swap Header/Footer Logos

**Scenario**: AI put logos in wrong locations

**Solution**:
1. Open Image Manager
2. Find header logo
3. Change role to "Footer Logo"
4. Find footer logo
5. Change role to "Header Logo"
6. Save

## Benefits

### For Users

✅ **Full Control**: Manage all images in one place
✅ **Easy to Use**: Intuitive drag-and-drop alternative with up/down arrows
✅ **Visual Feedback**: See images, roles, and placements clearly
✅ **Flexible**: Change roles anytime without re-uploading
✅ **Organized**: Custom names make images easy to identify
✅ **Clean Templates**: Delete unused images to reduce size

### For Developers

✅ **Modular**: Self-contained component
✅ **Type-Safe**: TypeScript interfaces
✅ **Maintainable**: Clear data flow
✅ **Extensible**: Easy to add new roles or features
✅ **Consistent**: Uses existing templateApi.update()

## Future Enhancements

### Planned Features

1. **Drag & Drop Reordering**
   - More intuitive than up/down buttons
   - Visual feedback during drag

2. **Image Upload**
   - Add new images to template
   - Replace existing images

3. **Bulk Actions**
   - Select multiple images
   - Delete all unused at once
   - Batch rename

4. **Image Cropping**
   - Crop images inline
   - Adjust placement

5. **Advanced Filters**
   - Filter by role
   - Search by name
   - Sort by size, type, etc.

6. **Undo/Redo**
   - Revert changes before save
   - Step through history

7. **Preview Mode**
   - See how template looks with changes
   - Before saving

## Testing

### Manual Testing Checklist

- [ ] Open template preview
- [ ] Click "Manage Images" button
- [ ] Image Asset Manager opens
- [ ] All images display correctly
- [ ] Click edit icon on image name
- [ ] Rename image
- [ ] Save rename (green checkmark)
- [ ] Cancel rename (X button)
- [ ] Change image role via dropdown
- [ ] Badge color updates
- [ ] Move image up
- [ ] Move image down
- [ ] First image can't move up (disabled)
- [ ] Last image can't move down (disabled)
- [ ] Click delete
- [ ] Confirmation dialog appears
- [ ] Delete image
- [ ] Image removed from list
- [ ] Footer shows unused count
- [ ] Click "Save Changes"
- [ ] Saving indicator shows
- [ ] Success: Dialog closes
- [ ] Template preview updates with new images
- [ ] Reopen Image Manager
- [ ] Changes persisted

### Edge Cases

1. **No Images**: Shows empty state with icon
2. **All Images Deleted**: Shows empty state
3. **Only Unused Images**: Red badge, high unused count
4. **Very Long Names**: Text truncates properly
5. **Large Images**: Thumbnails sized correctly
6. **API Error**: Shows error message, doesn't close dialog

## Keyboard Shortcuts (Future)

| Key | Action |
|-----|--------|
| `↑` | Move image up |
| `↓` | Move image down |
| `Delete` | Delete selected image |
| `Enter` | Save rename |
| `Esc` | Cancel rename / Close dialog |
| `Ctrl+S` | Save all changes |

## Accessibility

- [ ] Keyboard navigation
- [ ] Screen reader labels
- [ ] Focus indicators
- [ ] ARIA attributes
- [ ] High contrast mode support

## Files Modified

### Created
- `/apps/web/src/components/templates/ImageAssetManager.tsx` - Main component (370 lines)

### Modified
- `/apps/web/src/components/templates/TemplatePreviewDialog.tsx`:
  - Added "Manage Images" button
  - Integrated ImageAssetManager component
  - State management for assets

## Summary

The Image Asset Manager provides users with professional-grade control over template images, fixing AI mistakes, organizing content, and optimizing templates - all through an intuitive interface.

**Key Metrics**:
- 11 image role types
- 4 actions per image (rename, assign, reorder, delete)
- Real-time visual feedback
- Persistent changes via API
- Clean, modern UI using shadcn/ui components
