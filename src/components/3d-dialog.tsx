import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF } from '../3mf-generator';
import { generateOpenSCADMasks } from '../openscad-generator';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export type ThreeDProps = {
    format: '3mf' | 'openscad';
    heightPerLayer: number;
};

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

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <HeightGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => generate3D()}>Generate 3D</button>
        </div>
    </div>;

    function generate3D() {
        const filename = props.filename.replace(".png", "");
        
        window.clarity?.("event", "3d-export");
        
        if (props.settings.format === '3mf') {
            generate3MF(props.image, filename, props.settings.heightPerLayer);
        } else {
            generateOpenSCADMasks(props.image, filename, props.settings.heightPerLayer);
        }
        
        updateProp("ui", "is3DOpen", false);
    }
}

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format" as const,
    values: [
        {
            value: '3mf' as const,
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate materials per color. Compatible with most 3D slicers.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: 'openscad' as const,
            title: "OpenSCAD Masks",
            description: "ZIP file with heightmap images and OpenSCAD file for procedural 3D generation.",
            icon: <span class="format-icon">📦</span>,
        },
    ]
}));

const HeightGroup = makeRadioGroup(() => ({
    key: "heightPerLayer" as const,
    title: "Height per Layer (mm)",
    values: [
        {
            title: "0.5mm",
            value: 0.5,
            description: "Thin layers, more detail",
            icon: <span class="height-icon">─</span>
        },
        {
            title: "1.0mm",
            value: 1.0,
            description: "Standard thickness",
            icon: <span class="height-icon">━</span>
        },
        {
            title: "2.0mm",
            value: 2.0,
            description: "Thick layers, faster print",
            icon: <span class="height-icon">▬</span>
        },
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
