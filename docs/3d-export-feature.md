# 3D Export Feature

## Overview

The 3D Export feature allows users to export their bead art designs as 3D models in two different formats:

1. **3MF Format**: A modern 3D manufacturing format with full color support
2. **OpenSCAD Masks Format**: A set of heightmap images with an OpenSCAD script

## Usage

1. Click the **3D** button (📦) in the toolbar or press **Ctrl+D**
2. Choose your desired format:
   - **3MF**: Creates a triangle mesh with separate colored shapes for each bead color
   - **OpenSCAD Masks**: Creates a zip file with one black/white image per color and a `.scad` script
3. Select the extrusion height (2mm, 3mm, 5mm, or 10mm)
4. Click **Export 3D** to download the file

## Implementation Details

### 3MF Format

- Each color becomes a separate mesh object
- Each pixel is extruded as a 1mm×1mm cube to the specified height
- Colors are assigned using the 3MF basematerials extension
- Output is a valid .3mf file (ZIP archive with XML model definition)

### OpenSCAD Masks Format

- Creates one PNG heightmap per color (black = present pixel, white = absent)
- Includes a `model.scad` file that uses OpenSCAD's `surface()` function to load each heightmap
- Each layer is colored and combined with `union()`
- Output is a .zip file containing all images and the script

## Technical Architecture

### Files Added

1. **src/three-d-exporter.ts**: Core 3D export logic
   - `export3D()`: Main entry point
   - `export3MF()`: Generates 3MF triangle mesh format
   - `exportOpenSCADMasks()`: Generates OpenSCAD heightmap format
   - Mesh generation with vertex deduplication for efficiency

2. **src/components/three-d-dialog.tsx**: UI dialog component
   - Format selection (3MF vs OpenSCAD)
   - Height selection (2mm - 10mm)
   - Export button with loading state

3. **Updated files**:
   - src/types.tsx: Added `is3DOpen` to UI state
   - src/app.tsx: Added 3D button, dialog rendering, keyboard shortcut
   - src/firaga.tsx: Added default `is3DOpen: false` state
   - package.json: Added `jszip` and `@types/jszip` dependencies

### Keyboard Shortcuts

- **Ctrl+D**: Toggle 3D export dialog
- **Escape**: Close 3D export dialog

### Dependencies

- **jszip**: For creating ZIP archives (3MF and OpenSCAD formats)
- **file-saver**: For downloading generated files

## 3D Model Characteristics

- **Scale**: 1 pixel = 1mm in X/Y dimensions
- **Height**: User-selectable (2mm, 3mm, 5mm, or 10mm)
- **Mesh quality**: Each pixel becomes a cube with 12 triangles (2 per face)
- **Vertex sharing**: Vertices are deduplicated within each color mesh
- **Color accuracy**: RGB colors preserved in both formats

## Example Use Cases

1. **3D Printing**: Export as 3MF and import into slicing software (PrusaSlicer, Cura, etc.)
2. **CAD Integration**: Use OpenSCAD format for further modeling or customization
3. **Visualization**: View the 3D representation of bead art designs
4. **Multi-material Printing**: Each color is a separate object for multi-material printers
