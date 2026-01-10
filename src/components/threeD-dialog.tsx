import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF, generateOpenSCADMasks, ThreeDSettings } from '../threeD-generator';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [pixelHeight, setPixelHeight] = useState(2.0);
    const [baseHeight, setBaseHeight] = useState(1.0);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightSettings 
                pixelHeight={pixelHeight} 
                baseHeight={baseHeight}
                onPixelHeightChange={setPixelHeight}
                onBaseHeightChange={setBaseHeight}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportThreeD()}>Export 3D</button>
        </div>
    </div>;

    async function exportThreeD() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
            pixelHeight,
            baseHeight
        };

        window.clarity?.("event", "export-3d");
        
        let blob: Blob;
        let filename: string;
        
        if (settings.format === '3mf') {
            blob = generate3MF(props.image, settings);
            filename = `${settings.filename}.3mf`;
        } else {
            blob = await generateOpenSCADMasks(props.image, settings);
            filename = `${settings.filename}_openscad.zip`;
        }
        
        // Trigger download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        updateProp("ui", "is3DOpen", false);
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
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate colored shapes. Compatible with most 3D printers and slicers.",
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white masks per color and an OpenSCAD file. Allows customization in OpenSCAD.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

function HeightSettings(props: {
    pixelHeight: number;
    baseHeight: number;
    onPixelHeightChange: (value: number) => void;
    onBaseHeightChange: (value: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Pixel Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1" 
                    value={props.pixelHeight}
                    onChange={(e) => props.onPixelHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span>mm</span>
            </label>
            <label>
                <span>Base Height:</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1" 
                    value={props.baseHeight}
                    onChange={(e) => props.onBaseHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                />
                <span>mm</span>
            </label>
        </div>
        <span class="description">
            Pixel height is the thickness of each colored pixel. Base height is the thickness of the base layer.
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
