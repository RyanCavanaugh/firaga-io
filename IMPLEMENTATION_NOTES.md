# 3D Output Format Implementation

## Summary
Successfully implemented two new 3D output formats for the Firaga.io application, accessible via a new dialog similar to the existing Print dialog.

## Changes Made

### 1. New Files Created

#### `src/threed-generator.ts`
- **3MF Format**: Generates industry-standard 3MF triangle mesh files
  - Separate material shapes for each color
  - Proper XML structure with materials, vertices, and triangles
  - Creates voxel-based 3D representation (1 cube per pixel)
  - Configurable pixel height and base height
  
- **OpenSCAD Masks Format**: Generates a ZIP file containing
  - One black/white PNG mask image per color
  - OpenSCAD `.scad` file that uses `surface()` heightmap functionality
  - Automatically combines all layers with proper coloring
  - Each layer positioned at correct Z-offset

#### `src/components/threed-dialog.tsx`
- User interface for 3D export configuration
- Format selection (radio buttons)
- Height settings (pixel height and base height in mm)
- Follows same design patterns as PrintDialog
- Uses Preact hooks for state management

### 2. Modified Files

#### `src/types.tsx`
- Added `is3DOpen: boolean` to `AppProps.ui` interface

#### `src/firaga.tsx`
- Added `is3DOpen: false` to default UI state initialization

#### `src/app.tsx`
- Imported `ThreeDDialog` component
- Added 📦 toolbar button for 3D export
- Added Ctrl+D keyboard shortcut
- Added Escape key support for closing 3D dialog
- Rendered ThreeDDialog when `is3DOpen` is true

### 3. Dependencies Added
- `jszip` - For creating ZIP archives (OpenSCAD format)
- `@types/jszip` - TypeScript type definitions
- `file-saver` - Already present, used for downloading generated files

## Features

### 3MF Format
- Industry-standard format compatible with most 3D modeling software
- Full color support using material properties
- Each pixel becomes a 1mm × 1mm × (configurable height) cube
- Proper mesh triangulation (12 triangles per cube)
- XML-based format packaged as ZIP

### OpenSCAD Masks Format
- Parametric approach using OpenSCAD's heightmap functionality
- One mask image per color (black = pixel present, white = empty)
- Automatically generated SCAD file with:
  - Configurable pixel size and height parameters
  - Correct RGB color values for each layer
  - Proper scaling and positioning
- Easy to customize and modify in OpenSCAD

## User Experience
1. Click 📦 button in toolbar (or press Ctrl+D)
2. Select desired format (3MF or OpenSCAD Masks)
3. Configure height settings
4. Click "Export 3D"
5. File downloads automatically

## Technical Details
- TypeScript compilation: ✓ No errors
- Build process: ✓ Successful
- Module system: CommonJS with Preact JSX
- File format standards: Compliant with 3MF specification
- Error handling: Type-safe with proper async/await
