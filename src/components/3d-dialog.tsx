import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';
import { Export3DFormat, generate3MF, generateOpenSCADMasks } from '../3d-export';

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: ThreeDProps;
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    
    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup {...props} />
                <PixelHeightGroup {...props} />
                <PixelSizeGroup {...props} />
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp('ui', 'is3DOpen', false)}>
                    Cancel
                </button>
                <button class="print" onClick={() => exportModel()}>
                    Export 3D
                </button>
            </div>
        </div>
    );

    function exportModel() {
        const settings = {
            format: props.settings.format,
            pixelHeight: props.settings.pixelHeight,
            pixelSize: props.settings.pixelSize
        };

        window.clarity?.('event', 'export-3d', settings.format);

        if (settings.format === '3mf') {
            const blob = generate3MF(props.image, settings);
            downloadBlob(blob, `${props.filename.replace(/\.(png|jpg|jpeg)$/i, '')}.3mf`);
        } else if (settings.format === 'openscad') {
            generateOpenSCADMasks(props.image, settings).then(blob => {
                downloadBlob(blob, `${props.filename.replace(/\.(png|jpg|jpeg)$/i, '')}.scad`);
            });
        }
    }
}

function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

type OptionGroupFactory<K extends keyof AppProps['threeD']> = (props: ThreeDDialogProps) => {
    title: string | JSX.Element;
    key: K;
    values: ReadonlyArray<{
        value: AppProps['threeD'][K];
        title: string | JSX.Element;
        icon: JSX.Element;
        description: string | JSX.Element;
    }>;
};

const FormatGroup = makeRadioGroup(() => ({
    title: 'Format',
    key: 'format',
    values: [
        {
            value: '3mf',
            title: '3MF Mesh',
            description: 'Triangle mesh with separate material shapes for each color. Compatible with 3D printers.',
            icon: <span class="format-icon">🔺</span>
        },
        {
            value: 'openscad',
            title: 'OpenSCAD Masks',
            description: 'Zip file with monochrome masks and OpenSCAD file using heightmap functionality.',
            icon: <span class="format-icon">📦</span>
        }
    ]
}));

const PixelHeightGroup = makeRadioGroup(() => ({
    key: 'pixelHeight',
    title: 'Pixel Height',
    values: [
        {
            title: '1mm',
            value: 1,
            description: 'Thin layers (1mm)',
            icon: <span class="height-icon">▁</span>
        },
        {
            title: '2mm',
            value: 2,
            description: 'Medium layers (2mm)',
            icon: <span class="height-icon">▂</span>
        },
        {
            title: '5mm',
            value: 5,
            description: 'Thick layers (5mm)',
            icon: <span class="height-icon">▄</span>
        }
    ]
}));

const PixelSizeGroup = makeRadioGroup(() => ({
    key: 'pixelSize',
    title: 'Pixel Size',
    values: [
        {
            title: '5mm',
            value: 5,
            description: 'Small pixels (5mm)',
            icon: <span class="size-icon">▪</span>
        },
        {
            title: '10mm',
            value: 10,
            description: 'Medium pixels (10mm)',
            icon: <span class="size-icon">◼</span>
        },
        {
            title: '20mm',
            value: 20,
            description: 'Large pixels (20mm)',
            icon: <span class="size-icon">⬛</span>
        }
    ]
}));

function makeRadioGroup<K extends keyof ThreeDProps>(factory: OptionGroupFactory<K>) {
    return function (props: ThreeDDialogProps) {
        const updateProp = useContext(PropContext);
        const p = factory(props);
        
        return (
            <div class="print-setting-group">
                <h1>{p.title}</h1>
                <div class="print-setting-group-options">
                    {p.values.map(v => (
                        <label key={String(v.value)}>
                            <input
                                type="radio"
                                name={p.key}
                                checked={v.value === props.settings[p.key]}
                                onChange={() => {
                                    updateProp('threeD', p.key, v.value);
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
                    {p.values.filter(v => v.value === props.settings[p.key])[0]?.description}
                </span>
            </div>
        );
    };
}
