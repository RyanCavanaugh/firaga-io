import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../threed-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [pixelSize, setPixelSize] = useState(2.5);
    const [baseHeight, setBaseHeight] = useState(1);

    return <div class="print-dialog threed-dialog">
        <div class="print-options">
            <h1>3D Output Format</h1>
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup 
                pixelHeight={pixelHeight} 
                setPixelHeight={setPixelHeight}
                pixelSize={pixelSize}
                setPixelSize={setPixelSize}
                baseHeight={baseHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format,
            pixelHeight,
            pixelSize,
            baseHeight
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
};

function FormatGroup(props: { format: "3mf" | "openscad-masks", setFormat: (f: "3mf" | "openscad-masks") => void }) {
    return <div class="print-setting-group">
        <h2>Format</h2>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio" 
                    name="format" 
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} 
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
                    onChange={() => props.setFormat("openscad-masks")} 
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3D Manufacturing Format - triangle mesh with separate material shapes for each color. Compatible with most 3D slicing software."
                : "ZIP file containing black/white mask images and OpenSCAD file that combines them into a 3D model using heightmap functionality."}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelHeight: number,
    setPixelHeight: (n: number) => void,
    pixelSize: number,
    setPixelSize: (n: number) => void,
    baseHeight: number,
    setBaseHeight: (n: number) => void
}) {
    return <div class="print-setting-group">
        <h2>Dimensions (mm)</h2>
        <div class="dimensions-inputs">
            <label>
                <span>Pixel Size:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.pixelSize}
                    onChange={(e) => props.setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span class="unit">mm</span>
            </label>
            <label>
                <span>Pixel Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1" 
                    value={props.pixelHeight}
                    onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span class="unit">mm</span>
            </label>
            <label>
                <span>Base Height:</span>
                <input 
                    type="number" 
                    min="0" 
                    step="0.1" 
                    value={props.baseHeight}
                    onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span class="unit">mm</span>
            </label>
        </div>
        <span class="description">
            Pixel size: width and depth of each pixel. Pixel height: vertical extrusion. Base height: optional base layer thickness.
        </span>
    </div>;
}
