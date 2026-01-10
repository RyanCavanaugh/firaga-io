import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../threed-3mf';
import { generateOpenSCADMasks } from '../threed-openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => download()}>Download</button>
        </div>
    </div>;

    function download() {
        if (props.settings.format === "3mf") {
            window.clarity?.("event", "download-3mf");
            generate3MF(props.image, props.filename.replace(".png", ""));
        } else {
            window.clarity?.("event", "download-openscad");
            generateOpenSCADMasks(props.image, props.filename.replace(".png", ""));
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export type ThreeDProps = {
    format: "3mf" | "openscad-masks";
};

type OptionGroupFactory = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: keyof ThreeDProps;
    values: ReadonlyArray<{
        value: ThreeDProps["format"];
        title: string | JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(({}) => ({
    title: "3D Format",
    key: "format" as const,
    values: [
        {
            value: "3mf" as const,
            title: "3MF Triangle Mesh",
            description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D printing software.",
        },
        {
            value: "openscad-masks" as const,
            title: "OpenSCAD Masks",
            description: "ZIP file with monochrome images per color and an OpenSCAD file that combines them into a 3D display.",
        },
    ]
}));

function makeRadioGroup(factory: OptionGroupFactory) {
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
                    </div>
                </label>)}
            </div>
            <span class="description">{p.values.filter(v => v.value === props.settings[p.key])[0]?.description}</span>
        </div>;
    };
}
