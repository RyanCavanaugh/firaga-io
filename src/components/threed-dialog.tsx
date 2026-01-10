import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3DExport, Export3DSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [pixelWidth, setPixelWidth] = useState(5);
    const [pixelHeight, setPixelHeight] = useState(5);
    const [pixelDepth, setPixelDepth] = useState(2);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup 
                pixelWidth={pixelWidth}
                pixelHeight={pixelHeight}
                pixelDepth={pixelDepth}
                setPixelWidth={setPixelWidth}
                setPixelHeight={setPixelHeight}
                setPixelDepth={setPixelDepth}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D&nbsp;📦</button>
        </div>
    </div>;

    function export3D() {
        const settings: Export3DSettings = {
            format: format,
            filename: props.filename.replace(".png", ""),
            pixelWidth: pixelWidth,
            pixelHeight: pixelHeight,
            pixelDepth: pixelDepth,
        };

        window.clarity?.("event", "export-3d");
        make3DExport(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: "3mf" | "openscad-masks", setFormat: (f: "3mf" | "openscad-masks") => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">🔺</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔲</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3D Manufacturing Format - triangle mesh with colors. Can be opened in 3D printing software."
                : "ZIP file with mask images and OpenSCAD script. Use with OpenSCAD to generate 3D models."}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelWidth: number,
    pixelHeight: number,
    pixelDepth: number,
    setPixelWidth: (n: number) => void,
    setPixelHeight: (n: number) => void,
    setPixelDepth: (n: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Pixel Dimensions (mm)</h1>
        <div class="dimension-inputs">
            <label>
                Width: 
                <input type="number" min="0.1" step="0.5" value={props.pixelWidth} 
                    onChange={(e) => props.setPixelWidth(parseFloat((e.target as HTMLInputElement).value))} />
            </label>
            <label>
                Height: 
                <input type="number" min="0.1" step="0.5" value={props.pixelHeight} 
                    onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))} />
            </label>
            <label>
                Depth: 
                <input type="number" min="0.1" step="0.5" value={props.pixelDepth} 
                    onChange={(e) => props.setPixelDepth(parseFloat((e.target as HTMLInputElement).value))} />
            </label>
        </div>
        <span class="description">
            Each pixel will be {props.pixelWidth}mm × {props.pixelHeight}mm × {props.pixelDepth}mm
        </span>
    </div>;
}
