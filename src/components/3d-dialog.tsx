import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [height, setHeight] = useState(5);
    const [baseHeight, setBaseHeight] = useState(2);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightSettings height={height} setHeight={setHeight} baseHeight={baseHeight} setBaseHeight={setBaseHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3D()}>Generate 3D</button>
        </div>
    </div>;
    
    function generate3D() {
        const settings: ThreeDSettings = {
            format,
            height,
            baseHeight
        };
        
        window.clarity?.("event", "3d-export");
        make3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: "3mf" | "openscad-masks", setFormat: (f: "3mf" | "openscad-masks") => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="3d-format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3D Manufacturing Format - Standard triangle mesh with separate shapes per color. Can be opened in most 3D software."
                : "ZIP file with heightmap images and OpenSCAD script. Generates parametric 3D model."}
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
        <h1>Dimensions</h1>
        <div class="height-settings">
            <div class="height-input">
                <label>
                    Layer Height (mm):
                    <input 
                        type="number" 
                        min="0.5" 
                        max="50" 
                        step="0.5"
                        value={props.height}
                        onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value) || 5)} 
                    />
                </label>
            </div>
            <div class="height-input">
                <label>
                    Base Height (mm):
                    <input 
                        type="number" 
                        min="0" 
                        max="50" 
                        step="0.5"
                        value={props.baseHeight}
                        onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value) || 2)} 
                    />
                </label>
            </div>
        </div>
        <span class="description">
            Layer height controls the thickness of each colored layer. Base height adds a solid base underneath.
        </span>
    </div>;
}
