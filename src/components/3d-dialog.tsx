import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF, generateOpenSCADMasks } from '../3d-generator';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;

    function export3D() {
        window.clarity?.("event", "export-3d");
        if (props.settings.format === "3mf") {
            generate3MF(props.image, props.filename);
        } else {
            generateOpenSCADMasks(props.image, props.filename);
        }
        updateProp("ui", "is3DOpen", false);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export type ThreeDProps = {
    format: "3mf" | "openscad";
};

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDProps[K];
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
            description: "Export as 3MF file with separate material shapes for each color. Industry standard 3D printing format.",
        },
        {
            value: "openscad",
            title: "OpenSCAD Masks",
            description: "Export as ZIP file containing monochrome images (one per color) and an OpenSCAD file for 3D rendering.",
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const group = factory(props);

        return <div class="print-option-group">
            <div class="print-option-title">{group.title}</div>
            <div class="print-option-values">
                {group.values.map(v => {
                    const isSelected = props.settings[group.key] === v.value;
                    return <div class={`print-option ${isSelected ? "selected" : ""}`} onClick={() => updateProp("threeD", group.key, v.value)}>
                        <div class="print-option-inner">
                            <div class="print-option-header">
                                <div class="print-option-icon">
                                    <input type="radio" checked={isSelected} />
                                </div>
                                <div class="print-option-text">
                                    <div class="print-option-value-title">{v.title}</div>
                                </div>
                            </div>
                            <div class="print-option-description">{v.description}</div>
                        </div>
                    </div>;
                })}
            </div>
        </div>;
    }
}
