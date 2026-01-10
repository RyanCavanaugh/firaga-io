import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../exporters/3mf-generator';
import { generateOpenSCADMasks } from '../exporters/openscad-masks-generator';

export type ThreeDExportDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

type ExportFormat = "3mf" | "openscad";

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("3mf");

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup selectedFormat={selectedFormat} setSelectedFormat={setSelectedFormat} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportFile()}>Export 3D</button>
        </div>
    </div>;

    function exportFile() {
        window.clarity?.("event", "3d-export");
        
        if (selectedFormat === "3mf") {
            generate3MF(props.image, props.filename, props.gridSize);
        } else {
            generateOpenSCADMasks(props.image, props.filename, props.gridSize);
        }
        
        updateProp("ui", "is3DExportOpen", false);
    }
}

function FormatGroup(props: { selectedFormat: ExportFormat, setSelectedFormat: (format: ExportFormat) => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.selectedFormat === "3mf"}
                    onChange={() => props.setSelectedFormat("3mf")} />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">🧊</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.selectedFormat === "openscad"}
                    onChange={() => props.setSelectedFormat("openscad")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.selectedFormat === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D software."
                : "ZIP file containing black/white mask images for each color and an OpenSCAD file that combines them into a 3D display."
            }
        </span>
    </div>;
}
