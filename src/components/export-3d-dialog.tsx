import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../export-3d';
import { AppProps, Export3DProps } from '../types';
import { PropContext } from './context';

export type Export3DDialogProps = {
    image: PartListImage;
    settings: Export3DProps;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)} disabled={isExporting}>
                Cancel
            </button>
            <button class="print" onClick={() => handleExport()} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function handleExport() {
        setIsExporting(true);
        try {
            const settings: Export3DSettings = {
                format: props.settings.format,
                baseHeight: props.settings.baseHeight,
                pixelHeight: props.settings.pixelHeight,
                filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ''),
            };

            window.clarity?.("event", "export-3d", settings.format);
            await export3D(props.image, settings);
        } finally {
            setIsExporting(false);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["export3d"]> = (props: Export3DDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["export3d"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format with colored triangle mesh - compatible with most 3D printers and slicers",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white mask images and OpenSCAD file for programmatic 3D modeling",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeNumberInputGroup(() => ({
    title: "Height Settings",
    fields: [
        {
            key: "baseHeight",
            label: "Base Height (mm)",
            description: "Height of the base plate",
            min: 0.1,
            max: 100,
            step: 0.1
        },
        {
            key: "pixelHeight",
            label: "Pixel Height (mm)",
            description: "Height of each colored pixel/voxel",
            min: 0.1,
            max: 50,
            step: 0.1
        }
    ]
}));

function makeRadioGroup<K extends keyof Export3DProps>(factory: OptionGroupFactory<K>) {
    return function (props: Export3DDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label key={String(v.value)}>
                    <input type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => {
                            updateProp("export3d", p.key, v.value);
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

type NumberInputGroupFactory = (props: Export3DDialogProps) => {
    title: string | JSX.Element;
    fields: ReadonlyArray<{
        key: keyof Export3DProps;
        label: string;
        description: string;
        min: number;
        max: number;
        step: number;
    }>;
};

function makeNumberInputGroup(factory: NumberInputGroupFactory) {
    return function (props: Export3DDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options number-inputs">
                {p.fields.map(field => (
                    <div key={field.key} class="number-input-group">
                        <label>
                            {field.label}
                            <input 
                                type="number"
                                min={field.min}
                                max={field.max}
                                step={field.step}
                                value={props.settings[field.key]}
                                onChange={(e: any) => {
                                    const value = parseFloat(e.target.value);
                                    if (!isNaN(value)) {
                                        updateProp("export3d", field.key, value);
                                    }
                                }}
                            />
                        </label>
                        <span class="description">{field.description}</span>
                    </div>
                ))}
            </div>
        </div>;
    };
}
