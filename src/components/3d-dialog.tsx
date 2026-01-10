import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF } from '../3mf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';
import { AppProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threeD"];
    filename: string;
};

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
                {isExporting ? 'Exporting...' : 'Export 3D Model'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            const settings = {
                format: props.settings.format,
                pixelSize: props.settings.pixelSize,
                heightPerLayer: props.settings.heightPerLayer,
                baseHeight: props.settings.baseHeight
            };

            window.clarity?.("event", "export-3d");

            if (props.settings.format === "3mf") {
                generate3MF(props.image, settings);
            } else {
                await generateOpenSCADMasks(props.image, settings);
            }
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
            description: "Standard 3D manufacturing format with separate material shapes for each color. Compatible with most 3D printing software.",
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Zip file containing monochrome images per color and an OpenSCAD file that combines them into a 3D display.",
        }
    ]
}));

const DimensionsGroup = (props: ThreeDDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="options-group">
            <label>
                Pixel Size:
                <input
                    type="number"
                    value={props.settings.pixelSize}
                    min="0.1"
                    step="0.1"
                    onChange={(e) => updateProp("threeD", "pixelSize", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                Height Per Layer:
                <input
                    type="number"
                    value={props.settings.heightPerLayer}
                    min="0.1"
                    step="0.1"
                    onChange={(e) => updateProp("threeD", "heightPerLayer", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                Base Height:
                <input
                    type="number"
                    value={props.settings.baseHeight}
                    min="0"
                    step="0.1"
                    onChange={(e) => updateProp("threeD", "baseHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Configure the physical dimensions of your 3D model. Pixel size determines the width/depth of each pixel,
            height per layer is the thickness of each color layer, and base height adds a foundation beneath the model.
        </span>
    </div>;
};

function makeRadioGroup<K extends keyof AppProps["threeD"]>(factory: OptionGroupFactory<K>) {
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
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values.filter(v => v.value === props.settings[p.key])[0]?.description}</span>
        </div>;
    };
}
