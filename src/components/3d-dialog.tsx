import * as preact from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../3d-export/3mf-generator';
import { generateOpenSCADZip } from '../3d-export/openscad-generator';

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export type ThreeDFormat = "3mf" | "openscad";

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        window.clarity?.("event", "export-3d");
        
        if (format === "3mf") {
            const blob = generate3MF(props.image);
            downloadBlob(blob, props.filename.replace(".png", "") + ".stl");
        } else {
            const blob = generateOpenSCADZip(props.image);
            downloadBlob(blob, props.filename.replace(".png", "") + ".html");
        }
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function FormatGroup(props: { format: ThreeDFormat; setFormat: (f: ThreeDFormat) => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>STL Mesh</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "STL triangle mesh suitable for 3D printing"
                : "HTML package with monochrome images and OpenSCAD file for 3D display"}
        </span>
    </div>;
}
