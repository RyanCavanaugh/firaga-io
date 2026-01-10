import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../export-3mf';
import { generateOpenSCADMasks } from '../export-openscad';

declare const saveAs: typeof import("file-saver").saveAs;

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState<string | undefined>(undefined);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
            <BaseThicknessGroup {...props} />
        </div>
        <div class="print-buttons">
            {error && <div class="error-message">{error}</div>}
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
        setError(undefined);
        
        try {
            const settings = {
                height: props.settings.pixelHeight,
                baseThickness: props.settings.baseThickness,
                pixelHeight: props.settings.pixelHeight
            };

            let blob: Blob;
            let filename: string;

            if (props.settings.format === '3mf') {
                blob = await generate3MF(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '.3mf';
            } else {
                blob = await generateOpenSCADMasks(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '_openscad.zip';
            }

            window.clarity?.("event", "export-3d", props.settings.format);
            
            // Load file-saver if not already loaded
            await loadFileSaver();
            saveAs(blob, filename);
            
            updateProp("ui", "is3DOpen", false);
        } catch (err) {
            console.error('Export failed:', err);
            setError(err instanceof Error ? err.message : 'Export failed');
        } finally {
            setIsExporting(false);
        }
    }
}

async function loadFileSaver(): Promise<void> {
    if (typeof saveAs !== 'undefined') {
        return;
    }
    
    const tagName = "filesaver-script-tag";
    const scriptEl = document.getElementById(tagName);
    if (scriptEl === null) {
        return new Promise<void>((resolve, reject) => {
            const tag = document.createElement("script");
            tag.id = tagName;
            tag.onload = () => resolve();
            tag.onerror = () => reject(new Error('Failed to load FileSaver'));
            tag.src = "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js";
            document.head.appendChild(tag);
        });
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
            title: "3MF Triangle Mesh",
            description: "Industry-standard 3D Manufacturing Format with separate materials per color. Compatible with most 3D printing software."
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome mask images and OpenSCAD script. Allows customization and parametric modifications."
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "pixelHeight",
    title: "Pixel Height",
    values: [
        {
            title: "0.5mm",
            value: 0.5,
            description: "Thin layers, faster printing"
        },
        {
            title: "1mm",
            value: 1,
            description: "Standard height"
        },
        {
            title: "2mm",
            value: 2,
            description: "Thicker, more pronounced 3D effect"
        },
        {
            title: "3mm",
            value: 3,
            description: "Very thick layers"
        }
    ]
}));

const BaseThicknessGroup = makeRadioGroup(() => ({
    key: "baseThickness",
    title: "Base Thickness",
    values: [
        {
            title: "None",
            value: 0,
            description: "No base plate"
        },
        {
            title: "0.5mm",
            value: 0.5,
            description: "Thin base"
        },
        {
            title: "1mm",
            value: 1,
            description: "Standard base"
        },
        {
            title: "2mm",
            value: 2,
            description: "Thick base for stability"
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
                {p.values.map(v => <label key={String(v.value)}>
                    <input type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => {
                            updateProp("threed", p.key, v.value);
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
