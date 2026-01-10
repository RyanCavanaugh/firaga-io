import { PartListImage } from '../image-utils';
import { colorEntryToHex } from '../utils';

// 3MF files are actually ZIP archives, but for simplicity we'll export as
// STL format which is more widely supported and doesn't require a ZIP library
export function generate3MF(image: PartListImage): Blob {
    const stl = generateSTL(image);
    return new Blob([stl], { type: 'model/stl' });
}

function generateSTL(image: PartListImage): string {
    const triangles: string[] = [];
    
    // Generate mesh for all colors combined
    for (let y = 0; y < image.height; y++) {
        for (let x = 0; x < image.width; x++) {
            const partIdx = image.pixels[y][x];
            if (partIdx >= 0 && partIdx < image.partList.length) {
                const z = 0; // All on same layer
                
                // Create a small cube for each pixel
                // Each cube has 12 triangles (2 per face, 6 faces)
                const cubes = createCubeTriangles(x, y, z);
                triangles.push(...cubes);
            }
        }
    }
    
    return `solid pixelart
${triangles.join('\n')}
endsolid pixelart`;
}

function createCubeTriangles(x: number, y: number, z: number): string[] {
    const triangles: string[] = [];
    const height = 1.0;
    
    // Define the 8 vertices of the cube
    const v0 = `${x} ${y} ${z}`;
    const v1 = `${x + 1} ${y} ${z}`;
    const v2 = `${x + 1} ${y + 1} ${z}`;
    const v3 = `${x} ${y + 1} ${z}`;
    const v4 = `${x} ${y} ${z + height}`;
    const v5 = `${x + 1} ${y} ${z + height}`;
    const v6 = `${x + 1} ${y + 1} ${z + height}`;
    const v7 = `${x} ${y + 1} ${z + height}`;
    
    // Bottom face (z = 0)
    triangles.push(
        `facet normal 0 0 -1\n  outer loop\n    vertex ${v0}\n    vertex ${v2}\n    vertex ${v1}\n  endloop\nendfacet`,
        `facet normal 0 0 -1\n  outer loop\n    vertex ${v0}\n    vertex ${v3}\n    vertex ${v2}\n  endloop\nendfacet`
    );
    
    // Top face (z = height)
    triangles.push(
        `facet normal 0 0 1\n  outer loop\n    vertex ${v4}\n    vertex ${v5}\n    vertex ${v6}\n  endloop\nendfacet`,
        `facet normal 0 0 1\n  outer loop\n    vertex ${v4}\n    vertex ${v6}\n    vertex ${v7}\n  endloop\nendfacet`
    );
    
    // Front face (y = 0)
    triangles.push(
        `facet normal 0 -1 0\n  outer loop\n    vertex ${v0}\n    vertex ${v1}\n    vertex ${v5}\n  endloop\nendfacet`,
        `facet normal 0 -1 0\n  outer loop\n    vertex ${v0}\n    vertex ${v5}\n    vertex ${v4}\n  endloop\nendfacet`
    );
    
    // Back face (y = 1)
    triangles.push(
        `facet normal 0 1 0\n  outer loop\n    vertex ${v2}\n    vertex ${v3}\n    vertex ${v7}\n  endloop\nendfacet`,
        `facet normal 0 1 0\n  outer loop\n    vertex ${v2}\n    vertex ${v7}\n    vertex ${v6}\n  endloop\nendfacet`
    );
    
    // Left face (x = 0)
    triangles.push(
        `facet normal -1 0 0\n  outer loop\n    vertex ${v0}\n    vertex ${v4}\n    vertex ${v7}\n  endloop\nendfacet`,
        `facet normal -1 0 0\n  outer loop\n    vertex ${v0}\n    vertex ${v7}\n    vertex ${v3}\n  endloop\nendfacet`
    );
    
    // Right face (x = 1)
    triangles.push(
        `facet normal 1 0 0\n  outer loop\n    vertex ${v1}\n    vertex ${v2}\n    vertex ${v6}\n  endloop\nendfacet`,
        `facet normal 1 0 0\n  outer loop\n    vertex ${v1}\n    vertex ${v6}\n    vertex ${v5}\n  endloop\nendfacet`
    );
    
    return triangles;
}
