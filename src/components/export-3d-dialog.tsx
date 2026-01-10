import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { Export3DDialogProps } from '../export-3d-types';
import { download3MF } from '../export-3mf';
import { downloadOpenSCADMasks } from '../export-openscad';
import { PropContext } from './context';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog export-3d-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>
                Cancel
            </button>
            <button class="print" onClick={() => exportModel()}>
                Export 3D
            </button>
        </div>
    </div>;

    async function exportModel() {
        const settings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");

        if (settings.format === "3mf") {
            download3MF(props.image, settings);
        } else {
            await downloadOpenSCADMasks(props.image, settings);
        }

        updateProp("ui", "is3DExportOpen", false);
    }
}

type OptionGroupFactory<K extends keyof Export3DDialogProps["settings"]> = (
    props: Export3DDialogProps
) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: Export3DDialogProps["settings"][K];
        title: string | JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Standard 3D manufacturing format with separate material shapes for each color. Compatible with most 3D modeling software."
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Monochrome heightmap images for each color with an OpenSCAD file that combines them into a 3D model."
        }
    ]
}));

const DimensionsGroup = (props: Export3DDialogProps): JSX.Element => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="print-setting-group-options dimensions-inputs">
            <label>
                <span>Pixel Height</span>
                <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={props.settings.pixelHeight}
                    onChange={(e: any) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                            updateProp("export3d", "pixelHeight", value);
                        }
                    }}
                />
            </label>
            <label>
                <span>Base Height</span>
                <input
                    type="number"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={props.settings.baseHeight}
                    onChange={(e: any) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                            updateProp("export3d", "baseHeight", value);
                        }
                    }}
                />
            </label>
        </div>
        <span class="description">
            Pixel height: thickness of each colored layer. Base height: thickness of the base plate.
        </span>
    </div>;
};

function makeRadioGroup<K extends keyof Export3DDialogProps["settings"]>(
    factory: OptionGroupFactory<K>
) {
    return function (props: Export3DDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => (
                    <label key={String(v.value)}>
                        <input
                            type="radio"
                            name={p.key}
                            checked={v.value === props.settings[p.key]}
                            onChange={() => {
                                updateProp("export3d", p.key, v.value);
                            }}
                        />
                        <div class="option">
                            <h3>{v.title}</h3>
                        </div>
                    </label>
                ))}
            </div>
            <span class="description">
                {p.values.find(v => v.value === props.settings[p.key])?.description}
            </span>
        </div>;
    };
}
