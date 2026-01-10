import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../3d-export';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [height, setHeight] = useState<number>(2);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export 3D</button>
        </div>
    </div>;

    function exportFile() {
        const settings: Export3DSettings = {
            format,
            pitch: getPitch(props.gridSize),
            height,
            filename: props.filename.replace(".png", ""),
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

export type Export3DDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

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
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "Standard 3D Manufacturing Format with separate colored meshes for each color"
                : "ZIP file with black/white masks and OpenSCAD file for heightmap display"}
        </span>
    </div>;
}

function HeightGroup(props: { height: number, setHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Height (mm)</h1>
        <div class="print-setting-group-options">
            <input 
                type="number" 
                min="0.1" 
                max="100" 
                step="0.1"
                value={props.height}
                onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                style="width: 100px; padding: 5px; font-size: 14px;" />
        </div>
        <span class="description">Height of the 3D model in millimeters</span>
    </div>;
}
