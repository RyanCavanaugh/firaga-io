Implement a new output format, "3D"

This implements two new different output modes that the user can choose between

The first is a 3MF triangle mesh with separate material shapes for each color. Use standard industry 3mf file format.

The second is an "openscad masks" format, which is a zip file with:
 * one monochrome (black/white) image per color, indicate which pixels are filled in
 * an openscad file (`.scad`) that loads all images using the heightmap functionality and combines them into a 3d display of the image

Add a button to the web UI that brings up a dialog similar to the existing Print dialog