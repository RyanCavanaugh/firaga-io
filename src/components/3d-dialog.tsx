import * as preact from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3D, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad">("3mf");
    const [pixelSize, setPixelSize] = useState(5);
    const [heightPerLayer, setHeightPerLayer] = useState(1);
    const [baseHeight, setBaseHeight] = useState(2);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup 
                pixelSize={pixelSize}
                setPixelSize={setPixelSize}
                heightPerLayer={heightPerLayer}
                setHeightPerLayer={setHeightPerLayer}
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
            pixelSize,
            heightPerLayer,
            baseHeight
        };
        
        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
};

function FormatGroup(props: { format: "3mf" | "openscad", setFormat: (f: "3mf" | "openscad") => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
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
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3MF triangle mesh with separate material shapes for each color. Compatible with most 3D printing software."
                : "Zip file with monochrome images and OpenSCAD file using heightmap functionality."}
        </span>
    </div>;
}

function DimensionsGroup(props: {
    pixelSize: number,
    setPixelSize: (v: number) => void,
    heightPerLayer: number,
    setHeightPerLayer: (v: number) => void,
    baseHeight: number,
    setBaseHeight: (v: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <div class="dimension-controls">
                <label>
                    <span>Pixel Size:</span>
                    <input 
                        type="number" 
                        value={props.pixelSize} 
                        min="1" 
                        max="50" 
                        step="0.5"
                        onChange={(e) => props.setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>mm</span>
                </label>
                <label>
                    <span>Height Per Layer:</span>
                    <input 
                        type="number" 
                        value={props.heightPerLayer} 
                        min="0.1" 
                        max="10" 
                        step="0.1"
                        onChange={(e) => props.setHeightPerLayer(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>mm</span>
                </label>
                <label>
                    <span>Base Height:</span>
                    <input 
                        type="number" 
                        value={props.baseHeight} 
                        min="0" 
                        max="20" 
                        step="0.5"
                        onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>mm</span>
                </label>
            </div>
        </div>
        <span class="description">
            Adjust the physical dimensions of the 3D model. Each pixel becomes a {props.pixelSize}mm square, 
            with {props.heightPerLayer}mm height per color layer.
        </span>
    </div>;
}
