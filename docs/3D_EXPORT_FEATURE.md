# 3D Export Feature

This feature implements two new 3D output formats for the pixel art application.

## Overview

Users can now export their pixel art designs as 3D models using the new "3D Export" button in the toolbar (📐 icon).

## Formats

### 1. 3MF Triangle Mesh

**Format**: `.3mf` file  
**Description**: 3D Manufacturing Format with separate material shapes for each color.

**Features**:
- Each color in the design is represented as a separate mesh object
- Proper color materials assigned to each mesh
- Standard industry format compatible with most 3D slicers and CAD software
- Ready for 3D printing

**Use Cases**:
- Direct 3D printing with multi-material printers
- Import into CAD software for further editing
- Visualization in 3D viewers

### 2. OpenSCAD Masks

**Format**: `.zip` archive containing:
- One monochrome PNG image per color (black = filled, white = empty)
- An OpenSCAD `.scad` file that loads and combines all images

**Features**:
- Parametric design that can be customized
- Each color layer is a separate heightmap
- Full control over extrusion height and pixel pitch in OpenSCAD
- Can be modified and re-rendered with different parameters

**Use Cases**:
- Customizable 3D models
- Advanced users who want to modify the design
- Creating variations with different heights or effects

## Settings

### Block Height
- **2mm**: Thin profile, suitable for wall art or flat displays
- **5mm**: Standard height, good balance (default)
- **10mm**: Deep blocks, creates strong 3D effect

## Usage

1. Click the "3D Export" button (📐) in the toolbar or press `Ctrl+D`
2. Select the desired format (3MF or OpenSCAD Masks)
3. Choose the block height
4. Click "Export 3D"
5. The file will be downloaded to your default downloads folder

## Technical Details

### 3MF Format
- Each pixel becomes a rectangular prism (box) in 3D space
- Vertices are shared between adjacent pixels for efficiency
- Colors are defined in a color group and referenced by material ID
- The pitch (spacing) is automatically calculated from the material size settings

### OpenSCAD Format
- Uses the `surface()` function to create heightmaps from PNG images
- Each color is rendered in a separate `color()` block
- All layers are combined using `union()`
- The `.scad` file can be opened in OpenSCAD and customized

## File Structure

### New Files
- `src/threed-generator.ts` - Core 3D generation logic
- `src/components/threed-dialog.tsx` - UI dialog component

### Modified Files
- `src/types.tsx` - Added ThreeDProps type and is3DOpen UI flag
- `src/app.tsx` - Added toolbar button and dialog integration
- `src/firaga.tsx` - Added default 3D settings

## Implementation Notes

- The 3MF generator creates proper ZIP-formatted files with the required structure
- A custom ZIP implementation is included to avoid external dependencies
- Canvas API is used to generate monochrome PNG masks for OpenSCAD
- All geometry is generated client-side in the browser
