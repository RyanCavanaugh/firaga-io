export type ThreeDFormat = "3mf" | "openscad-masks";

export interface ThreeDSettings {
    format: ThreeDFormat;
    height: number; // Height of the 3D extrusion in mm
    pixelSize: number; // Size of each pixel in mm
}
