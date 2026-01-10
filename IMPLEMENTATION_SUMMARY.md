# 3D Export Feature Implementation Summary

## Overview
Implemented a new 3D export feature that allows users to export their images in two different 3D formats:
1. **3MF** - Industry-standard 3D Manufacturing Format with triangle meshes
2. **OpenSCAD Masks** - Black/white PNG masks per color with OpenSCAD file

## Files Created

### Components
- `src/components/export3d-dialog.tsx` - Dialog UI for 3D export options

### Exporters
- `src/exporters/3mf-generator.ts` - Generates 3MF triangle mesh files
- `src/exporters/openscad-masks-generator.ts` - Generates OpenSCAD masks and .scad file

## Files Modified

### Core Application
- `src/types.tsx` - Added Export3DProps type and is3DExportOpen UI state
- `src/app.tsx` - Added Export3DDialog import, toolbar button, keyboard shortcut (Ctrl+D)
- `src/firaga.tsx` - Added default export3d settings

## Features

### UI
- New toolbar button with 📐 icon labeled "3D"
- Dialog similar to Print dialog with:
  - Format selection (3MF vs OpenSCAD Masks)
  - Configurable parameters:
    - Pixel Width (mm)
    - Pixel Height (mm)
    - Layer Height (mm)

### 3MF Format
- Creates triangle mesh for each pixel as a box
- Separate material definition for each color
- Uses standard 3MF XML structure with:
  - Base materials with display colors
  - Mesh objects with vertices and triangles
  - Component assembly

### OpenSCAD Masks Format
- Generates one black/white PNG per color
- Creates .scad file that:
  - Loads all PNG masks using surface/heightmap
  - Assigns proper colors to each layer
  - Stacks layers with appropriate Z-offset
  - Includes comments with pixel counts

## Keyboard Shortcuts
- `Ctrl+D` - Toggle 3D export dialog
- `Escape` - Close 3D export dialog

## Default Settings
- Format: 3MF
- Layer Height: 2mm
- Pixel Width: 5mm
- Pixel Height: 5mm

## Dependencies
- Uses existing `file-saver` library for downloads
- No additional npm packages required

## Build Status
✅ TypeScript compilation passes
✅ Build succeeds (docs/firaga.js: 168.6kb)

## Future Enhancements
- Proper ZIP file creation for 3MF format (currently exports XML only)
- Proper ZIP file creation for OpenSCAD masks (currently exports files separately)
- Additional 3D format support (STL, OBJ, etc.)
- Preview of 3D model in dialog
- Advanced mesh optimization options
