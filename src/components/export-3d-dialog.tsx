import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../export-3d';
import { PropContext } from './context';

export interface Export3DDialogProps {
    image: PartListImage;
    settings: Export3DProps;
    filename: string;
}

export interface Export3DProps {
    format: Export3DFormat;
    pixelHeight: number;
    pixelSize: number;
}

export function Export3DDialog(props: Export3DDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    
    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup {...props} />
                <PixelSizeGroup {...props} />
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>
                    Cancel
                </button>
                <button class="print" onClick={() => performExport()}>
                    Export 3D
                </button>
            </div>
        </div>
    );
    
    function performExport(): void {
        const settings: Export3DSettings = {
            format: props.settings.format,
            filename: props.filename.replace(/\.(png|jpg|jpeg)$/i, ""),
            pixelHeight: props.settings.pixelHeight,
            pixelSize: props.settings.pixelSize
        };
        
        window.clarity?.("event", "export-3d", props.settings.format);
        export3D(props.image, settings);
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
};

const FormatGroup = makeRadioGroup(() => ({
    title: "Format",
    key: "format",
    values: [
        {
            value: "3mf",
            title: "3MF Mesh",
            description: "3D Manufacturing Format with separate colored shapes. Compatible with most 3D printing software.",
            icon: <span class="format-icon">📐</span>
        },
        {
            value: "openscad-masks",
            title: "OpenSCAD Masks",
            description: "ZIP file with black/white masks and OpenSCAD file for programmatic 3D modeling.",
            icon: <span class="format-icon">🎭</span>
        }
    ]
}));

const PixelSizeGroup = makeRadioGroup(() => ({
    title: "Pixel Dimensions",
    key: "pixelSize",
    values: [
        {
            value: 5,
            title: "5mm",
            description: "Small pixels (5mm × 5mm × 2mm) - suitable for detailed models",
            icon: <span class="size-icon">S</span>
        },
        {
            value: 10,
            title: "10mm",
            description: "Medium pixels (10mm × 10mm × 3mm) - good balance",
            icon: <span class="size-icon">M</span>
        },
        {
            value: 20,
            title: "20mm",
            description: "Large pixels (20mm × 20mm × 5mm) - easier to print",
            icon: <span class="size-icon">L</span>
        }
    ]
}));

function makeRadioGroup<K extends keyof Export3DProps>(factory: OptionGroupFactory<K>) {
    return function (props: Export3DDialogProps): JSX.Element {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        // Determine pixel height based on pixel size
        const getPixelHeight = (size: number): number => {
            if (size === 5) return 2;
            if (size === 10) return 3;
            if (size === 20) return 5;
            return 3;
        };
        
        return (
            <div class="print-setting-group">
                <h1>{p.title}</h1>
                <div class="print-setting-group-options">
                    {p.values.map((v) => (
                        <label key={String(v.value)}>
                            <input
                                type="radio"
                                name={p.key}
                                checked={v.value === props.settings[p.key]}
                                onChange={() => {
                                    updateProp("export3d", p.key, v.value);
                                    // Also update pixel height when pixel size changes
                                    if (p.key === "pixelSize" && typeof v.value === "number") {
                                        updateProp("export3d", "pixelHeight", getPixelHeight(v.value));
                                    }
                                }}
                            />
                            <div class="option">
                                <h3>{v.title}</h3>
                                {v.icon}
                            </div>
                        </label>
                    ))}
                </div>
                <span class="description">
                    {p.values.filter((v) => v.value === props.settings[p.key])[0]?.description}
                </span>
            </div>
        );
    };
}
