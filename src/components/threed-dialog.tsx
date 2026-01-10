import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF, Export3MFSettings } from '../export-3mf';
import { generateOpenSCADMasks, ExportOpenSCADSettings } from '../export-openscad';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            {props.settings.format === '3mf' && <ThreeMFOptions {...props} />}
            {props.settings.format === 'openscad' && <OpenSCADOptions {...props} />}
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={exportModel} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            window.clarity?.("event", "export-3d");
            
            if (props.settings.format === '3mf') {
                await export3MF();
            } else {
                await exportOpenSCAD();
            }
        } finally {
            setIsExporting(false);
        }
    }

    async function export3MF() {
        const settings: Export3MFSettings = {
            pixelWidth: props.settings.pixelWidth,
            pixelHeight: props.settings.pixelHeight,
            baseThickness: props.settings.baseThickness
        };

        const blob = generate3MF(props.image, settings);
        downloadBlob(blob, props.filename.replace(/\.\w+$/, '') + '.3mf');
    }

    async function exportOpenSCAD() {
        const settings: ExportOpenSCADSettings = {
            pixelSize: props.settings.pixelSize,
            heightScale: props.settings.heightScale
        };

        const blob = await generateOpenSCADMasks(props.image, settings);
        downloadBlob(blob, props.filename.replace(/\.\w+$/, '') + '_openscad.zip');
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
        title: string | JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D manufacturing format with separate material shapes for each color. Compatible with most 3D printing software."
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with heightmap images and OpenSCAD script for procedural 3D generation."
        }
    ]
}));

const ThreeMFOptions = (props: ThreeDDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>3MF Settings</h1>
        <div class="print-setting-group-options">
            <label>
                Pixel Width (mm):
                <input 
                    type="number" 
                    value={props.settings.pixelWidth} 
                    onChange={(e) => updateProp("threeD", "pixelWidth", parseFloat((e.target as HTMLInputElement).value))}
                    min="0.1"
                    step="0.1"
                />
            </label>
            <label>
                Pixel Height (mm):
                <input 
                    type="number" 
                    value={props.settings.pixelHeight} 
                    onChange={(e) => updateProp("threeD", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                    min="0.1"
                    step="0.1"
                />
            </label>
            <label>
                Base Thickness (mm):
                <input 
                    type="number" 
                    value={props.settings.baseThickness} 
                    onChange={(e) => updateProp("threeD", "baseThickness", parseFloat((e.target as HTMLInputElement).value))}
                    min="0.1"
                    step="0.1"
                />
            </label>
        </div>
    </div>;
};

const OpenSCADOptions = (props: ThreeDDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>OpenSCAD Settings</h1>
        <div class="print-setting-group-options">
            <label>
                Pixel Size (mm):
                <input 
                    type="number" 
                    value={props.settings.pixelSize} 
                    onChange={(e) => updateProp("threeD", "pixelSize", parseFloat((e.target as HTMLInputElement).value))}
                    min="0.1"
                    step="0.1"
                />
            </label>
            <label>
                Height Scale (mm):
                <input 
                    type="number" 
                    value={props.settings.heightScale} 
                    onChange={(e) => updateProp("threeD", "heightScale", parseFloat((e.target as HTMLInputElement).value))}
                    min="0.1"
                    step="0.1"
                />
            </label>
        </div>
    </div>;
};

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label>
                    <input type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => {
                            updateProp("threeD", p.key, v.value);
                        }} />
                    <div class="option">
                        <h3>{v.title}</h3>
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values.filter(v => v.value === props.settings[p.key])[0]?.description}</span>
        </div>;
    };
}
