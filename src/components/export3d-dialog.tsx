import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3d, Export3dFormat, Export3dSettings } from '../3d-export';
import { PropContext } from './context';

export type Export3dDialogProps = {
    image: PartListImage;
    filename: string;
};

export function Export3dDialog(props: Export3dDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3dFormat>('3mf');
    const [heightPerLayer, setHeightPerLayer] = useState(1.0);
    const [baseThickness, setBaseThickness] = useState(2.0);
    const [pixelSize, setPixelSize] = useState(5.0);

    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup format={format} onFormatChange={setFormat} />
                <ParametersGroup
                    heightPerLayer={heightPerLayer}
                    baseThickness={baseThickness}
                    pixelSize={pixelSize}
                    onHeightChange={setHeightPerLayer}
                    onBaseChange={setBaseThickness}
                    onPixelSizeChange={setPixelSize}
                />
            </div>
            <div class="print-buttons">
                <button
                    class="cancel"
                    onClick={() => updateProp("ui", "is3dExportOpen", false)}
                >
                    Cancel
                </button>
                <button
                    class="print"
                    onClick={() => handleExport()}
                >
                    Export 3D
                </button>
            </div>
        </div>
    );

    function handleExport(): void {
        const settings: Export3dSettings = {
            format,
            heightPerLayer,
            baseThickness,
            pixelSize,
        };

        window.clarity?.("event", "3d-export", format);
        export3d(props.image, settings, props.filename.replace(/\.(png|jpg|jpeg)$/i, ''));
    }
}

function FormatGroup(props: {
    format: Export3dFormat;
    onFormatChange: (format: Export3dFormat) => void;
}): JSX.Element {
    const formats: Array<{
        value: Export3dFormat;
        title: string;
        description: string;
        icon: JSX.Element;
    }> = [
        {
            value: '3mf',
            title: '3MF Mesh',
            description: 'Standard 3MF file with separate colored shapes for each bead color. Compatible with most 3D printing software.',
            icon: <span class="format-icon">🧊</span>,
        },
        {
            value: 'openscad-masks',
            title: 'OpenSCAD Masks',
            description: 'Generates monochrome mask images and an OpenSCAD script. Useful for customization and parametric designs.',
            icon: <span class="format-icon">📐</span>,
        },
    ];

    return (
        <div class="print-setting-group">
            <h1>Format</h1>
            <div class="print-setting-group-options">
                {formats.map(f => (
                    <label key={f.value}>
                        <input
                            type="radio"
                            name="format"
                            checked={f.value === props.format}
                            onChange={() => props.onFormatChange(f.value)}
                        />
                        <div class="option">
                            <h3>{f.title}</h3>
                            {f.icon}
                        </div>
                    </label>
                ))}
            </div>
            <span class="description">
                {formats.find(f => f.value === props.format)?.description}
            </span>
        </div>
    );
}

function ParametersGroup(props: {
    heightPerLayer: number;
    baseThickness: number;
    pixelSize: number;
    onHeightChange: (value: number) => void;
    onBaseChange: (value: number) => void;
    onPixelSizeChange: (value: number) => void;
}): JSX.Element {
    return (
        <div class="print-setting-group">
            <h1>3D Parameters (mm)</h1>
            <div class="parameters-group">
                <label>
                    <span class="param-label">Pixel Size:</span>
                    <input
                        type="number"
                        min="0.1"
                        max="50"
                        step="0.1"
                        value={props.pixelSize}
                        onChange={(e) => props.onPixelSizeChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span class="param-unit">mm</span>
                </label>
                <label>
                    <span class="param-label">Height Per Layer:</span>
                    <input
                        type="number"
                        min="0.1"
                        max="20"
                        step="0.1"
                        value={props.heightPerLayer}
                        onChange={(e) => props.onHeightChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span class="param-unit">mm</span>
                </label>
                <label>
                    <span class="param-label">Base Thickness:</span>
                    <input
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={props.baseThickness}
                        onChange={(e) => props.onBaseChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                    <span class="param-unit">mm</span>
                </label>
            </div>
            <span class="description">
                Pixel size determines the width of each bead in the 3D model.
                Height per layer is the thickness of each colored layer.
                Base thickness is the bottom support layer.
            </span>
        </div>
    );
}
