import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { Export3DProps } from '../types';
import { PropContext } from './context';
import { generate3mf } from '../threemf-generator';
import { generateOpenScadMasks } from '../openscad-generator';

export type Export3DDialogProps = {
    image: PartListImage;
    settings: Export3DProps;
    filename: string;
};

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <LayerHeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const filename = props.filename.replace(/\.(png|jpe?g)$/i, '');
        
        window.clarity?.("event", "export-3d");
        
        if (props.settings.format === '3mf') {
            generate3mf(props.image, {
                layerHeight: props.settings.layerHeight,
                filename
            });
        } else {
            generateOpenScadMasks(props.image, {
                layerHeight: props.settings.layerHeight,
                filename
            });
        }
    }
}

type OptionGroupFactory<K extends keyof Export3DProps> = (props: Export3DDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: Export3DProps[K];
        title: string | JSX.Element;
        icon: JSX.Element;
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
            description: "Industry standard 3D manufacturing format with separate material shapes for each color",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file containing black/white mask images and an OpenSCAD file for 3D rendering",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const LayerHeightGroup = makeRadioGroup(() => ({
    key: "layerHeight",
    title: "Layer Height (mm)",
    values: [
        {
            title: "0.5mm",
            value: 0.5,
            description: "Thin layers, more detail",
            icon: <span class="height-icon">▁</span>
        },
        {
            title: "1mm",
            value: 1,
            description: "Standard layer height",
            icon: <span class="height-icon">▂</span>
        },
        {
            title: "2mm",
            value: 2,
            description: "Thicker layers, faster print",
            icon: <span class="height-icon">▃</span>
        },
    ]
}));

function makeRadioGroup<K extends keyof Export3DProps>(factory: OptionGroupFactory<K>) {
    return function (props: Export3DDialogProps) {
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
                            updateProp("export3d", p.key, v.value);
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
