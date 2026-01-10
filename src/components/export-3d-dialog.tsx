import * as preact from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF } from '../threemf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
    gridSize: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>Export 3D Format</h1>
            <div class="print-setting-group">
                <h2>Choose Format</h2>
                <div class="print-setting-group-options">
                    <label>
                        <button class="export-button" onClick={() => export3MF()}>
                            <div class="option">
                                <h3>3MF Triangle Mesh</h3>
                                <span class="format-icon">🔺</span>
                            </div>
                        </button>
                    </label>
                    <label>
                        <button class="export-button" onClick={() => exportOpenSCAD()}>
                            <div class="option">
                                <h3>OpenSCAD Masks</h3>
                                <span class="format-icon">🎭</span>
                            </div>
                        </button>
                    </label>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
        </div>
    </div>;

    function export3MF() {
        window.clarity?.("event", "export-3mf");
        generate3MF(props.image, props.filename);
        updateProp("ui", "is3DExportOpen", false);
    }

    function exportOpenSCAD() {
        window.clarity?.("event", "export-openscad");
        generateOpenSCADMasks(props.image, props.filename);
        updateProp("ui", "is3DExportOpen", false);
    }
}
