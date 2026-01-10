import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3D, Export3DFormat, Export3DSettings } from '../3d-generator';
import { PropContext } from './context';

export interface Export3DDialogProps {
    image: PartListImage;
    pitch: number;
    filename: string;
}

export function Export3DDialog(props: Export3DDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<Export3DFormat>('3mf');
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} onFormatChange={setFormat} />
            <SettingsGroup />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DExportOpen", false)}>Cancel</button>
            <button class="print" onClick={() => doExport()}>Export 3D</button>
        </div>
    </div>;

    function doExport() {
        const settings: Export3DSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            pitch: props.pitch,
            height: props.pitch
        };

        window.clarity?.("event", "export-3d");
        export3D(props.image, settings);
    }
}

interface FormatGroupProps {
    format: Export3DFormat;
    onFormatChange: (format: Export3DFormat) => void;
}

const FormatGroup = ({ format, onFormatChange }: FormatGroupProps) => {
    const values = [
        {
            value: "3mf" as Export3DFormat,
            title: "3MF",
            description: "3D Manufacturing Format - Triangle mesh with separate material shapes for each color. Compatible with most 3D software.",
            icon: <span class="format-icon">🔺</span>,
        },
        {
            value: "openscad" as Export3DFormat,
            title: "OpenSCAD",
            description: "OpenSCAD masks format - ZIP file with monochrome images and .scad file that combines them into a 3D display.",
            icon: <span class="format-icon">📦</span>,
        }
    ];
    
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            {values.map(v => <label>
                <input type="radio"
                    name="format"
                    checked={v.value === format}
                    onChange={() => onFormatChange(v.value)} />
                <div class="option">
                    <h3>{v.title}</h3>
                    {v.icon}
                </div>
            </label>)}
        </div>
        <span class="description">{values.filter(v => v.value === format)[0]?.description}</span>
    </div>;
};

const SettingsGroup = () => {
    return <div class="print-setting-group">
        <h1>Settings</h1>
        <div class="print-setting-group-options">
            <p>The 3D export will use your current material size setting to determine pixel dimensions.</p>
            <p>Each pixel will be extruded to create a 3D voxel, with different colors as separate layers/objects.</p>
        </div>
    </div>;
};
