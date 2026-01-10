import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export type ThreeDProps = {
    format: ThreeDFormat;
    heightPerLayer: number;
    baseHeight: number;
};

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup {...props} />
                <HeightSettingsGroup {...props} />
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>
                    Cancel
                </button>
                <button class="print" onClick={() => export3D()}>
                    Export 3D
                </button>
            </div>
        </div>
    );

    function export3D(): void {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            heightPerLayer: props.settings.heightPerLayer,
            baseHeight: props.settings.baseHeight,
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
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

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "Standard 3D manufacturing format with separate colored shapes. Compatible with most 3D printers and slicers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file with PNG masks per color and OpenSCAD script. Allows customization and parametric modifications.",
            icon: <span class="format-icon">📦</span>,
        },
    ],
}));

const HeightSettingsGroup = makeSettingsGroup((): SettingsGroupDef => ({
    title: "Height Settings",
    settings: [
        {
            key: "heightPerLayer",
            label: "Height per Layer (mm)",
            min: 0.1,
            max: 10,
            step: 0.1,
        },
        {
            key: "baseHeight",
            label: "Base Height (mm)",
            min: 0,
            max: 10,
            step: 0.1,
        },
    ],
}));

type SettingsGroupDef = {
    title: string | JSX.Element;
    settings: ReadonlyArray<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
    }>;
};

function makeRadioGroup<K extends keyof ThreeDProps>(
    factory: OptionGroupFactory<K>
) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return (
            <div class="print-setting-group">
                <h1>{p.title}</h1>
                <div class="print-setting-group-options">
                    {p.values.map((v) => (
                        <label key={String(v.value)}>
                            <input
                                type="radio"
                                name={p.key}
                                checked={v.value === props.settings[p.key]}
                                onChange={() => {
                                    updateProp("threed", p.key, v.value);
                                }}
                            />
                            <div class="option">
                                <h3>{v.title}</h3>
                                {v.icon}
                            </div>
                        </label>
                    ))}
                </div>
                <span class="description">
                    {p.values.find((v) => v.value === props.settings[p.key])?.description}
                </span>
            </div>
        );
    };
}

function makeSettingsGroup(factory: () => SettingsGroupDef) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const def = factory();
        
        return (
            <div class="print-setting-group">
                <h1>{def.title}</h1>
                <div class="print-setting-group-options">
                    {def.settings.map((setting) => (
                        <label key={setting.key}>
                            <span>{setting.label}</span>
                            <input
                                type="number"
                                min={setting.min}
                                max={setting.max}
                                step={setting.step}
                                value={props.settings[setting.key] as number}
                                onChange={(e) => {
                                    const value = parseFloat((e.target as HTMLInputElement).value);
                                    updateProp("threed", setting.key, value);
                                }}
                            />
                        </label>
                    ))}
                </div>
            </div>
        );
    };
}
