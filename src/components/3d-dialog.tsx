import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../3d-exporter';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={handleExport}>Export 3D</button>
        </div>
    </div>;

    function handleExport(): void {
        const settings: Export3DSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            pitch: props.settings.pitch,
            height: props.settings.height
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
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
}

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - Triangle mesh with separate material shapes for each color",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "Zip file with monochrome images and OpenSCAD file using heightmap functionality",
            icon: <span class="format-icon">🗜️</span>,
        }
    ]
}));

const DimensionsGroup = makeNumericGroup(() => ({
    title: "Dimensions",
    fields: [
        {
            key: "pitch",
            label: "Pixel Pitch (mm)",
            min: 0.1,
            max: 50,
            step: 0.1
        },
        {
            key: "height",
            label: "Pixel Height (mm)",
            min: 0.1,
            max: 50,
            step: 0.1
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
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

type NumericField<K extends keyof ThreeDProps> = {
    key: K;
    label: string;
    min: number;
    max: number;
    step: number;
};

type NumericGroupFactory = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    fields: ReadonlyArray<NumericField<keyof ThreeDProps>>;
}

function makeNumericGroup(factory: NumericGroupFactory) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.fields.map(field => (
                    <label key={field.key}>
                        <span>{field.label}</span>
                        <input
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={props.settings[field.key]}
                            onChange={(e) => {
                                const value = parseFloat((e.target as HTMLInputElement).value);
                                updateProp("threeD", field.key, value);
                            }}
                        />
                    </label>
                ))}
            </div>
        </div>;
    };
}
