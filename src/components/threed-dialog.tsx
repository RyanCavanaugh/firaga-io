import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { download3MF, ThreeMFSettings } from '../threemf-generator';
import { downloadOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { AppProps } from '../types';
import { getGridSize, getPitch } from '../utils';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [height, setHeight] = useState(2);
    
    const pitch = getPitch(props.gridSize);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;
    
    async function exportModel() {
        const filename = props.filename.replace(".png", "");
        
        if (format === "3mf") {
            const settings: ThreeMFSettings = {
                pitch,
                height,
                filename
            };
            window.clarity?.("event", "export-3mf");
            await download3MF(props.image, settings);
        } else {
            const settings: OpenSCADSettings = {
                pitch,
                height,
                filename
            };
            window.clarity?.("event", "export-openscad");
            await downloadOpenSCADMasks(props.image, settings);
        }
        
        updateProp("ui", "is3DExportOpen", false);
    }
}

function FormatGroup(props: { format: "3mf" | "openscad", setFormat: (f: "3mf" | "openscad") => void }) {
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
                    <span class="format-icon">📦</span>
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
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "Standard 3D printing format with colored meshes, compatible with most slicers"
                : "ZIP file containing image masks and OpenSCAD script for customizable 3D rendering"}
        </span>
    </div>;
}

function HeightGroup(props: { height: number, setHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Layer Height</h1>
        <div class="options-row">
            <input 
                type="range" 
                min="0.5" 
                max="10" 
                step="0.5" 
                value={props.height}
                onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                class="slider"
            />
            <span class="height-value">{props.height.toFixed(1)} mm</span>
        </div>
        <span class="description">
            Height of each colored layer in the 3D model
        </span>
    </div>;
}
