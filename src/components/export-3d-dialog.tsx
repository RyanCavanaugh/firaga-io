import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { export3MF, exportOpenSCADMasks } from '../export-3d';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Export</h1>
            <p>Choose a 3D output format to export your design:</p>
            <div class="export-3d-buttons">
                <button class="export-button" onClick={() => handle3MFExport()}>
                    <div class="export-option">
                        <h3>3MF Triangle Mesh</h3>
                        <p>Standard 3D Manufacturing Format with separate materials per color</p>
                    </div>
                </button>
                <button class="export-button" onClick={() => handleOpenSCADExport()}>
                    <div class="export-option">
                        <h3>OpenSCAD Masks</h3>
                        <p>ZIP file with heightmap images and OpenSCAD file</p>
                    </div>
                </button>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
        </div>
    </div>;

    function handle3MFExport() {
        window.clarity?.("event", "export-3mf");
        export3MF(props.image, props.filename.replace(".png", ""));
        updateProp("ui", "is3DExportOpen", false);
    }

    function handleOpenSCADExport() {
        window.clarity?.("event", "export-openscad");
        exportOpenSCADMasks(props.image, props.filename.replace(".png", ""));
        updateProp("ui", "is3DExportOpen", false);
    }
}
