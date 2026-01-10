import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { export3MF } from '../exporters/3mf-exporter';
import { exportOpenSCADMasks } from '../exporters/openscad-exporter';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export type ThreeDProps = {
    format: '3mf' | 'openscad';
    baseHeight: number;
    pixelHeight: number;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={() => exportModel()}
                disabled={isExporting}
            >
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            window.clarity?.("event", "export-3d");
            
            const filename = props.filename.replace(".png", "");
            
            if (props.settings.format === '3mf') {
                await export3MF(props.image, {
                    baseHeight: props.settings.baseHeight,
                    pixelHeight: props.settings.pixelHeight,
                    filename
                });
            } else {
                await exportOpenSCADMasks(props.image, {
                    baseHeight: props.settings.baseHeight,
                    pixelHeight: props.settings.pixelHeight,
                    filename
                });
            }
        } finally {
            setIsExporting(false);
        }
    }
}

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<'format'>> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: '3mf',
            title: "3MF Triangle Mesh",
            description: "Standard 3D manufacturing format with separate material shapes for each color",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: 'openscad',
            title: "OpenSCAD Masks",
            description: "Zip file with monochrome masks and OpenSCAD file for parametric 3D display",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionGroup = makeSettingsGroup(() => ({
    title: "Dimensions (mm)",
    settings: [
        {
            key: "baseHeight" as const,
            label: "Base Height",
            min: 0.5,
            max: 10,
            step: 0.5,
            default: 2
        },
        {
            key: "pixelHeight" as const,
            label: "Pixel Height",
            min: 0.5,
            max: 10,
            step: 0.5,
            default: 1
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
                            updateProp("threeD", p.key, v.value);
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

function makeSettingsGroup<K extends keyof ThreeDProps>(factory: () => {
    title: string;
    settings: ReadonlyArray<{
        key: K;
        label: string;
        min: number;
        max: number;
        step: number;
        default: number;
    }>;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory();
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.settings.map(setting => (
                    <label>
                        <span>{setting.label}: {props.settings[setting.key]}mm</span>
                        <input 
                            type="range"
                            min={setting.min}
                            max={setting.max}
                            step={setting.step}
                            value={props.settings[setting.key] as number}
                            onChange={(e) => {
                                const target = e.target as HTMLInputElement;
                                const value = parseFloat(target.value);
                                // Type assertion to work around TypeScript's inference limitations
                                updateProp("threeD", setting.key, value as ThreeDProps[K]);
                            }}
                        />
                    </label>
                ))}
            </div>
        </div>;
    };
}
