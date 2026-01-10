import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../3d-export';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    filename: string;
};

type LocalSettings = {
    format: Export3DFormat;
    height: number;
    baseThickness: number;
};

export function Export3DDialog(props: Export3DDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [settings, setSettings] = useState<LocalSettings>({
        format: '3mf',
        height: 2,
        baseThickness: 1,
    });
    
    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup settings={settings} onChange={setSettings} />
                <HeightGroup settings={settings} onChange={setSettings} />
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp("ui", "is3dExportOpen", false)}>
                    Cancel
                </button>
                <button class="print" onClick={() => handleExport()}>
                    Export 3D
                </button>
            </div>
        </div>
    );
    
    function handleExport(): void {
        const exportSettings: Export3DSettings = {
            format: settings.format,
            height: settings.height,
            baseThickness: settings.baseThickness,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ''),
        };
        
        window.clarity?.("event", "3d-export", settings.format);
        export3D(props.image, exportSettings);
    }
}

type SettingsGroupProps = {
    settings: LocalSettings;
    onChange: (settings: LocalSettings) => void;
};

function FormatGroup({ settings, onChange }: SettingsGroupProps): JSX.Element {
    return (
        <div class="print-setting-group">
            <h1>Format</h1>
            <div class="print-setting-group-options">
                <label>
                    <input
                        type="radio"
                        name="format"
                        checked={settings.format === '3mf'}
                        onChange={() => onChange({ ...settings, format: '3mf' })}
                    />
                    <div class="option">
                        <h3>3MF Mesh</h3>
                        <span>📦</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="format"
                        checked={settings.format === 'openscad'}
                        onChange={() => onChange({ ...settings, format: 'openscad' })}
                    />
                    <div class="option">
                        <h3>OpenSCAD Masks</h3>
                        <span>🎭</span>
                    </div>
                </label>
            </div>
            <span class="description">
                {settings.format === '3mf' 
                    ? 'Triangle mesh with separate material shapes for each color (industry standard 3MF format)'
                    : 'Zip file with B&W heightmap images and OpenSCAD file to combine them'}
            </span>
        </div>
    );
}

function HeightGroup({ settings, onChange }: SettingsGroupProps): JSX.Element {
    return (
        <div class="print-setting-group">
            <h1>Layer Height (mm)</h1>
            <div class="print-setting-group-options">
                <label>
                    <input
                        type="radio"
                        name="height"
                        checked={settings.height === 1}
                        onChange={() => onChange({ ...settings, height: 1 })}
                    />
                    <div class="option">
                        <h3>1mm</h3>
                        <span>▁</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="height"
                        checked={settings.height === 2}
                        onChange={() => onChange({ ...settings, height: 2 })}
                    />
                    <div class="option">
                        <h3>2mm</h3>
                        <span>▂</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="height"
                        checked={settings.height === 3}
                        onChange={() => onChange({ ...settings, height: 3 })}
                    />
                    <div class="option">
                        <h3>3mm</h3>
                        <span>▃</span>
                    </div>
                </label>
            </div>
            <span class="description">
                Height of each color layer in the 3D model
            </span>
        </div>
    );
}
