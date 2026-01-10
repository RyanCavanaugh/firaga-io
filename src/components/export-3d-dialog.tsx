import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../export-3d';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Export Format</h1>
            <div class="print-setting-group">
                <div class="print-setting-group-options">
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={props.format === "3mf"}
                            onChange={() => updateProp("export3d", "format", "3mf")} />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">🔺</span>
                        </div>
                    </label>
                    <label>
                        <input type="radio"
                            name="3d-format"
                            checked={props.format === "openscad"}
                            onChange={() => updateProp("export3d", "format", "openscad")} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">📦</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {props.format === "3mf" 
                        ? "Exports a 3MF file with separate material shapes for each color. Compatible with most 3D printing software."
                        : "Exports a ZIP file containing monochrome masks (one per color) and an OpenSCAD file that combines them into a 3D display."}
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format: props.format,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, "")
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
        updateProp("ui", "is3DExportOpen", false);
    }
}

export type Export3DDialogProps = {
    image: PartListImage;
    format: "3mf" | "openscad";
    filename: string;
};
