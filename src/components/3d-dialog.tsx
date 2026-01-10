import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat } from '../3d-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type ThreeDDialogSettings = {
    format: ThreeDFormat;
    pixelHeight: number;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [settings, setSettings] = useState<ThreeDDialogSettings>({
        format: "3mf",
        pixelHeight: 0.5
    });

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup settings={settings} setSettings={setSettings} />
            <PixelHeightGroup settings={settings} setSettings={setSettings} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        window.clarity?.("event", "export-3d");
        
        generate3D(props.image, {
            format: settings.format,
            filename: props.filename.replace(".png", ""),
            pixelHeight: settings.pixelHeight
        });
    }
}

function FormatGroup(props: { settings: ThreeDDialogSettings; setSettings: (s: ThreeDDialogSettings) => void }) {
    const { settings, setSettings } = props;
    
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={settings.format === "3mf"}
                    onChange={() => setSettings({ ...settings, format: "3mf" })}
                />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">🧊</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={settings.format === "openscad-masks"}
                    onChange={() => setSettings({ ...settings, format: "openscad-masks" })}
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {settings.format === "3mf" 
                ? "Generate a 3MF triangle mesh file with separate material shapes for each color. Compatible with most 3D printing software."
                : "Generate a ZIP file containing black/white mask images for each color and an OpenSCAD file that combines them into a 3D model."}
        </span>
    </div>;
}

function PixelHeightGroup(props: { settings: ThreeDDialogSettings; setSettings: (s: ThreeDDialogSettings) => void }) {
    const { settings, setSettings } = props;
    
    return <div class="print-setting-group">
        <h1>Layer Height</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="pixelHeight"
                    checked={settings.pixelHeight === 0.2}
                    onChange={() => setSettings({ ...settings, pixelHeight: 0.2 })}
                />
                <div class="option">
                    <h3>Thin</h3>
                    <span class="height-value">0.2mm</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="pixelHeight"
                    checked={settings.pixelHeight === 0.5}
                    onChange={() => setSettings({ ...settings, pixelHeight: 0.5 })}
                />
                <div class="option">
                    <h3>Medium</h3>
                    <span class="height-value">0.5mm</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="pixelHeight"
                    checked={settings.pixelHeight === 1.0}
                    onChange={() => setSettings({ ...settings, pixelHeight: 1.0 })}
                />
                <div class="option">
                    <h3>Thick</h3>
                    <span class="height-value">1.0mm</span>
                </div>
            </label>
        </div>
        <span class="description">
            Height of each color layer in millimeters. Each color is stacked on top of the previous one.
        </span>
    </div>;
}
