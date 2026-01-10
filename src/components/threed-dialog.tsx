import * as preact from 'preact';
import { JSX } from 'preact';
import { useContext, useState } from 'preact/hooks';
import { PartListImage } from '../image-utils';
import { generate3MF, ThreeDSettings } from '../3mf-generator';
import { generateOpenSCADMasks, OpenSCADSettings } from '../openscad-generator';
import { AppProps, ThreeDProps } from '../types';
import { PropContext } from './context';

export interface ThreeDDialogProps {
  image: PartListImage;
  settings: ThreeDProps;
  filename: string;
}

export function ThreeDDialog(props: ThreeDDialogProps) {
  const updateProp = useContext(PropContext);
  const [isGenerating, setIsGenerating] = useState(false);

  return <div class="print-dialog">
    <div class="print-options">
      <FormatGroup {...props} />
      <HeightGroup {...props} />
    </div>
    <div class="print-buttons">
      <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>Cancel</button>
      <button class="print" onClick={generate} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Export 3D'}
      </button>
    </div>
  </div>;

  async function generate() {
    setIsGenerating(true);
    try {
      const settings: ThreeDSettings | OpenSCADSettings = {
        pixelHeight: props.settings.pixelHeight,
        baseHeight: props.settings.baseHeight,
      };

      const filename = props.filename.replace(/\.(png|jpg|jpeg)$/i, '');

      window.clarity?.("event", "3d-export", props.settings.format);

      if (props.settings.format === "3mf") {
        await generate3MF(props.image, settings, filename);
      } else {
        await generateOpenSCADMasks(props.image, settings, filename);
      }
    } finally {
      setIsGenerating(false);
    }
  }
}

type OptionGroupFactory<K extends keyof AppProps["threeDExport"]> = (props: ThreeDDialogProps) => {
  title: string | JSX.Element;
  key: K;
  values: ReadonlyArray<{
    value: AppProps["threeDExport"][K];
    title: string | JSX.Element;
    icon: JSX.Element;
    description: string | JSX.Element;
  }>;
};

const FormatGroup = makeRadioGroup((): ReturnType<OptionGroupFactory<"format">> => ({
  title: "Format",
  key: "format",
  values: [
    {
      value: "3mf",
      title: "3MF Mesh",
      description: "3D Manufacturing Format with separate material shapes for each color. Compatible with most 3D modeling software.",
      icon: <span class="format-3mf">🧊</span>,
    },
    {
      value: "openscad",
      title: "OpenSCAD Masks",
      description: "Zip file with black/white mask images and OpenSCAD script. Use heightmap functionality to create 3D display.",
      icon: <span class="format-openscad">📦</span>,
    },
  ]
}));

const HeightGroup = makeSliderGroup((): {
  title: string;
  sliders: Array<{
    key: keyof ThreeDProps;
    label: string;
    min: number;
    max: number;
    step: number;
  }>;
} => ({
  title: "Dimensions (mm)",
  sliders: [
    {
      key: "pixelHeight",
      label: "Pixel Height",
      min: 0.5,
      max: 10,
      step: 0.5,
    },
    {
      key: "baseHeight",
      label: "Base Height",
      min: 0,
      max: 5,
      step: 0.5,
    },
  ]
}));

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
              updateProp("threeDExport", p.key, v.value);
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

function makeSliderGroup(factory: () => {
  title: string;
  sliders: Array<{
    key: keyof ThreeDProps;
    label: string;
    min: number;
    max: number;
    step: number;
  }>;
}) {
  return function (props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const p = factory();
    
    return <div class="print-setting-group">
      <h1>{p.title}</h1>
      <div class="print-setting-group-options slider-group">
        {p.sliders.map(slider => (
          <div key={slider.key} class="slider-control">
            <label>{slider.label}</label>
            <div class="slider-input-group">
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={props.settings[slider.key] as number}
                onChange={(e) => {
                  updateProp("threeDExport", slider.key, parseFloat((e.target as HTMLInputElement).value));
                }}
              />
              <input
                type="number"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={props.settings[slider.key] as number}
                onChange={(e) => {
                  updateProp("threeDExport", slider.key, parseFloat((e.target as HTMLInputElement).value));
                }}
                class="slider-number"
              />
            </div>
          </div>
        ))}
      </div>
    </div>;
  };
}
