import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DSettings } from '../3d-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            const settings: Export3DSettings = {
                format: props.settings.format,
                filename: props.filename.replace(/\.(png|jpg|jpeg|gif)$/i, ""),
                pixelWidth: props.settings.pixelWidth,
                pixelHeight: props.settings.pixelHeight,
                pixelDepth: props.settings.pixelDepth,
            };

            window.clarity?.("event", "export-3d");
            await export3D(props.image, settings);
        } finally {
            setIsExporting(false);
        }
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
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF",
            description: "3D Manufacturing Format - Triangle mesh with separate shapes per color. Compatible with most 3D printers and slicers.",
            icon: <span class="format-3mf">📦</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "ZIP file with black/white masks per color and an OpenSCAD file that combines them into a 3D model using heightmaps.",
            icon: <span class="format-openscad">🔧</span>,
        }
    ]
}));

function DimensionsGroup(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimensions-inputs">
            <label>
                Pixel Width:
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={props.settings.pixelWidth}
                    onChange={(e) => updateProp("threeD", "pixelWidth", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                Pixel Height:
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={props.settings.pixelHeight}
                    onChange={(e) => updateProp("threeD", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                Pixel Depth:
                <input 
                    type="number" 
                    min="0.1" 
                    step="0.1"
                    value={props.settings.pixelDepth}
                    onChange={(e) => updateProp("threeD", "pixelDepth", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Each pixel will be {props.settings.pixelWidth}mm × {props.settings.pixelHeight}mm × {props.settings.pixelDepth}mm
        </span>
    </div>;
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
