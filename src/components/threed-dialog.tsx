import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF } from '../threed-3mf-generator';
import { generateOpenSCADMasks } from '../threed-openscad-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type FormatType = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<FormatType>('3mf');
    const [isGenerating, setIsGenerating] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <div class="print-setting-group">
                <h1>3D Format</h1>
                <div class="print-setting-group-options">
                    <label>
                        <input 
                            type="radio"
                            name="format"
                            checked={format === '3mf'}
                            onChange={() => setFormat('3mf')} />
                        <div class="option">
                            <h3>3MF Triangle Mesh</h3>
                            <span class="format-icon">🔺</span>
                        </div>
                    </label>
                    <label>
                        <input 
                            type="radio"
                            name="format"
                            checked={format === 'openscad'}
                            onChange={() => setFormat('openscad')} />
                        <div class="option">
                            <h3>OpenSCAD Masks</h3>
                            <span class="format-icon">🎭</span>
                        </div>
                    </label>
                </div>
                <span class="description">
                    {format === '3mf' 
                        ? 'Standard 3D Manufacturing Format with separate material shapes for each color'
                        : 'Zip file with monochrome images and OpenSCAD file using heightmap functionality'}
                </span>
            </div>
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>
                Cancel
            </button>
            <button 
                class="print" 
                onClick={handleExport}
                disabled={isGenerating}>
                {isGenerating ? 'Generating...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsGenerating(true);
        try {
            window.clarity?.("event", "export-3d", format);
            
            const baseFilename = props.filename.replace(/\.(png|jpg|jpeg)$/i, "");
            
            if (format === '3mf') {
                await generate3MF(props.image, baseFilename);
            } else {
                await generateOpenSCADMasks(props.image, baseFilename);
            }
        } catch (error) {
            console.error('Error generating 3D export:', error);
            alert('Error generating 3D file. See console for details.');
        } finally {
            setIsGenerating(false);
        }
    }
}
