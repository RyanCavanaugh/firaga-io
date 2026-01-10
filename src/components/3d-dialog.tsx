import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [layerHeight, setLayerHeight] = useState(1);
    const [baseHeight, setBaseHeight] = useState(0);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} onFormatChange={setFormat} />
            <HeightSettingsGroup 
                layerHeight={layerHeight}
                baseHeight={baseHeight}
                onLayerHeightChange={setLayerHeight}
                onBaseHeightChange={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;
    
    function exportModel() {
        const settings: ThreeDSettings = {
            format,
            layerHeight,
            baseHeight
        };
        
        window.clarity?.("event", "3d-export");
        generate3D(props.image, settings, props.filename.replace(".png", ""));
    }
}

function FormatGroup(props: { format: "3mf" | "openscad"; onFormatChange: (f: "3mf" | "openscad") => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.onFormatChange("3mf")}
                />
                <div class="option">
                    <h3>3MF</h3>
                    <div class="format-icon">📦</div>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "openscad"}
                    onChange={() => props.onFormatChange("openscad")}
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <div class="format-icon">🔧</div>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D slicers."
                : "ZIP file with monochrome masks and OpenSCAD script for combining into 3D display."}
        </span>
    </div>;
}

function HeightSettingsGroup(props: {
    layerHeight: number;
    baseHeight: number;
    onLayerHeightChange: (h: number) => void;
    onBaseHeightChange: (h: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Height Settings (mm)</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Layer Height:</span>
                <input 
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={props.layerHeight}
                    onChange={(e) => props.onLayerHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Height:</span>
                <input 
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={props.baseHeight}
                    onChange={(e) => props.onBaseHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Layer height controls the thickness of each color layer. Base height is the Z-offset for the entire model.
        </span>
    </div>;
}
