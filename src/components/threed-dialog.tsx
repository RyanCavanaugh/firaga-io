import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage, renderPartListImageToDataURL } from '../image-utils';
import { make3D, ThreeDSettings } from '../threed-generator';
import { PropContext } from './context';

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">("3mf");
    const [depth, setDepth] = useState(2);
    const [baseHeight, setBaseHeight] = useState(1);
    
    return <div class="print-dialog">
        <div class="print-options">
            <FormatGroup format={format} setFormat={setFormat} image={props.image} />
            <DepthGroup depth={depth} setDepth={setDepth} baseHeight={baseHeight} setBaseHeight={setBaseHeight} />
        </div>
        <div class="print-buttons">
            <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
            <button class="print" onClick={() => export3D()}>Export 3D</button>
        </div>
    </div>;
    
    function export3D() {
        const settings: ThreeDSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            depth,
            baseHeight
        };
        
        window.clarity?.("event", "export-3d");
        make3D(props.image, settings);
    }
}

export type ThreeDDialogProps = {
    image: PartListImage;
    filename: string;
};

function FormatGroup(props: { format: "3mf" | "openscad-masks"; setFormat: (f: "3mf" | "openscad-masks") => void; image: PartListImage }) {
    return <div class="print-setting-group">
        <h1>Format</h1>
        <div class="print-setting-group-options">
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "3mf"}
                    onChange={() => props.setFormat("3mf")} />
                <div class="option">
                    <h3>3MF Mesh</h3>
                    <ThreeMFPreviewer image={props.image} />
                </div>
            </label>
            <label>
                <input type="radio"
                    name="format"
                    checked={props.format === "openscad-masks"}
                    onChange={() => props.setFormat("openscad-masks")} />
                <div class="option">
                    <h3>OpenSCAD Masks</h3>
                    <OpenSCADPreviewer image={props.image} />
                </div>
            </label>
        </div>
        <span class="description">
            {props.format === "3mf" 
                ? "3D Manufacturing Format file with separate colored shapes for each color. Compatible with most 3D software."
                : "ZIP file containing black/white mask images and an OpenSCAD script to combine them into a 3D model."}
        </span>
    </div>;
}

function DepthGroup(props: { depth: number; setDepth: (d: number) => void; baseHeight: number; setBaseHeight: (h: number) => void }) {
    return <div class="print-setting-group">
        <h1>Dimensions</h1>
        <div class="print-setting-group-options">
            <div class="dimension-controls">
                <label>
                    <span>Pixel Depth (mm):</span>
                    <input type="number" min="0.5" max="10" step="0.5" 
                        value={props.depth} 
                        onChange={(e: any) => props.setDepth(parseFloat(e.target.value))} />
                </label>
                <label>
                    <span>Base Height (mm):</span>
                    <input type="number" min="0" max="10" step="0.5" 
                        value={props.baseHeight} 
                        onChange={(e: any) => props.setBaseHeight(parseFloat(e.target.value))} />
                </label>
            </div>
        </div>
        <span class="description">
            Pixel depth is the height of each colored layer. Base height is an optional base layer.
        </span>
    </div>;
}

function ThreeMFPreviewer(props: { image: PartListImage }) {
    return <div class="threed-preview">
        <svg width="50" height="50" viewBox="0 0 50 50">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:rgb(200,200,200);stop-opacity:1" />
                    <stop offset="100%" style="stop-color:rgb(100,100,100);stop-opacity:1" />
                </linearGradient>
            </defs>
            {/* Simple 3D cube representation */}
            <polygon points="10,20 25,10 40,20 25,30" fill="url(#grad1)" stroke="black" stroke-width="1" />
            <polygon points="25,30 40,20 40,40 25,50" fill="#888" stroke="black" stroke-width="1" />
            <polygon points="10,20 25,30 25,50 10,40" fill="#666" stroke="black" stroke-width="1" />
        </svg>
    </div>;
}

function OpenSCADPreviewer(props: { image: PartListImage }) {
    return <div class="threed-preview">
        <svg width="50" height="50" viewBox="0 0 50 50">
            {/* Layered representation */}
            <rect x="10" y="35" width="30" height="4" fill="#ff0000" opacity="0.7" />
            <rect x="12" y="28" width="26" height="4" fill="#00ff00" opacity="0.7" />
            <rect x="14" y="21" width="22" height="4" fill="#0000ff" opacity="0.7" />
            <rect x="16" y="14" width="18" height="4" fill="#ffff00" opacity="0.7" />
        </svg>
    </div>;
}
