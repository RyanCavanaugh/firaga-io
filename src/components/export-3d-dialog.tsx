import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../3d-export';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [heightMm, setHeightMm] = useState(2);
    const [baseHeightMm, setBaseHeightMm] = useState(3);
    const [pixelSizeMm, setPixelSizeMm] = useState(2.5);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup
                heightMm={heightMm}
                setHeightMm={setHeightMm}
                baseHeightMm={baseHeightMm}
                setBaseHeightMm={setBaseHeightMm}
                pixelSizeMm={pixelSizeMm}
                setPixelSizeMm={setPixelSizeMm}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport}>Export 3D</button>
        </div>
    </div>;

    function handleExport(): void {
        const settings: Export3DSettings = {
            format,
            heightMm,
            baseHeightMm,
            pixelSizeMm,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, "")
        };

        window.clarity?.("event", "export-3d", format);
        export3D(props.image, settings);
    }
}

function FormatGroup(props: { format: "3mf" | "openscad", setFormat: (f: "3mf" | "openscad") => void }): JSX.Element {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input
                    type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")}
                />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">🧊</span>
                </div>
            </label>
            <label>
                <input
                    type="radio"
                    name="3d-format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")}
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf"
                ? "Standard 3D manufacturing format with separate colored meshes for each color"
                : "ZIP file containing heightmap masks and OpenSCAD file for customization"}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    heightMm: number;
    setHeightMm: (h: number) => void;
    baseHeightMm: number;
    setBaseHeightMm: (h: number) => void;
    pixelSizeMm: number;
    setPixelSizeMm: (s: number) => void;
}): JSX.Element {
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="dimensions-inputs">
            <label>
                <span>Pixel Size (mm):</span>
                <input
                    type="number"
                    min="0.5"
                    max="50"
                    step="0.5"
                    value={props.pixelSizeMm}
                    onChange={(e) => props.setPixelSizeMm(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Pixel Height (mm):</span>
                <input
                    type="number"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={props.heightMm}
                    onChange={(e) => props.setHeightMm(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Height (mm):</span>
                <input
                    type="number"
                    min="0"
                    max="50"
                    step="0.5"
                    value={props.baseHeightMm}
                    onChange={(e) => props.setBaseHeightMm(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Pixel size and height determine the scale of your 3D model. Base height adds a foundation layer.
        </span>
    </div>;
}
