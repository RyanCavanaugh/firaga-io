import * as preact from "preact";
import { JSX } from "preact";
import { useContext, useState } from "preact/hooks";
import { PartListImage } from "../image-utils";
import { generate3D, ThreeDSettings } from "../3d-generator";
import { AppProps } from "../types";
import { getPitch } from "../utils";
import { PropContext } from "./context";

export type ThreeDDialogProps = {
    image: PartListImage;
    settings: AppProps["threeD"];
    gridSize: AppProps["material"]["size"];
    filename: string;
};

export function ThreeDDialog(props: ThreeDDialogProps) {
    const updateProp = useContext(PropContext);
    const [format, setFormat] = useState<"3mf" | "openscad-masks">(props.settings.format);

    return (
        <div class="print-dialog">
            <div class="print-options">
                <FormatGroup format={format} setFormat={setFormat} image={props.image} />
                <SettingsGroup format={format} />
            </div>
            <div class="print-buttons">
                <button class="cancel" onClick={() => updateProp("ui", "is3DOpen", false)}>
                    Cancel
                </button>
                <button class="print" onClick={() => exportModel()}>
                    Export 3D Model
                </button>
            </div>
        </div>
    );

    function exportModel() {
        const settings: ThreeDSettings = {
            format,
            filename: props.filename.replace(".png", ""),
            pitch: getPitch(props.gridSize),
            height: 2,
        };

        window.clarity?.("event", "export-3d");
        generate3D(props.image, settings);
    }
}

type FormatGroupProps = {
    format: "3mf" | "openscad-masks";
    setFormat: (format: "3mf" | "openscad-masks") => void;
    image: PartListImage;
};

function FormatGroup(props: FormatGroupProps) {
    return (
        <div class="print-setting-group">
            <h1>Format</h1>
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
                        <span class="format-icon">🧊</span>
                    </div>
                </label>
                <label>
                    <input
                        type="radio"
                        name="format"
                        checked={props.format === "openscad-masks"}
                        onChange={() => props.setFormat("openscad-masks")}
                    />
                    <div class="option">
                        <h3>OpenSCAD Masks</h3>
                        <span class="format-icon">📐</span>
                    </div>
                </label>
            </div>
            <span class="description">
                {props.format === "3mf"
                    ? "Generate a 3MF file with separate colored shapes for each color in the image. Compatible with most 3D slicers."
                    : "Generate a ZIP file with monochrome heightmap images and an OpenSCAD script that combines them into a 3D display."}
            </span>
        </div>
    );
}

type SettingsGroupProps = {
    format: "3mf" | "openscad-masks";
};

function SettingsGroup(props: SettingsGroupProps) {
    return (
        <div class="print-setting-group">
            <h1>Settings</h1>
            <div class="print-setting-group-options">
                <div class="settings-info">
                    {props.format === "3mf" ? (
                        <p>Each color will be exported as a separate mesh object in the 3MF file.</p>
                    ) : (
                        <p>
                            One black/white PNG mask per color will be generated, along with an OpenSCAD file
                            that uses surface() to create 3D layers.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
