import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { generate3MF, ThreeDSettings } from '../threed-generator-3mf';
import { generateOpenSCADMasks, OpenSCADMasksSettings } from '../threed-generator-openscad';
import * as fileSaver from 'file-saver';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [isExporting, setIsExporting] = useState(false);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup {...props} />
            <DimensionsGroup {...props} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={() => exportModel()}
                disabled={isExporting}
            >
                {isExporting ? 'Exporting...' : 'Export 3D'}
            </button>
        </div>
    </div>;

    async function exportModel() {
        setIsExporting(true);
        try {
            const settings = props.settings;
            const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, '');
            
            if (settings.format === '3mf') {
                const threeDSettings: ThreeDSettings = {
                    format: '3mf',
                    pixelHeight: settings.pixelHeight,
                    baseHeight: settings.baseHeight
                };
                const blob = generate3MF(props.image, threeDSettings);
                fileSaver.saveAs(blob, `${filename}.3mf.txt`);
            } else if (settings.format === 'openscad-masks') {
                const openscadSettings: OpenSCADMasksSettings = {
                    pixelHeight: settings.pixelHeight,
                    baseHeight: settings.baseHeight,
                    imageScale: settings.imageScale
                };
                const blob = await generateOpenSCADMasks(props.image, openscadSettings);
                fileSaver.saveAs(blob, `${filename}_openscad.zip`);
            }
            
            window.clarity?.("event", "export-3d", settings.format);
            updateProp("ui", "is3DOpen", false);
        } catch (error) {
            console.error('Failed to export 3D model:', error);
            alert('Failed to export 3D model. See console for details.');
        } finally {
            setIsExporting(false);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

type OptionGroupFactory<K extends keyof AppProps["threed"]> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps["threed"][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
}

const FormatGroup = makeRadioGroup(({ }) => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Triangle Mesh",
            description: "Industry standard 3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D slicing software.",
            icon: <span class="format-icon">📐</span>,
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file containing black/white PNG masks per color and an OpenSCAD file that combines them using heightmap functionality.",
            icon: <span class="format-icon">🗂️</span>,
        }
    ]
}));

const DimensionsGroup = makeSliderGroup(() => ({
    title: "Dimensions",
    sliders: [
        {
            key: "pixelHeight",
            label: "Pixel Height (mm)",
            min: 0.5,
            max: 10,
            step: 0.5,
            description: "Height of each colored pixel layer"
        },
        {
            key: "baseHeight",
            label: "Base Height (mm)",
            min: 0,
            max: 10,
            step: 0.5,
            description: "Height of the base layer beneath the image"
        },
        {
            key: "imageScale",
            label: "Image Scale",
            min: 0.1,
            max: 5,
            step: 0.1,
            description: "Scale factor for the overall image size (mm per pixel)"
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="print-setting-group-options">
                {p.values.map(v => <label key={String(v.value)}>
                    <input type="radio"
                        name={p.key}
                        checked={v.value === props.settings[p.key]}
                        onChange={() => {
                            updateProp("threed", p.key, v.value);
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

function makeSliderGroup(factory: (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    sliders: Array<{
        key: keyof ThreeDProps;
        label: string;
        min: number;
        max: number;
        step: number;
        description: string;
    }>;
}) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return <div class="print-setting-group">
            <h1>{p.title}</h1>
            <div class="slider-group">
                {p.sliders.map(slider => {
                    const value = props.settings[slider.key] as number;
                    return <div key={slider.key} class="slider-container">
                        <label class="slider-label">
                            {slider.label}: <strong>{value}</strong>
                        </label>
                        <input
                            type="range"
                            min={slider.min}
                            max={slider.max}
                            step={slider.step}
                            value={value}
                            onChange={(e) => {
                                const target = e.target as HTMLInputElement;
                                updateProp("threed", slider.key, parseFloat(target.value));
                            }}
                            class="slider"
                        />
                        <span class="slider-description">{slider.description}</span>
                    </div>;
                })}
            </div>
        </div>;
    };
}
