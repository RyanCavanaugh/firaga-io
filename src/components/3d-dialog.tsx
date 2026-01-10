import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export type ThreeDProps = {
    format: ThreeDFormat;
    height: number;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const format: ThreeDFormat = "3mf"; // Default format
    const height = 2; // Default height in mm
    
    return <div class="print-dialog">
        <div class="print-options">
            <h1>Export 3D Model</h1>
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        // Get current settings from UI state
        const formatElement = document.querySelector<HTMLInputElement>('input[name="3d-format"]:checked');
        const heightElement = document.querySelector<HTMLInputElement>('input[name="3d-height"]');
        
        const selectedFormat = (formatElement?.value as ThreeDFormat) || "3mf";
        const selectedHeight = parseFloat(heightElement?.value || "2");
        
        const settings: ThreeDSettings = {
            format: selectedFormat,
            filename: props.filename.replace(/\.png$/i, ''),
            pitch: getPitch(props.gridSize),
            height: selectedHeight
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends string> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: string;
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "3d-format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard industry format with separate material shapes for each color. Compatible with most 3D slicers and printers.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white masks for each color and an OpenSCAD file to combine them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const HeightGroup = makeInputGroup(() => ({
    title: "Layer Height",
    key: "3d-height",
    inputType: "number",
    defaultValue: "2",
    min: "0.1",
    max: "10",
    step: "0.1",
    unit: "mm",
    description: "Height of each pixel layer in millimeters"
}));

function makeRadioGroup<K extends string>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map((v, idx) => <label key={idx}>
                    <input type="radio"
                        name={p.key}
                        value={v.value}
                        defaultChecked={idx === 0} />
                    <div class="option">
                        <h3>{v.title}</h3>
                        {v.icon}
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values[0]?.description}</span>
        </div>;
    };
}

type InputGroupFactory<K extends string> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    inputType: string;
    defaultValue: string;
    min?: string;
    max?: string;
    step?: string;
    unit?: string;
    description: string | JSX.Element;
}

function makeInputGroup<K extends string>(factory: InputGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="input-group">
                <input 
                    type={p.inputType}
                    name={p.key}
                    defaultValue={p.defaultValue}
                    min={p.min}
                    max={p.max}
                    step={p.step}
                />
                {p.unit && <span class="input-unit">{p.unit}</span>}
            </div>
            <span class="description">{p.description}</span>
        </div>;
    };
}
