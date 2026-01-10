import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeDSettings } from '../3mf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [height, setHeight] = useState(2);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup height={height} setHeight={setHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format,
            pitch: getPitch(props.gridSize),
            height
        };

        window.clarity?.("event", "export-3d");
        
        if (format === "3mf") {
            generate3MF(props.image, settings);
        } else {
            generateOpenSCADMasks(props.image, settings);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

function FormatGroup(props: { format: "3mf" | "openscad", setFormat: (f: "3mf" | "openscad") => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF Triangle Mesh</h3>
                    <span class="format-icon">🔺</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">🎭</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "Standard 3MF file with separate material shapes for each color"
                : "Zip file with monochrome masks and OpenSCAD file using heightmap functionality"}
        </span>
    </div>;
}

function HeightGroup(props: { height: number, setHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Block Height</h1>
        <div class="print-setting-group-options">
            <input 
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={props.height}
                onChange={(e) => props.setHeight(parseFloat((e.target as HTMLInputElement).value))} />
            <span>{props.height}mm</span>
        </div>
        <span class="description">Height of each pixel block in the 3D model</span>
    </div>;
}
