import * as preact from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { export3MF } from '../exporters/export-3mf';
import { exportOpenSCADMasks } from '../exporters/export-openscad-masks';

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Export</h1>
            <div class="print-setting-group">
                <h2>Choose Format</h2>
                <div class="print-setting-group-options">
                    <button 
                        class="export-button"
                        onClick={() => handleExport3MF()}
                    >
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="description">
                                Export as industry-standard 3MF file with separate material shapes for each color
                            </span>
                        </div>
                    </button>
                    <button 
                        class="export-button"
                        onClick={() => handleExportOpenSCAD()}
                    >
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="description">
                                Export as ZIP with monochrome images per color and OpenSCAD file for 3D visualization
                            </span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Close</button>
        </div>
    </div>;

    function handleExport3MF() {
        export3MF(props.image, props.filename);
        window.clarity?.("event", "export-3mf");
    }

    function handleExportOpenSCAD() {
        exportOpenSCADMasks(props.image, props.filename);
        window.clarity?.("event", "export-openscad");
    }
}
