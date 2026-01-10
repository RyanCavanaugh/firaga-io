import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PartListImage } from '../image-utils';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
}

export interface ThreeDProps {
    format: ThreeDFormat;
    pixelHeight: number;
    pixelWidth: number;
    baseHeight: number;
}

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
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            pixelWidth: props.settings.pixelWidth,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings, props.filename.replace(/\.(png|jpg|jpeg)$/i, ""));
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
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - triangle mesh with separate material shapes for each color. Standard industry format.",
            icon: <span class="format-icon">📐</span>
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome images per color and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">🎭</span>
        }
    ]
}));

const DimensionsGroup = makeDimensionGroup();

function makeDimensionGroup() {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        
        return <div class="print-setting-group">
            <h1>Dimensions (mm)</h1>
            <div class="dimension-inputs">
                <label>
                    Pixel Width:
                    <input 
                        type="number" 
                        min="0.1" 
                        step="0.1" 
                        value={props.settings.pixelWidth}
                        onChange={(e) => updateProp("threed", "pixelWidth", parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    Pixel Height:
                    <input 
                        type="number" 
                        min="0.1" 
                        step="0.1" 
                        value={props.settings.pixelHeight}
                        onChange={(e) => updateProp("threed", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    Base Height:
                    <input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        value={props.settings.baseHeight}
                        onChange={(e) => updateProp("threed", "baseHeight", parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
            <span class="description">
                Total size: {(props.image.width * props.settings.pixelWidth).toFixed(1)}mm × {(props.image.height * props.settings.pixelWidth).toFixed(1)}mm × {(props.settings.baseHeight + props.settings.pixelHeight).toFixed(1)}mm
            </span>
        </div>;
    };
}

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label key={String(v.value)}>
                    <input 
                        type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => updateProp("threed", p.key, v.value)}
                    />
                    <div class="option">
                        <h3>{v.title}</h3>
                        {v.icon}
                    </div>
                </label>)}
            </div>
            <span class="description">
                {p.values.find(v => v.value === props.settings[p.key])?.description}
            </span>
        </div>;
    };
}
