import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../3mf-generator';
import { generateOpenSCADZip } from '../openscad-generator';

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

type ThreeDFormat = "3mf" | "openscad";

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [isGenerating, setIsGenerating] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} onChange={setFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport} disabled={isGenerating}>
                {isGenerating ? "Generating..." : "Export 3D"}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsGenerating(true);
        try {
            window.clarity?.("event", "export-3d");
            
            if (format === "3mf") {
                await generate3MF(props.image, props.gridSize, props.filename);
            } else {
                await generateOpenSCADZip(props.image, props.gridSize, props.filename);
            }
        } catch (error) {
            console.error("3D export failed:", error);
            alert("Export failed. Please check console for details.");
        } finally {
            setIsGenerating(false);
        }
    }
}

function FormatGroup(props: { format: ThreeDFormat, onChange: (format: ThreeDFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.onChange("3mf")} />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">🔷</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "openscad"}
                    onChange={() => props.onChange("openscad")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Standard industry format."
                : "ZIP file with monochrome masks and OpenSCAD file using heightmap functionality."}
        </span>
    </div>;
}
