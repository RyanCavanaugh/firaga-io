import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { Export3DSettings, make3DExport } from '../3d-generator';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [height, setHeight] = useState(5);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;
    
    function export3D() {
        const settings: Export3DSettings = {
            format: format,
            height: height,
            filename: props.filename.replace(".png", "")
        };
        
        window.clarity?.("event", "export-3d");
        make3DExport(props.image, settings);
    }
}

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
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">🔺</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Standard industry format."
                : "Zip file with monochrome images per color and an OpenSCAD file to combine them into a 3D display."}
        </span>
    </div>;
}

function HeightGroup(props: { height: number, setHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Height (mm)</h1>
        <div class="print-setting-group-options">
            <input 
                type="number" 
                value={props.height} 
                min="1" 
                max="100" 
                step="1"
                onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                style="width: 100px; font-size: 16px; padding: 5px;"
            />
        </div>
        <span class="description">Height of the 3D object in millimeters</span>
    </div>;
}
