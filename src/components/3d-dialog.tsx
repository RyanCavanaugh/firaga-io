import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, generateOpenSCAD, ensureJSZipLoaded, ThreeDSettings } from '../3d-generator';
import { AppProps } from '../types';
import { getPitch } from '../utils';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<'3mf' | 'openscad'>('3mf');
    const [pixelHeight, setPixelHeight] = useState(3);
    const [isGenerating, setIsGenerating] = useState(false);
    
    const pitch = getPitch(props.gridSize);
    const pixelWidth = pitch;
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} />
            <SettingsGroup 
                pixelHeight={pixelHeight} 
                setPixelHeight={setPixelHeight}
                pixelWidth={pixelWidth}
            />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button 
                class="print" 
                onClick={() => generate3D()}
                disabled={isGenerating}
            >
                {isGenerating ? 'Generating...' : 'Export 3D'}
            </button>
        </div>
    </div>;
    
    async function generate3D() {
        setIsGenerating(true);
        try {
            const settings: ThreeDSettings = {
                format,
                pixelHeight,
                pixelWidth
            };
            
            window.clarity?.("event", "3d-export", format);
            
            let blob: Blob;
            let filename: string;
            
            if (format === '3mf') {
                blob = await generate3MF(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '.3mf';
            } else {
                await ensureJSZipLoaded();
                blob = await generateOpenSCAD(props.image, settings);
                filename = props.filename.replace(/\.[^.]+$/, '') + '_openscad.zip';
            }
            
            // Download the file
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
            
            updateProp("ui", "is3DOpen", false);
        } catch (error) {
            console.error('Error generating 3D file:', error);
            alert('Error generating 3D file: ' + (error instanceof Error ? error.message : String(error)));
        } finally {
            setIsGenerating(false);
        }
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    gridSize: AppProps["material"]["size"];
    filename: string;
};

function FormatGroup(props: { format: '3mf' | 'openscad', setFormat: (f: '3mf' | 'openscad') => void }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === '3mf'}
                    onChange={() => props.setFormat('3mf')} 
                />
                <div class="option">
                    <h3>3MF</h3>
                    <span class="format-icon">📐</span>
                </div>
            </label>
            <label>
                <input 
                    type="radio"
                    name="3d-format"
                    checked={props.format === 'openscad'}
                    onChange={() => props.setFormat('openscad')} 
                />
                <div class="option">
                    <h3>OpenSCAD</h3>
                    <span class="format-icon">🔧</span>
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === '3mf' 
                ? '3D Manufacturing Format - triangle mesh with separate materials for each color'
                : 'ZIP file with mask images and OpenSCAD file for heightmap-based 3D display'
            }
        </span>
    </div>;
}

function SettingsGroup(props: { 
    pixelHeight: number, 
    setPixelHeight: (h: number) => void,
    pixelWidth: number 
}) {
    return <div class="print-setting-group">
        <h1>Settings</h1>
        <div class="print-setting-group-options">
            <div class="option-vertical">
                <label>
                    Pixel Height (mm):
                    <input 
                        type="number" 
                        min="0.5" 
                        max="20" 
                        step="0.5"
                        value={props.pixelHeight}
                        onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
                    />
                </label>
                <label>
                    Pixel Width (mm): {props.pixelWidth.toFixed(2)} (based on material size)
                </label>
            </div>
        </div>
        <span class="description">
            Height controls the z-axis extrusion of each pixel
        </span>
    </div>;
}
