import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF } from '../threed-3mf';
import { generateOpenScadMasks } from '../threed-openscad';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

export type Export3DFormat = '3mf' | 'openscad-masks';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [selectedFormat, setSelectedFormat] = useState<Export3DFormat>('3mf');
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>3D Export Format</h1>
            <div class="print-setting-group">
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio" 
                            name="3d-format" 
                            value="3mf" 
                            checked={selectedFormat === '3mf'}
                            onChange={() => setSelectedFormat('3mf')}
                        />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">📐</span>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio" 
                            name="3d-format" 
                            value="openscad-masks"
                            checked={selectedFormat === 'openscad-masks'}
                            onChange={() => setSelectedFormat('openscad-masks')}
                        />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎭</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {selectedFormat === '3mf' ? (
                        <span><strong>3MF:</strong> Standard 3D manufacturing format with separate material shapes per color</span>
                    ) : (
                        <span><strong>OpenSCAD Masks:</strong> ZIP file with monochrome images and .scad heightmap file</span>
                    )}
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport}>Export</button>
        </div>
    </div>;

    function handleExport() {
        const filename = props.filename.replace(".png", "");
        if (selectedFormat === '3mf') {
            window.clarity?.("event", "export-3mf");
            generate3MF(props.image, filename);
        } else {
            window.clarity?.("event", "export-openscad");
            generateOpenScadMasks(props.image, filename);
        }
    }
}
