import { PartListImage } from "./image-utils";
import { colorEntryToHex } from "./utils";

export interface OpenSCADSettings {
    filename: string;
    pitch: number;
}

export async function makeOpenSCAD(image: PartListImage, settings: OpenSCADSettings) {
    // Create the OpenSCAD script
    const scadScript = generateOpenSCADScript(image, settings.pitch);

    // Download just the SCAD file
    const blob = new Blob([scadScript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = settings.filename + ".scad";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    window.clarity?.("event", "export-3d-openscad");
}

function generateOpenSCADScript(image: PartListImage, pitch: number): string {
    const script = `// Generated OpenSCAD model
// This script creates a 3D representation of the image using heightmap()
// Each PNG file represents one color layer

$fn = 16;  // Facets for smooth curves

// Scale factors
image_pitch = ${pitch};
height_per_color = 2;  // Height per color layer in mm

// Image dimensions
image_width = ${image.width};
image_height = ${image.height};

// Combine all color layers
union() {
${generateColorLayers(image)}
}

// Helper function to create a layer from a heightmap image
module color_layer(color_file, color_index, color_value) {
    // Scale the heightmap to actual dimensions
    linear_extrude(height = height_per_color) {
        scale([image_pitch, image_pitch])
            surface(file = color_file, center = true, invert = true);
    }
    translate([0, 0, color_index * height_per_color]) {
        children();
    }
}
`;

    return script;
}

function generateColorLayers(image: PartListImage): string {
    let layers = "";
    for (let colorIndex = 0; colorIndex < image.partList.length; colorIndex++) {
        const color = image.partList[colorIndex].target;
        const hex = colorEntryToHex(color);
        layers += `    // Color ${colorIndex}: ${hex}\n`;
        layers += `    translate([0, 0, ${colorIndex * 2}])\n`;
        layers += `        linear_extrude(height = 2)\n`;
        layers += `            scale([${image.width * 5}, ${image.height * 5}] / max(${image.width}, ${image.height}))\n`;
        layers += `                surface(file = "color_${colorIndex}.png", center = true, invert = true);\n`;
        layers += `\n`;
    }
    return layers;
}
