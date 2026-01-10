import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF, ThreeMFSettings } from '../threemf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <SizeGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={exportModel} disabled={isExporting}>
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            const settings: ThreeMFSettings & OpenSCADSettings = {
                pixelSize: props.settings.pixelSize,
                heightPerColor: props.settings.heightPerColor,
                baseHeight: props.settings.baseHeight
            };

            window.clarity?.("event", "export-3d");
            
            let blob: Blob;
            let filename: string;
            
            if (props.settings.format === '3mf') {
                blob = generate3MF(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '.3mf');
            } else {
                blob = await generateOpenSCADMasks(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '_openscad.zip');
            }
            
            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            updateProp("ui", "is3DOpen", false);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Export failed: ' + error.message);
        } finally {
            setIsExporting(false);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["threed"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threed"][K];
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
            description: "3D Manufacturing Format - industry standard triangle mesh with separate materials per color. Compatible with most 3D slicers.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD",
            description: "ZIP archive with mask images and OpenSCAD script. Allows customization and uses surface heightmaps.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

const SizeGroup = makeRadioGroup(() => ({
    key: "pixelSize",
    title: "Pixel Size",
    values: [
        {
            title: "2.5mm",
            value: 2.5,
            description: "Small - compact models",
            icon: <span class="size-icon">S</span>
        },
        {
            title: "5mm",
            value: 5,
            description: "Medium - standard size",
            icon: <span class="size-icon">M</span>
        },
        {
            title: "10mm",
            value: 10,
            description: "Large - easier to print",
            icon: <span class="size-icon">L</span>
        }
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "heightPerColor",
    title: "Layer Height",
    values: [
        {
            title: "0.5mm",
            value: 0.5,
            description: "Minimal height - flat relief",
            icon: <span class="height-icon">─</span>
        },
        {
            title: "1mm",
            value: 1,
            description: "Standard height",
            icon: <span class="height-icon">▬</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Thick - pronounced 3D effect",
            icon: <span class="height-icon">█</span>
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
                {p.values.map(v => <label>
                    <input type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => {
                            updateProp("threed", p.key, v.value);
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
