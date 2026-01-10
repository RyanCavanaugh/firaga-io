import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { PropContext } from './context';
import { export3MF, exportOpenScadMasks } from '../3d-exporters';

export type ThreeDProps = {
    format: '3mf' | 'openscad-masks';
    pixelHeight: number;
    baseThickness: number;
};

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
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
            <button 
                class="print" 
                onClick={() => exportModel()}
                disabled={isExporting}
            >
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            window.clarity?.("event", "3d-export");
            
            const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, "");
            
            if (props.settings.format === '3mf') {
                await export3MF(props.image, {
                    pixelHeight: props.settings.pixelHeight,
                    baseThickness: props.settings.baseThickness,
                    filename
                });
            } else {
                await exportOpenScadMasks(props.image, {
                    pixelHeight: props.settings.pixelHeight,
                    baseThickness: props.settings.baseThickness,
                    filename
                });
            }
        } finally {
            setIsExporting(false);
        }
    }
}

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
        title: string | JSX.Element;
        description: string | JSX.Element;
    }>;
}

const FormatGroup = makeRadioGroup(({ image }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf" as const,
            title: "3MF Triangle Mesh",
            description: "Standard 3D manufacturing format with separate colored shapes. Compatible with most 3D printing software.",
        },
        {
            value: "openscad-masks" as const,
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white heightmap images and OpenSCAD file for customizable 3D rendering.",
        }
    ]
}));

const DimensionsGroup = (props: ThreeDDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="print-setting-group-options">
            <label>
                Pixel Height (mm):
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.settings.pixelHeight}
                    onChange={(e) => updateProp("3d", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                Base Thickness (mm):
                <input 
                    type="number" 
                    min="0" 
                    max="10" 
                    step="0.1"
                    value={props.settings.baseThickness}
                    onChange={(e) => updateProp("3d", "baseThickness", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
    </div>;
};

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
                            updateProp("3d", p.key, v.value);
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
