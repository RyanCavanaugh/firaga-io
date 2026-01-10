import * as preact from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { PropContext } from './context';
import { AppProps } from '../types';

export interface ThreeDDialogProps {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
}

export type ThreeDProps = {
    format: ThreeDFormat;
    pixelWidth: number;
    pixelHeight: number;
    baseHeight: number;
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
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    async function export3D() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            pixelWidth: props.settings.pixelWidth,
            baseHeight: props.settings.baseHeight
        };

        window.clarity?.("event", "export-3d");
        await generate3D(props.image, settings);
    }
}

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf" as const,
            title: "3MF Triangle Mesh",
            description: "Industry standard 3D manufacturing format with separate materials for each color. Compatible with most 3D printing software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad-masks" as const,
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white mask images per color and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const DimensionsGroup = (() => {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        
        return <div class="print-setting-group">
            <h1>Dimensions (mm)</h1>
            <div class="print-setting-group-options">
                <label>
                    <span>Pixel Width:</span>
                    <input 
                        type="number" 
                        min="0.1" 
                        step="0.1" 
                        value={props.settings.pixelWidth}
                        onChange={(e) => updateProp("threeDExport", "pixelWidth", parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Pixel Height:</span>
                    <input 
                        type="number" 
                        min="0.1" 
                        step="0.1" 
                        value={props.settings.pixelHeight}
                        onChange={(e) => updateProp("threeDExport", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    <span>Base Height:</span>
                    <input 
                        type="number" 
                        min="0" 
                        step="0.1" 
                        value={props.settings.baseHeight}
                        onChange={(e) => updateProp("threeDExport", "baseHeight", parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
            <span class="description">
                {props.settings.format === "3mf" 
                    ? "Set the dimensions of each pixel in the 3D model."
                    : "Set the dimensions for the OpenSCAD heightmap extrusion."}
            </span>
        </div>;
    };
})();

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
    title: string | preact.JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
        title: string | preact.JSX.Element;
        icon: preact.JSX.Element;
        description: string | preact.JSX.Element;
    }>;
}

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
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
