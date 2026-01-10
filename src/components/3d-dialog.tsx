import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../3d-exporters';
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
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format: format,
            filename: props.filename.replace(".png", ""),
            pitch: getPitch(props.gridSize),
            height: height
        };

        window.clarity?.("event", "3d-export");
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
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🔲</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "Creates a standard 3MF file with separate material shapes for each color. Compatible with most 3D printing software."
                : "Creates a ZIP file with monochrome PNG masks and an OpenSCAD file that combines them into a 3D model."}
        </span>
    </div>;
}

function HeightGroup(props: { height: number, setHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Block Height (mm)</h1>
        <div class="print-setting-group-options">
            <input 
                type="number" 
                min="0.5" 
                max="20" 
                step="0.5" 
                value={props.height}
                onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                style={{ width: "100px", padding: "5px" }}
            />
        </div>
        <span class="description">
            Height of each pixel block in millimeters. Default is 2mm.
        </span>
    </div>;
}
