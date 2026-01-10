import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3DFile, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            pixelSize: props.settings.pixelSize,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "export-3d");
        generate3DFile(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeDExport"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeDExport"][K];
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
            title: "3MF Triangle Mesh",
            description: "Standard 3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing monochrome PNG masks (one per color) and an OpenSCAD file that combines them into a 3D model using heightmap functionality.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeNumericGroup(() => ({
    title: "Dimensions (mm)",
    fields: [
        {
            key: "pixelSize",
            label: "Pixel Size (width/depth)",
            min: 0.1,
            max: 100,
            step: 0.1
        },
        {
            key: "pixelHeight",
            label: "Pixel Height",
            min: 0.1,
            max: 50,
            step: 0.1
        },
        {
            key: "baseHeight",
            label: "Base Layer Height",
            min: 0,
            max: 50,
            step: 0.1
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
                            updateProp("threeDExport", p.key, v.value);
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
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.fields.map(field => (
                    <label key={field.key} class="numeric-field">
                        <span>{field.label}</span>
                        <input 
                            type="number"
                            min={field.min}
                            max={field.max}
                            step={field.step}
                            value={props.settings[field.key]}
                            onChange={(e: any) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                    updateProp("threeDExport", field.key, value);
                                }
                            }}
                        />
                    </label>
                ))}
            </div>
        </div>;
    };
}
