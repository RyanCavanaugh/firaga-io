import { PartListImage } from "./image-utils";

export type Export3DFormat = "3mf" | "openscad-masks";

export type Export3DSettings = {
    format: Export3DFormat;
    pixelHeight: number;
    baseHeight: number;
    filename: string;
};

export type Export3DDialogProps = {
    image: PartListImage;
    settings: {
        format: Export3DFormat;
        pixelHeight: number;
        baseHeight: number;
    };
    filename: string;
};
