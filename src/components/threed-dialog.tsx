import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDSettings["format"]>("3mf");
    const [pixelHeight, setPixelHeight] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <HeightGroup 
                pixelHeight={pixelHeight} 
                setPixelHeight={setPixelHeight}
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
            filename: props.filename.replace(".png", ""),
            pixelHeight,
            baseHeight
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: ThreeDSettings["format"], setFormat: (f: ThreeDSettings["format"]) => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} 
                />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === "openscad"}
                    onChange={() => props.setFormat("openscad")} 
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3D Manufacturing Format with separate colored meshes. Compatible with most 3D printing software."
                : "Zip file with mask images and OpenSCAD script. Use OpenSCAD to render and customize the 3D model."}
        </span>
    </div>;
}

function HeightGroup(props: { 
    pixelHeight: number, 
    setPixelHeight: (h: number) => void,
    baseHeight: number,
    setBaseHeight: (h: number) => void
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <div class="dimension-controls">
                <label>
                    <span>Pixel Height:</span>
                    <input 
                        type="number" 
                        min="0.1" 
                        max="20" 
                        step="0.1" 
                        value={props.pixelHeight}
                        onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>mm</span>
                </label>
                <label>
                    <span>Base Height:</span>
                    <input 
                        type="number" 
                        min="0" 
                        max="10" 
                        step="0.1" 
                        value={props.baseHeight}
                        onChange={(e) => props.setBaseHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span>mm</span>
                </label>
            </div>
        </div>
        <span class="description">
            Pixel height is the thickness of each colored layer. Base height is the optional base layer beneath all pixels.
        </span>
    </div>;
}
