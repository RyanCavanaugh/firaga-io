import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, generateOpenSCADMasks } from '../3d-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
        </div>
    </div>;
}

type OptionGroupFactory = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    values: ReadonlyArray<{
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
        action: () => void;
    }>;
};

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

const FormatGroup = makeRadioGroup(({ image, filename }) => ({
    title: "3D Format",
    values: [
        {
            title: "3MF Mesh",
            description: "Generate a 3MF file with triangle mesh and separate material shapes for each color. Standard industry format for 3D printing.",
            icon: <span class="format-icon">📐</span>,
            action: () => {
                generate3MF(image, filename);
            }
        },
        {
            title: "OpenSCAD Masks",
            description: "Generate a ZIP file with monochrome images (one per color) and an OpenSCAD file that combines them into a 3D model.",
            icon: <span class="format-icon">🔲</span>,
            action: () => {
                generateOpenSCADMasks(image, filename);
            }
        }
    ]
}));

function makeRadioGroup(factory: OptionGroupFactory) {
    return function (props: ThreeDDialogProps) {
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label>
                    <button onClick={v.action}>
                        <div class="option">
                            <h3>{v.title}</h3>
                            {v.icon}
                        </div>
                    </button>
                </label>)}
            </div>
            <span class="description">{p.values[0]?.description}</span>
        </div>;
    };
}
