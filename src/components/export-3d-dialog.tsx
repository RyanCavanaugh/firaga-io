import * as preact from "preact";
import { useContext } from "preact/hooks";
import { PartListImage } from "../image-utils";
import { export3D, Export3DSettings } from "../3d-export";
import { PropContext } from "./context";

export type Export3DDialogProps = {
    image: PartListImage;
    settings: Export3DProps;
    filename: string;
};

export type Export3DProps = {
    format: "3mf" | "openscad";
    height: number;
    baseHeight: number;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    
    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup {...props} />
                <DimensionsGroup {...props} />
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>
                    Cancel
                </button>
                <button class="print" onClick={() => performExport()}>
                    Export 3D
                </button>
            </div>
        </div>
    );

    function performExport() {
        const settings: Export3DSettings = {
            format: props.settings.format,
            height: props.settings.height,
            baseHeight: props.settings.baseHeight,
            filename: props.filename.replace(/\.png$/i, ""),
        };

        window.clarity?.("event", "3d-export");
        export3D(props.image, settings);
    }
}

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf" as const,
            title: "3MF Triangle Mesh",
            description: "Standard 3D Manufacturing Format with separate materials for each color. Compatible with most 3D software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad" as const,
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome heightmap images and an OpenSCAD file to combine them into a 3D model.",
            icon: <span class="format-icon">🎨</span>,
        },
    ],
}));

const DimensionsGroup = makeOptionsGroup(() => ({
    title: "Dimensions",
    settings: [
        {
            key: "height",
            label: "Pixel Height (mm)",
            type: "number",
            min: 0.1,
            max: 10,
            step: 0.1,
        },
        {
            key: "baseHeight",
            label: "Base Height (mm)",
            type: "number",
            min: 0,
            max: 10,
            step: 0.1,
        },
    ],
}));

type RadioGroupFactory<K extends keyof Export3DProps> = (props: Export3DDialogProps) => {
    title: string;
    key: K;
    values: ReadonlyArray<{
        value: Export3DProps[K];
        title: string;
        icon: preact.JSX.Element;
        description: string;
    }>;
};

function makeRadioGroup<K extends keyof Export3DProps>(
    factory: RadioGroupFactory<K>
) {
    return function (props: Export3DDialogProps) {
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
                                    updateProp("export3d", p.key, v.value);
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

type OptionsGroupFactory = (props: Export3DDialogProps) => {
    title: string;
    settings: ReadonlyArray<{
        key: keyof Export3DProps;
        label: string;
        type: "number";
        min: number;
        max: number;
        step: number;
    }>;
};

function makeOptionsGroup(factory: OptionsGroupFactory) {
    return function (props: Export3DDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return (
            <div class="print-setting-group">
                <h1>{p.title}</h1>
                <div class="options-vertical">
                    {p.settings.map((setting) => (
                        <div key={setting.key} class="option-row">
                            <label>{setting.label}</label>
                            <input
                                type={setting.type}
                                min={setting.min}
                                max={setting.max}
                                step={setting.step}
                                value={props.settings[setting.key] as number}
                                onChange={(e) => {
                                    const value = parseFloat((e.target as HTMLInputElement).value);
                                    updateProp("export3d", setting.key, value as never);
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };
}
