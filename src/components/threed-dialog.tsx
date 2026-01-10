import * as preact from "preact";
import { JSX } from "preact";
import { useContext, useState } from "preact/hooks";
import { PartListImage } from "../image-utils";
import { generate3MF, ThreeMFSettings } from "../3mf-generator";
import { generateOpenSCADMasks, OpenSCADSettings } from "../openscad-generator";
import { PropContext } from "./context";

export type ThreeDDialogProps = {
  image: PartListImage;
  filename: string;
};

type ExportFormat = "3mf" | "openscad";

export function ThreeDDialog(props: ThreeDDialogProps): JSX.Element {
  const updateProp = useContext(PropContext);
  const [format, setFormat] = useState<ExportFormat>("3mf");
  const [pixelWidth, setPixelWidth] = useState(2.5);
  const [pixelHeight, setPixelHeight] = useState(2.5);
  const [pixelDepth, setPixelDepth] = useState(5);
  const [pixelSize, setPixelSize] = useState(2.5);
  const [heightPerLayer, setHeightPerLayer] = useState(1);

  return (
    <div class="print-dialog threed-dialog">
      <div class="print-options">
        <h1>3D Export</h1>
        
        <FormatSelector format={format} setFormat={setFormat} />
        
        {format === "3mf" ? (
          <ThreeMFSettings
            pixelWidth={pixelWidth}
            pixelHeight={pixelHeight}
            pixelDepth={pixelDepth}
            setPixelWidth={setPixelWidth}
            setPixelHeight={setPixelHeight}
            setPixelDepth={setPixelDepth}
          />
        ) : (
          <OpenSCADMaskSettings
            pixelSize={pixelSize}
            heightPerLayer={heightPerLayer}
            setPixelSize={setPixelSize}
            setHeightPerLayer={setHeightPerLayer}
          />
        )}
      </div>
      
      <div class="print-buttons">
        <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>
          Cancel
        </button>
        <button class="print" onClick={handleExport}>
          Export 3D
        </button>
      </div>
    </div>
  );

  function handleExport(): void {
    const baseFilename = props.filename.replace(/\.(png|jpg|jpeg|gif)$/i, "");
    
    if (format === "3mf") {
      const settings: ThreeMFSettings = {
        pixelWidth,
        pixelHeight,
        pixelDepth,
        filename: baseFilename,
      };
      window.clarity?.("event", "export-3mf");
      generate3MF(props.image, settings);
    } else {
      const settings: OpenSCADSettings = {
        pixelSize,
        heightPerLayer,
        filename: baseFilename,
      };
      window.clarity?.("event", "export-openscad");
      generateOpenSCADMasks(props.image, settings);
    }
  }
}

function FormatSelector(props: {
  format: ExportFormat;
  setFormat: (format: ExportFormat) => void;
}): JSX.Element {
  return (
    <div class="print-setting-group">
      <h2>Format</h2>
      <div class="print-setting-group-options">
        <label>
          <input
            type="radio"
            name="format"
            checked={props.format === "3mf"}
            onChange={() => props.setFormat("3mf")}
          />
          <div class="option">
            <h3>3MF Mesh</h3>
            <span class="format-icon">📐</span>
          </div>
        </label>
        <label>
          <input
            type="radio"
            name="format"
            checked={props.format === "openscad"}
            onChange={() => props.setFormat("openscad")}
          />
          <div class="option">
            <h3>OpenSCAD Masks</h3>
            <span class="format-icon">🎭</span>
          </div>
        </label>
      </div>
      <span class="description">
        {props.format === "3mf"
          ? "3D Manufacturing Format with separate colored meshes for each color"
          : "ZIP file with heightmap masks and OpenSCAD script"}
      </span>
    </div>
  );
}

function ThreeMFSettings(props: {
  pixelWidth: number;
  pixelHeight: number;
  pixelDepth: number;
  setPixelWidth: (value: number) => void;
  setPixelHeight: (value: number) => void;
  setPixelDepth: (value: number) => void;
}): JSX.Element {
  return (
    <div class="print-setting-group">
      <h2>Dimensions (mm)</h2>
      <div class="dimension-inputs">
        <label>
          <span>Pixel Width:</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={props.pixelWidth}
            onChange={(e) => props.setPixelWidth(parseFloat((e.target as HTMLInputElement).value))}
          />
        </label>
        <label>
          <span>Pixel Height:</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={props.pixelHeight}
            onChange={(e) => props.setPixelHeight(parseFloat((e.target as HTMLInputElement).value))}
          />
        </label>
        <label>
          <span>Pixel Depth:</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={props.pixelDepth}
            onChange={(e) => props.setPixelDepth(parseFloat((e.target as HTMLInputElement).value))}
          />
        </label>
      </div>
    </div>
  );
}

function OpenSCADMaskSettings(props: {
  pixelSize: number;
  heightPerLayer: number;
  setPixelSize: (value: number) => void;
  setHeightPerLayer: (value: number) => void;
}): JSX.Element {
  return (
    <div class="print-setting-group">
      <h2>Dimensions (mm)</h2>
      <div class="dimension-inputs">
        <label>
          <span>Pixel Size:</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={props.pixelSize}
            onChange={(e) => props.setPixelSize(parseFloat((e.target as HTMLInputElement).value))}
          />
        </label>
        <label>
          <span>Height per Layer:</span>
          <input
            type="number"
            min="0.1"
            step="0.1"
            value={props.heightPerLayer}
            onChange={(e) => props.setHeightPerLayer(parseFloat((e.target as HTMLInputElement).value))}
          />
        </label>
      </div>
    </div>
  );
}
