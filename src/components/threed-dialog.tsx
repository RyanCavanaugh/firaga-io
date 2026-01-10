import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { AppProps } from '../types';
import { PropContext } from './context';
import { generate3MF, ThreeMFSettings } from '../3mf-generator';
import { generateOpenSCADZip, OpenSCADSettings } from '../openscad-generator';

export type ThreeDDialogProps = {
  image: PartListImage;
  settings: ThreeDProps;
  filename: string;
};

export type ThreeDProps = {
  format: '3mf' | 'openscad';
  layerHeight: number;
  pegHeight: number;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
  const updateProp = useContext(PropContext);
  const [isGenerating, setIsGenerating] = useState(false);

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
        disabled={isGenerating}
      >
        {isGenerating ? 'Generating...' : 'Export 3D'}
      </button>
    </div>
  </div>;

  async function exportModel(): Promise<void> {
    setIsGenerating(true);
    try {
      const filename = props.filename.replace(".png", "");

      if (props.settings.format === '3mf') {
        const settings: ThreeMFSettings = {
          filename,
          layerHeight: props.settings.layerHeight,
          pegHeight: props.settings.pegHeight
        };
        window.clarity?.("event", "export-3mf");
        generate3MF(props.image, settings);
      } else {
        const settings: OpenSCADSettings = {
          filename,
          layerHeight: props.settings.layerHeight,
          pegHeight: props.settings.pegHeight
        };
        window.clarity?.("event", "export-openscad");
        await generateOpenSCADZip(props.image, settings);
      }
    } finally {
      setIsGenerating(false);
    }
  }
}

type OptionGroupFactory<K extends keyof ThreeDProps> = (props: ThreeDDialogProps) => {
  title: string | JSX.Element;
  key: K;
  values: ReadonlyArray<{
    value: ThreeDProps[K];
    title: string | JSX.Element;
    icon: JSX.Element;
    description: string | JSX.Element;
  }>;
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<'format'>> => ({
  title: "Format",
  key: "format",
  values: [
    {
      value: "3mf",
      title: "3MF Mesh",
      description: "Standard 3D Manufacturing Format with separate material shapes for each color",
      icon: <span class="format-icon">🧊</span>
    },
    {
      value: "openscad",
      title: "OpenSCAD Masks",
      description: "ZIP file with monochrome masks and OpenSCAD file for heightmap rendering",
      icon: <span class="format-icon">📦</span>
    }
  ]
}));

const DimensionsGroup = (props: ThreeDDialogProps) => {
  const updateProp = useContext(PropContext);
  
  return <div class="print-setting-group">
    <h1>Dimensions</h1>
    <div class="print-setting-group-options">
      <label>
        <span>Layer Height (mm):</span>
        <input 
          type="number" 
          min="0.1" 
          max="10" 
          step="0.1"
          value={props.settings.layerHeight}
          onChange={(e) => updateProp("threeD", "layerHeight", parseFloat((e.target as HTMLInputElement).value))}
        />
      </label>
      <label>
        <span>Peg Height (mm):</span>
        <input 
          type="number" 
          min="1" 
          max="50" 
          step="0.5"
          value={props.settings.pegHeight}
          onChange={(e) => updateProp("threeD", "pegHeight", parseFloat((e.target as HTMLInputElement).value))}
        />
      </label>
    </div>
    <span class="description">Adjust the physical dimensions of the 3D model</span>
  </div>;
};

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
              updateProp("threeD", p.key, v.value);
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
