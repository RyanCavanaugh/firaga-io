import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ThreeDFormat>("3mf");
    const [pixelHeight, setPixelHeight] = useState(1);
    const [baseHeight, setBaseHeight] = useState(0);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <ParametersGroup
                pixelHeight={pixelHeight}
                setPixelHeight={setPixelHeight}
                baseHeight={baseHeight}
                setBaseHeight={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={export3D}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format,
            pixelHeight,
            baseHeight,
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

function FormatGroup(props: { format: ThreeDFormat; setFormat: (f: ThreeDFormat) => void }) {
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
                    <span class="format-icon">🔷</span>
                </div>
            </label>
            <label>
                <input
                    type="radio"
                    name="format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")}
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf"
                ? "3D Manufacturing Format - standard 3D printing format with separate colored shapes"
                : "ZIP file with heightmap images and OpenSCAD file for 3D rendering"}
        </span>
    </div>;
}

function ParametersGroup(props: {
    pixelHeight: number;
    setPixelHeight: (h: number) => void;
    baseHeight: number;
    setBaseHeight: (h: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Parameters</h1>
        <div class="print-setting-group-options">
            <div class="parameter-input">
                <label>
                    Pixel Height (mm):
                    <input
                        type="number"
                        min="0.1"
                        max="10"
                        step="0.1"
                        value={props.pixelHeight}
                        onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
            <div class="parameter-input">
                <label>
                    Base Height (mm):
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
            Pixel height controls the height of each colored layer. Base height is the starting Z position.
        </span>
    </div>;
}
