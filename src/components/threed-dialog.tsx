import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { export3MF, Export3MFSettings } from '../export-3mf';
import { exportOpenSCADMasks, ExportOpenSCADSettings } from '../export-openscad';
import { PropContext } from './context';

export interface ThreeDDialogProps {
    image: PartListImage;
    filename: string;
}

type ExportFormat = '3mf' | 'openscad';

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<ExportFormat>('3mf');
    const [pixelSize, setPixelSize] = useState(2.5);
    const [baseThickness, setBaseThickness] = useState(2);
    const [heightPerColor, setHeightPerColor] = useState(0.5);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup 
                format={format}
                onFormatChange={setFormat}
            />
            
            <ParametersGroup 
                format={format}
                pixelSize={pixelSize}
                baseThickness={baseThickness}
                heightPerColor={heightPerColor}
                onPixelSizeChange={setPixelSize}
                onBaseThicknessChange={setBaseThickness}
                onHeightPerColorChange={setHeightPerColor}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => handleExport()}>Export 3D</button>
        </div>
    </div>;
    
    async function handleExport(): Promise<void> {
        const filename = props.filename.replace('.png', '');
        
        try {
            if (format === '3mf') {
                const settings: Export3MFSettings = {
                    filename,
                    pixelWidth: pixelSize,
                    pixelHeight: pixelSize,
                    baseThickness
                };
                export3MF(props.image, settings);
            } else {
                const settings: ExportOpenSCADSettings = {
                    filename,
                    pixelSize,
                    heightPerColor
                };
                await exportOpenSCADMasks(props.image, settings);
            }
            
            window.clarity?.('event', '3d-export', format);
            updateProp("ui", "is3DOpen", false);
        } catch (error) {
            console.error('Export failed:', error);
            alert(`Export failed: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}

interface FormatGroupProps {
    format: ExportFormat;
    onFormatChange: (format: ExportFormat) => void;
}

function FormatGroup(props: FormatGroupProps): JSX.Element {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === '3mf'}
                    onChange={() => props.onFormatChange('3mf')}
                />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <span class="format-icon">🧊</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.onFormatChange('openscad')}
                />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <span class="format-icon">📦</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? 'Standard 3MF file with separate triangle meshes per color. Compatible with most 3D slicers.'
                : 'Zip file with black/white mask images and OpenSCAD file for heightmap rendering.'}
        </span>
    </div>;
}

interface ParametersGroupProps {
    format: ExportFormat;
    pixelSize: number;
    baseThickness: number;
    heightPerColor: number;
    onPixelSizeChange: (value: number) => void;
    onBaseThicknessChange: (value: number) => void;
    onHeightPerColorChange: (value: number) => void;
}

function ParametersGroup(props: ParametersGroupProps): JSX.Element {
    return <div class="print-setting-group">
        <h1>Parameters</h1>
        <div class="print-setting-group-options">
            <div class="parameter-control">
                <label>
                    Pixel Size (mm):
                    <input 
                        type="number"
                        min="0.1"
                        max="100"
                        step="0.1"
                        value={props.pixelSize}
                        onChange={(e) => props.onPixelSizeChange(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
            </div>
            
            {props.format === '3mf' ? (
                <div class="parameter-control">
                    <label>
                        Base Thickness (mm):
                        <input 
                            type="number"
                            min="0.1"
                            max="50"
                            step="0.1"
                            value={props.baseThickness}
                            onChange={(e) => props.onBaseThicknessChange(parseFloat((e.target as HTMLInputElement).value))}
                        />
                    </label>
                </div>
            ) : (
                <div class="parameter-control">
                    <label>
                        Height Per Color (mm):
                        <input 
                            type="number"
                            min="0.1"
                            max="10"
                            step="0.1"
                            value={props.heightPerColor}
                            onChange={(e) => props.onHeightPerColorChange(parseFloat((e.target as HTMLInputElement).value))}
                        />
                    </label>
                </div>
            )}
        </div>
        <span class="description">
            {props.format === '3mf'
                ? 'Pixel size determines the width/height of each pixel. Base thickness is the height of the mesh.'
                : 'Pixel size determines spacing. Height per color controls layering in the heightmap.'}
        </span>
    </div>;
}
