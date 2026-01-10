import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF } from '../threemf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

type ExportFormat = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ExportFormat>('3mf');
    const [pixelHeight, setPixelHeight] = useState(1.0);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <PixelHeightGroup pixelHeight={pixelHeight} setPixelHeight={setPixelHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings = {
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
            pixelHeight: pixelHeight
        };

        window.clarity?.("event", "3d-export");
        
        if (format === '3mf') {
            generate3MF(props.image, settings);
        } else {
            generateOpenSCADMasks(props.image, settings);
        }
    }
}

function FormatGroup(props: { format: ExportFormat; setFormat: (f: ExportFormat) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} 
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
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')} 
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Standard 3MF file format with separate material shapes for each color. Compatible with most 3D printing software.'
                : 'ZIP file containing black/white mask images and an OpenSCAD file that combines them into a 3D display.'}
        </span>
    </div>;
}

function PixelHeightGroup(props: { pixelHeight: number; setPixelHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Pixel Height</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="pixel-height"
                    checked={props.pixelHeight === 0.5}
                    onChange={() => props.setPixelHeight(0.5)} 
                />
                <div class="option">
                    <h3>Thin</h3>
                    <span>0.5mm</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="pixel-height"
                    checked={props.pixelHeight === 1.0}
                    onChange={() => props.setPixelHeight(1.0)} 
                />
                <div class="option">
                    <h3>Normal</h3>
                    <span>1.0mm</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="pixel-height"
                    checked={props.pixelHeight === 2.0}
                    onChange={() => props.setPixelHeight(2.0)} 
                />
                <div class="option">
                    <h3>Thick</h3>
                    <span>2.0mm</span>
                </div>
            </label>
        </div>
        <span class="description">Height (Z-axis) of each pixel in the 3D model</span>
    </div>;
}
