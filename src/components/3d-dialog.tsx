import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { make3mf } from '../3mf-generator';
import { makeOpenscadZip } from '../openscad-generator';
import { AppProps, ThreeDFormat } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);

    return <div class="three-d-dialog">
        <div class="three-d-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="three-d-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "isThreeDOpen", false)}>Cancel</button>
            <button class="export" onClick={exportHandler} disabled={isExporting}>
                {isExporting ? "Exporting..." : "Export 3D"}
            </button>
        </div>
    </div>;

    function exportHandler() {
        setIsExporting(true);
        
        const doExport = async () => {
            try {
                if (props.settings.format === "3mf") {
                    make3mf(props.image, props.settings.height, props.filename.replace(".png", ""));
                } else {
                    await makeOpenscadZip(props.image, props.settings.height, props.filename.replace(".png", ""));
                }
                window.clarity?.("event", "export-3d");
                updateProp("ui", "isThreeDOpen", false);
            } catch (err) {
                console.error("Error exporting 3D:", err);
                alert("Failed to export 3D. Check the console for details.");
                setIsExporting(false);
            }
        };
        
        doExport();
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threeD"];
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format" as const,
    values: [
        {
            value: "3mf" as ThreeDFormat,
            title: "3MF",
            description: "3D Manufacturing Format - standard 3D model file with separate mesh for each color",
            icon: <span class="format-icon">🎲</span>,
        },
        {
            value: "openscad" as ThreeDFormat,
            title: "OpenSCAD",
            description: "Zip file with monochrome images and OpenSCAD script using heightmap",
            icon: <span class="format-icon">📐</span>,
        }
    ]
}));

const HeightGroup = makeSliderGroup(({ settings }) => ({
    title: "Height (mm)",
    key: "height" as const,
    min: 1,
    max: 50,
    step: 1,
    value: settings.height,
    description: "Height of each color layer in millimeters"
}));

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeD"][K];
        title: string | JSX.Element;
        icon?: JSX.Element;
        description: string | JSX.Element;
    }>;
}

type SliderGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    min: number;
    max: number;
    step: number;
    value: number;
    description: string | JSX.Element;
}

function makeRadioGroup<K extends keyof AppProps["threeD"]>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="three-d-setting-group">
            <h1>{p.title}</h1>
            <div class="three-d-setting-group-options">
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

function makeSliderGroup<K extends keyof AppProps["threeD"]>(factory: SliderGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="three-d-setting-group">
            <h1>{p.title}</h1>
            <div class="three-d-slider-group">
                <input type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={props.settings[p.key] as number}
                    onChange={(e) => {
                        const value = parseInt((e.target as HTMLInputElement).value, 10);
                        updateProp("threeD", p.key, value as any);
                    }} />
                <span class="slider-value">{props.settings[p.key]}</span>
            </div>
            <span class="description">{p.description}</span>
        </div>;
    };
}
