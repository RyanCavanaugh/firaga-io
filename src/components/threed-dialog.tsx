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
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [heightPerLayer, setHeightPerLayer] = useState(2);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup heightPerLayer={heightPerLayer} setHeightPerLayer={setHeightPerLayer} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;
    
    function export3D() {
        const settings: ThreeDSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            heightPerLayer
        };
        
        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

function FormatGroup(props: { format: ThreeDFormat, setFormat: (f: ThreeDFormat) => void }) {
    return <div class="print-setting-group">
        <h1>3D Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3D Manufacturing Format - triangle mesh with separate material shapes for each color"
                : "OpenSCAD masks - zip file with monochrome masks and .scad file"}
        </span>
    </div>;
}

function HeightGroup(props: { heightPerLayer: number, setHeightPerLayer: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Layer Height</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="height"
                    checked={props.heightPerLayer === 1}
                    onChange={() => props.setHeightPerLayer(1)} />
                <div class="option">
                    <h3>1mm</h3>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="height"
                    checked={props.heightPerLayer === 2}
                    onChange={() => props.setHeightPerLayer(2)} />
                <div class="option">
                    <h3>2mm</h3>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="height"
                    checked={props.heightPerLayer === 3}
                    onChange={() => props.setHeightPerLayer(3)} />
                <div class="option">
                    <h3>3mm</h3>
                </div>
            </label>
            <label>
                <input type="radio"
                    name="height"
                    checked={props.heightPerLayer === 5}
                    onChange={() => props.setHeightPerLayer(5)} />
                <div class="option">
                    <h3>5mm</h3>
                </div>
            </label>
        </div>
        <span class="description">Height of each pixel layer in millimeters</span>
    </div>;
}
