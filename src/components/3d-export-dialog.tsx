import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeMFSettings } from '../3mf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export function ThreeDExportDialog(props: ThreeDExportDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel(): void {
        const baseFilename = props.filename.replace(/\.(png|jpg|jpeg|gif|webp)$/i, '');
        
        if (props.settings.format === '3mf') {
            const settings: ThreeMFSettings = {
                pixelWidth: 2.5,
                pixelHeight: 2.5,
                pixelDepth: 2.5,
                filename: baseFilename
            };
            
            window.clarity?.("event", "export-3mf");
            const blob = generate3MF(props.image, settings);
            downloadBlob(blob, `${baseFilename}.3mf`);
        } else {
            const settings: OpenSCADSettings = {
                pixelWidth: 2.5,
                pixelHeight: 2.5,
                maxHeight: 2.5,
                filename: baseFilename
            };
            
            window.clarity?.("event", "export-openscad");
            const blob = generateOpenSCADMasks(props.image, settings);
            downloadBlob(blob, `${baseFilename}_openscad.zip`);
        }
    }
}

type OptionGroupFactory<K extends keyof AppProps["threeD"]> = (props: ThreeDExportDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threeD"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type ThreeDExportDialogProps = {
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
            description: "Triangle mesh with separate material shapes for each color. Standard 3D manufacturing format compatible with most 3D printers and slicers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "ZIP file containing monochrome mask images (one per color) and an OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">📦</span>,
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>): (props: ThreeDExportDialogProps) => JSX.Element {
    return function (props: ThreeDExportDialogProps): JSX.Element {
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

function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
