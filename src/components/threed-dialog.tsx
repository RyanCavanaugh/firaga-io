import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, generateOpenSCADMasks, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [height, setHeight] = useState<number>(5);

    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Export</h1>
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export</button>
        </div>
    </div>;

    async function exportModel() {
        const settings: ThreeDSettings = {
            format,
            height
        };

        window.clarity?.("event", "3d-export", { format });

        try {
            let blob: Blob;
            let filename: string;

            if (format === "3mf") {
                blob = generate3MF(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '.3mf';
            } else {
                blob = await generateOpenSCADMasks(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '_openscad.zip';
            }

            // Trigger download
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            // Close dialog
            updateProp("ui", "is3DExportOpen", false);
        } catch (error) {
            console.error("Error generating 3D model:", error);
            alert("Error generating 3D model. Please try again.");
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: "3mf" | "openscad", setFormat: (f: "3mf" | "openscad") => void }) {
    return <div class="print-setting-group">
        <h2>Format</h2>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🖼️</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Compatible with most 3D printing software."
                : "Zip file with monochrome mask images and OpenSCAD file that combines them into a 3D display."}
        </span>
    </div>;
}

function HeightGroup(props: { height: number, setHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h2>Height (mm)</h2>
        <div style={{ padding: "10px" }}>
            <input 
                type="number" 
                min="1" 
                max="50" 
                step="0.5"
                value={props.height}
                onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                style={{ width: "100px", padding: "5px", fontSize: "16px" }}
            />
        </div>
        <span class="description">
            Height of the 3D model in millimeters (depth/thickness).
        </span>
    </div>;
}
