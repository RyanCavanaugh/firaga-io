import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../3d-export';
import { ThreeDExportProps } from '../types';
import { PropContext } from './context';

export function ThreeDExportDialog(props: ThreeDExportDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <BeadDimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format: props.settings.format,
            filename: props.filename.replace(".png", ""),
            beadHeight: props.settings.beadHeight,
            beadDiameter: props.settings.beadDiameter,
        };

        window.clarity?.("event", "3d-export");
        export3D(props.image, settings);
        updateProp("ui", "is3DExportOpen", false);
    }
}

export type ThreeDExportDialogProps = {
    image: PartListImage;
    filename: string;
    settings: ThreeDExportProps;
};

type OptionGroupFactory<K extends keyof ThreeDExportProps> = (props: ThreeDExportDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: ThreeDExportProps[K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

const FormatGroup = makeRadioGroup(() => ({
    title: "3D Format",
    key: "format",
    values: [
        {
            value: "3mf" as const,
            title: "3MF Mesh",
            description: "Industry standard 3D manufacturing format with separate material shapes for each color. Can be imported into most 3D printing and modeling software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks" as const,
            title: "OpenSCAD Masks",
            description: "Zip file containing monochrome images per color and an OpenSCAD file that combines them using heightmap functionality.",
            icon: <span class="format-icon">🎭</span>,
        }
    ]
}));

const BeadDimensionsGroup = (props: ThreeDExportDialogProps) => {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Bead Dimensions</h1>
        <div class="dimension-inputs">
            <label>
                <span>Diameter (mm):</span>
                <input 
                    type="number" 
                    value={props.settings.beadDiameter} 
                    min="1" 
                    max="50" 
                    step="0.1"
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement;
                        const value = parseFloat(target.value);
                        if (!isNaN(value)) {
                            updateProp("threeDExport", "beadDiameter", value);
                        }
                    }} 
                />
            </label>
            <label>
                <span>Height (mm):</span>
                <input 
                    type="number" 
                    value={props.settings.beadHeight} 
                    min="0.1" 
                    max="50" 
                    step="0.1"
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement;
                        const value = parseFloat(target.value);
                        if (!isNaN(value)) {
                            updateProp("threeDExport", "beadHeight", value);
                        }
                    }} 
                />
            </label>
        </div>
        <span class="description">Set the physical dimensions for each bead in millimeters. Default: 5mm diameter, 5mm height (Perler beads).</span>
    </div>;
};

function makeRadioGroup<K extends keyof ThreeDExportProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDExportDialogProps) {
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
                            updateProp("threeDExport", p.key, v.value);
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

