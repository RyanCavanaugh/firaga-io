# 3D Output Format Implementation Summary

## Overview
Implemented a new "3D" output feature that allows users to export their pixel art images in 3D formats. The feature is accessible via a new toolbar button and dialog similar to the existing Print dialog.

## Implementation Details

### 1. New Components Created

#### `src/components/threed-dialog.tsx`
- Dialog component for 3D export options
- Provides radio button selection between 3MF and OpenSCAD formats
- Follows the same pattern as the existing Print dialog

#### `src/threed-3mf.ts`
- Generates 3MF (3D Manufacturing Format) files
- Creates a triangle mesh with separate materials for each color
- Each pixel becomes a unit cube in 3D space
- Colors are preserved using the standard 3MF material system
- Output is a proper XML-based 3MF file

#### `src/threed-openscad.ts`
- Generates a ZIP file containing:
  - One monochrome PNG image per color (black/white mask)
  - An OpenSCAD `.scad` file that loads all images as heightmaps
  - The OpenSCAD file combines layers to create a 3D display
- Uses JSZip library for ZIP file generation
- Each color layer is stacked vertically in the 3D model

### 2. Modified Files

#### `src/types.tsx`
- Added `ThreeDProps` type with format selection
- Added `threed` property to `AppProps`
- Added `is3DOpen` to UI state

#### `src/app.tsx`
- Imported `ThreeDDialog` component
- Added 3D button to toolbar (🧊 icon)
- Added keyboard shortcut: Ctrl+D to toggle 3D dialog
- Added Escape key handler for closing 3D dialog
- Rendered ThreeDDialog when `is3DOpen` is true

#### `src/firaga.tsx`
- Added default `threed` settings to `DefaultAppProps`
- Added `is3DOpen: false` to default UI state

#### `package.json` & `package-lock.json`
- Added `jszip` and `@types/jszip` dependencies

### 3. Output Formats

#### 3MF Format
- Industry-standard 3D manufacturing format
- Compatible with most 3D modeling software and slicers
- Each color is a separate object with its own material
- Geometry is a triangle mesh (12 triangles per pixel cube)
- Suitable for 3D printing and visualization

#### OpenSCAD Masks Format
- ZIP file containing multiple files
- Black/white images show which pixels are filled for each color
- OpenSCAD script uses `surface()` function with heightmaps
- Layers are stacked vertically with configurable height
- Allows for easy customization in OpenSCAD

### 4. User Interface
- New "3D" button in toolbar between "Print" and "Settings"
- Dialog displays two format options with icons and descriptions
- Export button generates the selected format and downloads it
- Cancel button closes the dialog
- Keyboard shortcut: Ctrl+D

## Technical Decisions

1. **Used existing patterns**: Followed the same structure as PrintDialog for consistency
2. **Type safety**: All new code uses strict TypeScript typing
3. **Browser APIs**: Used Canvas API for image generation, Blob API for downloads
4. **No external 3D libraries**: Generated 3MF XML manually for minimal dependencies
5. **Modular design**: Separate files for each export format

## Testing
- TypeScript compilation: ✓ No errors
- Build process: ✓ Successful (docs/firaga.js generated)
- Code structure: ✓ Follows project conventions

## Future Enhancements (Not Implemented)
- Preview of 3D model in dialog
- Additional export settings (scale, layer height, etc.)
- STL format support
- OBJ format support
