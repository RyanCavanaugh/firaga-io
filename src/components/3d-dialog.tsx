import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { generate3D, ThreeDSettings } from '../3d-generator';
import { PartListImage } from '../image-utils';
import { PropContext } from './context';

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

type FormatType = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<FormatType>('3mf');
    const [pixelWidth, setPixelWidth] = useState(2.5);
    const [pixelHeight, setPixelHeight] = useState(2.5);
    const [baseThickness, setBaseThickness] = useState(2);

    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <DimensionsGroup
                pixelWidth={pixelWidth}
                setPixelWidth={setPixelWidth}
                pixelHeight={pixelHeight}
                setPixelHeight={setPixelHeight}
                baseThickness={baseThickness}
                setBaseThickness={setBaseThickness}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => handleExport()}>Export 3D</button>
        </div>
    </div>;

    async function handleExport() {
        const settings: ThreeDSettings = {
            format,
            pixelWidth,
            pixelHeight,
            baseThickness,
            filename: props.filename.replace(".png", "")
        };

        window.clarity?.("event", "export-3d");
        await generate3D(props.image, settings);
    }
}

function FormatGroup({ format, setFormat }: { format: FormatType; setFormat: (f: FormatType) => void }) {
    const values: Array<{
        value: FormatType;
        title: string;
        icon: JSX.Element;
        description: string;
    }> = [
        {
            value: '3mf',
            title: '3MF',
            description: '3D Manufacturing Format - Standard industry format with separate material shapes for each color. Compatible with most 3D slicers.',
            icon: <span class="format-icon">📦</span>
        },
        {
            value: 'openscad',
            title: 'OpenSCAD',
            description: 'ZIP file containing monochrome mask images and an OpenSCAD script that loads them as heightmaps to create a 3D display.',
            icon: <span class="format-icon">🗜️</span>
        }
    ];

    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            {values.map(v => <label>
                <input type="radio"
                    name="format"
                    checked={v.value === format}
                    onChange={() => setFormat(v.value)} />
                <div class="option">
                    <h3>{v.title}</h3>
                    {v.icon}
                </div>
            </label>)}
        </div>
        <span class="description">{values.find(v => v.value === format)?.description}</span>
    </div>;
}

function DimensionsGroup({
    pixelWidth,
    setPixelWidth,
    pixelHeight,
    setPixelHeight,
    baseThickness,
    setBaseThickness
}: {
    pixelWidth: number;
    setPixelWidth: (v: number) => void;
    pixelHeight: number;
    setPixelHeight: (v: number) => void;
    baseThickness: number;
    setBaseThickness: (v: number) => void;
}) {
    return <div class="print-setting-group">
        <h1>Dimensions (mm)</h1>
        <div class="dimensions-inputs">
            <label>
                <span>Pixel Width:</span>
                <input
                    type="number"
                    value={pixelWidth}
                    min={0.1}
                    step={0.1}
                    onChange={(e) => setPixelWidth(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Pixel Height:</span>
                <input
                    type="number"
                    value={pixelHeight}
                    min={0.1}
                    step={0.1}
                    onChange={(e) => setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
            <label>
                <span>Base Thickness:</span>
                <input
                    type="number"
                    value={baseThickness}
                    min={0.1}
                    step={0.1}
                    onChange={(e) => setBaseThickness(parseFloat((e.target as HTMLInputElement).value))}
                />
            </label>
        </div>
        <span class="description">
            Physical dimensions for each pixel in the 3D model. Default values are suitable for 2.5mm Perler beads.
        </span>
    </div>;
}
