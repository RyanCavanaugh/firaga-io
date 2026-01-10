import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3MF, Export3DSettings } from '../export-3mf';
import { exportOpenSCADMasks } from '../export-openscad';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(0);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup 
                pixelHeight={pixelHeight} 
                setPixelHeight={setPixelHeight}
                baseHeight={baseHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format,
            pixelHeight,
            baseHeight
        };

        window.clarity?.("event", "export-3d");
        
        if (format === "3mf") {
            export3MF(props.image, settings);
        } else {
            exportOpenSCADMasks(props.image, settings);
        }
    }
}

export type Export3DDialogProps = {
    image: PartListImage;
};

function FormatGroup(props: { format: "3mf" | "openscad-masks", setFormat: (f: "3mf" | "openscad-masks") => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} 
                />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} 
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🔲</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "Export as 3MF triangle mesh with separate materials for each color" 
                : "Export as ZIP with black/white masks and OpenSCAD file"}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelHeight: number,
    setPixelHeight: (h: number) => void,
    baseHeight: number,
    setBaseHeight: (h: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <div class="dimension-input">
                <label>
                    Pixel Height:
                    <input 
                        type="number" 
                        value={props.pixelHeight} 
                        onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value) || 2)}
                        min="0.1"
                        step="0.1"
                    />
                    mm
                </label>
            </div>
            <div class="dimension-input">
                <label>
                    Base Height:
                    <input 
                        type="number" 
                        value={props.baseHeight} 
                        onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value) || 0)}
                        min="0"
                        step="0.1"
                    />
                    mm
                </label>
            </div>
        </div>
        <span class="description">
            Pixel height is the Z-axis thickness of each colored layer. Base height is the offset from Z=0.
        </span>
    </div>;
}
