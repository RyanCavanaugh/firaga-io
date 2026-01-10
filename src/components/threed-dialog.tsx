import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../threed-3mf-generator';
import { generateOpenSCADMasks } from '../threed-openscad-generator';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type ThreeDFormat = '3mf' | 'openscad-masks';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Output Format</h1>
            <div class="print-setting-group">
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio" 
                            name="format" 
                            value="3mf"
                            checked={true}
                        />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <p>Standard industry format with separate materials per color</p>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            name="format" 
                            value="openscad-masks"
                        />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <p>ZIP file with heightmap images and .scad file</p>
                        </div>
                    </label>
                </div>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const formatRadio = document.querySelector('input[name="format"]:checked') as HTMLInputElement;
        const format = (formatRadio?.value ?? '3mf') as ThreeDFormat;
        
        window.clarity?.("event", "export-3d", format);
        
        if (format === '3mf') {
            generate3MF(props.image, props.filename);
        } else {
            generateOpenSCADMasks(props.image, props.filename);
        }
        
        updateProp("ui", "is3DOpen", false);
    }
}
