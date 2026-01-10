import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF, ThreeMFSettings } from '../3mf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={handleExport}
                disabled={isExporting}
            >
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsExporting(true);
        
        try {
            const settings = {
                filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ''),
                pixelWidth: props.settings.pixelWidth,
                pixelHeight: props.settings.pixelHeight,
            };
            
            window.clarity?.("event", "export-3d", props.settings.format);
            
            if (props.settings.format === '3mf') {
                generate3MF(props.image, settings as ThreeMFSettings);
            } else if (props.settings.format === 'openscad') {
                await generateOpenSCADMasks(props.image, settings as OpenSCADSettings);
            }
        } finally {
            setIsExporting(false);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["threed"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threed"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Export as 3MF triangle mesh with separate material shapes for each color. Compatible with most 3D printers and modeling software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as ZIP file with monochrome images and OpenSCAD file. Use OpenSCAD's heightmap functionality to create 3D display.",
            icon: <span class="format-icon">🗂️</span>,
        }
    ]
}));

const DimensionsGroup = makeNumberInputGroup(({ settings }) => ({
    title: "Dimensions",
    fields: [
        {
            key: "pixelWidth",
            label: "Pixel Width/Depth (mm)",
            value: settings.pixelWidth,
            min: 0.1,
            max: 100,
            step: 0.1,
        },
        {
            key: "pixelHeight",
            label: "Pixel Height (mm)",
            value: settings.pixelHeight,
            min: 0.1,
            max: 100,
            step: 0.1,
        }
    ]
}));

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
                            updateProp("threed", p.key, v.value);
                        }} />
                    <div class="option">
                        <h3>{v.title}</h3>
                        {v.icon}
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values.filter(v => v.value === props.settings[p.key])[0]?.description}</span>
        </div>;
    };
}

function makeNumberInputGroup(factory: (props: ThreeDDialogProps) => {
    title: string;
    fields: Array<{
        key: keyof ThreeDProps;
        label: string;
        value: number;
        min: number;
        max: number;
        step: number;
    }>;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const config = factory(props);
        
        return <div class="print-setting-group">
            <h1>{config.title}</h1>
            <div class="dimension-inputs">
                {config.fields.map(field => (
                    <div class="dimension-field" key={field.key}>
                        <label>{field.label}</label>
                        <input 
                            type="number" 
                            value={field.value}
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            onChange={(e) => {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                if (!isNaN(value)) {
                                    updateProp("threed", field.key, value);
                                }
                            }}
                        />
                    </div>
                ))}
            </div>
        </div>;
    };
}
