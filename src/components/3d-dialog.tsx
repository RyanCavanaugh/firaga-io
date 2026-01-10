import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type ThreeDFormat = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>('3mf');
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup 
                pixelHeight={pixelHeight} 
                baseHeight={baseHeight}
                setPixelHeight={setPixelHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;
    
    function export3D() {
        const settings: ThreeDSettings = {
            format,
            pixelHeight,
            baseHeight,
            filename: props.filename.replace(".png", "")
        };
        
        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
        updateProp("ui", "is3DOpen", false);
    }
}

function FormatGroup(props: { format: ThreeDFormat, setFormat: (f: ThreeDFormat) => void }) {
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
                    <h3>3MF</h3>
                    <span class="format-icon">📦</span>
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
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔲</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? "3MF triangle mesh with separate material shapes for each color. Compatible with most 3D printing software."
                : "Zip file with monochrome mask images and an OpenSCAD file that combines them into a 3D model."
            }
        </span>
    </div>;
}

function HeightGroup(props: {
    pixelHeight: number,
    baseHeight: number,
    setPixelHeight: (h: number) => void,
    setBaseHeight: (h: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <div class="dimension-input">
                <label>
                    Pixel Height:
                    <input 
                        type="number" 
                        min="0.1" 
                        max="20" 
                        step="0.1"
                        value={props.pixelHeight}
                        onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    mm
                </label>
            </div>
            <div class="dimension-input">
                <label>
                    Base Height:
                    <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.1"
                        value={props.baseHeight}
                        onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    mm
                </label>
            </div>
        </div>
        <span class="description">
            Pixel Height is the height of each colored pixel. Base Height is the optional base layer height.
        </span>
    </div>;
}
