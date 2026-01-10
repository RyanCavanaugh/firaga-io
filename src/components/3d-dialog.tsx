import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3D, ThreeDFormat, ThreeDSettings } from '../3d-generator';
import { ThreeDProps } from '../types';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={exportModel}>Export 3D</button>
        </div>
    </div>;
    
    function exportModel() {
        const settings: ThreeDSettings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            baseHeight: props.settings.baseHeight,
        };
        
        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

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

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf" as const,
            title: "3MF",
            description: "Industry standard 3D Manufacturing Format with separate colored shapes. Compatible with most 3D printers and slicers.",
            icon: <span class="format-3mf">📦</span>,
        },
        {
            value: "openscad-masks" as const,
            title: "OpenSCAD Masks",
            description: "ZIP file with mask images and OpenSCAD file. Each color is a separate heightmap for advanced customization.",
            icon: <span class="format-openscad">🎨</span>,
        },
    ]
}));

const DimensionsGroup = function(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="print-setting-group-options">
            <label>
                <span>Pixel Height (mm)</span>
                <input 
                    type="number" 
                    min="0.1" 
                    max="10" 
                    step="0.1"
                    value={props.settings.pixelHeight}
                    onChange={(e) => updateProp("3d", "pixelHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Height (mm)</span>
                <input 
                    type="number" 
                    min="0" 
                    max="10" 
                    step="0.1"
                    value={props.settings.baseHeight}
                    onChange={(e) => updateProp("3d", "baseHeight", parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Pixel height is the thickness of each colored layer. Base height is an optional foundation layer.
        </span>
    </div>;
};

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
                            updateProp("3d", p.key, v.value);
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
