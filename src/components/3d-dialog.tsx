import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>('3mf');
    const [height, setHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightSettings 
                height={height} 
                setHeight={setHeight}
                baseHeight={baseHeight}
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
            height,
            baseHeight
        };
        
        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings, props.filename.replace(".png", ""));
    }
}

function FormatGroup(props: { format: ThreeDFormat, setFormat: (f: ThreeDFormat) => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
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
                    name="format"
                    checked={props.format === 'openscad-masks'}
                    onChange={() => props.setFormat('openscad-masks')} 
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? "3MF triangle mesh with separate material shapes for each color. Standard industry format compatible with most 3D modeling software."
                : "Zip file containing monochrome mask images and an OpenSCAD file that combines them into a 3D model using heightmap functionality."}
        </span>
    </div>;
}

function HeightSettings(props: {
    height: number,
    setHeight: (h: number) => void,
    baseHeight: number,
    setBaseHeight: (h: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="height-settings">
            <div class="height-control">
                <label>
                    Pixel Height:
                    <input 
                        type="number" 
                        min="0.1" 
                        max="10" 
                        step="0.1" 
                        value={props.height}
                        onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
            <div class="height-control">
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
                </label>
            </div>
        </div>
        <span class="description">
            Pixel height: height of each colored pixel in the 3D model. Base height: height of the base layer.
        </span>
    </div>;
}
