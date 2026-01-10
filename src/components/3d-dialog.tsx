import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [height, setHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(0);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup height={height} setHeight={setHeight} baseHeight={baseHeight} setBaseHeight={setBaseHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export 3D</button>
        </div>
    </div>;

    function exportFile() {
        const settings: ThreeDSettings = {
            format,
            height,
            baseHeight,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, "")
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

function FormatGroup(props: { format: "3mf" | "openscad-masks", setFormat: (f: "3mf" | "openscad-masks") => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
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
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF file with triangle mesh - separate material shapes for each color. Compatible with most 3D printers and slicers."
                : "ZIP file containing black/white mask images and OpenSCAD file that combines them into a 3D heightmap display."}
        </span>
    </div>;
}

function HeightGroup(props: { 
    height: number, 
    setHeight: (h: number) => void,
    baseHeight: number,
    setBaseHeight: (h: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="print-setting-group-options">
            <div class="dimension-controls">
                <label class="dimension-label">
                    Pixel Height (mm):
                    <input 
                        type="number" 
                        min="0.1" 
                        max="50" 
                        step="0.1" 
                        value={props.height}
                        onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value) || 2)}
                        class="dimension-input" />
                </label>
                <label class="dimension-label">
                    Base Height (mm):
                    <input 
                        type="number" 
                        min="0" 
                        max="50" 
                        step="0.1" 
                        value={props.baseHeight}
                        onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value) || 0)}
                        class="dimension-input" />
                </label>
            </div>
        </div>
        <span class="description">
            Pixel height controls the Z-axis height of each colored voxel. Base height adds an offset from Z=0.
        </span>
    </div>;
}
