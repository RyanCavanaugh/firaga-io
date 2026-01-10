import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight,
            pitch: getPitch(props.gridSize)
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeD"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Industry-standard 3MF file with separate materials for each color. Compatible with most 3D printing slicers.",
            icon: <span class="format-3mf">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome images and OpenSCAD file using heightmap functionality.",
            icon: <span class="format-openscad">📦</span>,
        }
    ]
}));

const DimensionsGroup = makeDimensionsGroup();

function makeDimensionsGroup() {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        return <div class="print-setting-group">
            <h1>Dimensions</h1>
            <div class="dimension-inputs">
                <label>
                    <span>Pixel Height (mm):</span>
                    <input 
                        type="number" 
                        min="0.1" 
                        step="0.1" 
                        value={props.settings.pixelHeight}
                        onChange={(e) => {
                            const value = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(value)) {
                                updateProp("threeD", "pixelHeight", value);
                            }
                        }}
                    />
                </label>
                <label>
                    <span>Base Height (mm):</span>
                    <input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        value={props.settings.baseHeight}
                        onChange={(e) => {
                            const value = parseFloat((e.target as HTMLInputElement).value);
                            if (!isNaN(value)) {
                                updateProp("threeD", "baseHeight", value);
                            }
                        }}
                    />
                </label>
            </div>
            <span class="description">
                Pixel height determines the thickness of each colored layer. 
                Base height adds a foundation below the image (currently used for reference only).
            </span>
        </div>;
    };
}

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
