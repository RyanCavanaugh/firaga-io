import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3DFile, ThreeDExportSettings, ThreeDFormat } from '../3d-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2.5);
    const [baseThickness, setBaseThickness] = useState(1.0);

    return (
        <div class="print-dialog threed-dialog">
            <div class="print-options">
                <FormatGroup format={format} onChange={setFormat} />
                <DimensionsGroup 
                    pixelHeight={pixelHeight}
                    baseThickness={baseThickness}
                    onPixelHeightChange={setPixelHeight}
                    onBaseThicknessChange={setBaseThickness}
                />
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>
                    Cancel
                </button>
                <button class="print" onClick={handleExport}>
                    Export 3D
                </button>
            </div>
        </div>
    );

    async function handleExport(): Promise<void> {
        const settings: ThreeDExportSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            pixelHeight,
            baseThickness,
        };

        window.clarity?.("event", "export-3d", format);
        
        try {
            await make3DFile(props.image, settings);
            updateProp("ui", "is3DOpen", false);
        } catch (error) {
            console.error("Failed to generate 3D file:", error);
            alert("Failed to generate 3D file. Please try again.");
        }
    }
}

function FormatGroup(props: { format: ThreeDFormat; onChange: (format: ThreeDFormat) => void }): JSX.Element {
    return (
        <div class="print-setting-group">
            <h1>Format</h1>
            <div class="print-setting-group-options">
                <label>
                    <input
                        type="radio"
                        name="format"
                        checked={props.format === "3mf"}
                        onChange={() => props.onChange("3mf")}
                    />
                    <div class="option">
                        <h3>3MF</h3>
                        <span class="format-icon">📦</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="format"
                        checked={props.format === "openscad-masks"}
                        onChange={() => props.onChange("openscad-masks")}
                    />
                    <div class="option">
                        <h3>OpenSCAD Masks</h3>
                        <span class="format-icon">🎭</span>
                    </div>
                </label>
            </div>
            <span class="description">
                {props.format === "3mf"
                    ? "3MF triangle mesh with separate material shapes for each color. Compatible with most 3D printing software."
                    : "ZIP file with monochrome images per color and an OpenSCAD file for 3D rendering."}
            </span>
        </div>
    );
}

function DimensionsGroup(props: {
    pixelHeight: number;
    baseThickness: number;
    onPixelHeightChange: (value: number) => void;
    onBaseThicknessChange: (value: number) => void;
}): JSX.Element {
    return (
        <div class="print-setting-group">
            <h1>Dimensions (mm)</h1>
            <div class="dimension-inputs">
                <label>
                    <span>Pixel Height:</span>
                    <input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={props.pixelHeight}
                        onChange={(e) => props.onPixelHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Base Thickness:</span>
                    <input
                        type="number"
                        min="0.5"
                        max="10"
                        step="0.5"
                        value={props.baseThickness}
                        onChange={(e) => props.onBaseThicknessChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
            <span class="description">
                Pixel height controls the size of each colored pixel in the 3D model. 
                Base thickness is the thickness of the foundation layer.
            </span>
        </div>
    );
}
