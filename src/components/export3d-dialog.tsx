import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useRef, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, Export3DProps } from '../types';
import { PropContext } from './context';
import { generate3MF } from '../exporters/3mf-generator';
import { generateOpenSCADMasks } from '../exporters/openscad-masks-generator';

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <ParametersGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => exportModel()}>Export 3D</button>
        </div>
    </div>;

    function exportModel() {
        const filename = props.filename.replace(".png", "");
        
        window.clarity?.("event", "export-3d");
        
        if (props.settings.format === "3mf") {
            generate3MF(props.image, filename, props.settings);
        } else {
            generateOpenSCADMasks(props.image, filename, props.settings);
        }
        
        updateProp("ui", "is3DExportOpen", false);
    }
}

type OptionGroupFactory<K extends keyof AppProps["export3d"]> = (props: Export3DDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["export3d"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

export type Export3DDialogProps = {
    image: PartListImage;
    settings: Export3DProps;
    filename: string;
};

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format triangle mesh with separate material shapes for each color. Standard industry format for 3D printing.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "Zip file with monochrome (black/white) images per color and OpenSCAD file that combines them into a 3D display.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const ParametersGroup = function (props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    return <div class="print-setting-group">
        <h1>3D Parameters</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Pixel Width (mm):</span>
                <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    step="0.5"
                    value={props.settings.pixelWidth}
                    onChange={(e) => updateProp("export3d", "pixelWidth", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Pixel Height (mm):</span>
                <input 
                    type="number" 
                    min="1" 
                    max="100" 
                    step="0.5"
                    value={props.settings.pixelHeight}
                    onChange={(e) => updateProp("export3d", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Layer Height (mm):</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="50" 
                    step="0.1"
                    value={props.settings.layerHeight}
                    onChange={(e) => updateProp("export3d", "layerHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Configure the physical dimensions of each pixel in the 3D model.
        </span>
    </div>;
};

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
