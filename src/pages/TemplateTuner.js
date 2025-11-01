import React, { useMemo, useState } from "react";
import P5Canvas from "../components/P5Canvas";
import { validateConfig, getDefaultConfig } from "../utils/schemaValidator";

// Schemas
import flowFieldSchema from "../art/templates/flowField.schema.json";
import gridPatternSchema from "../art/templates/gridPattern.schema.json";
import noiseWavesSchema from "../art/templates/noiseWaves.schema.json";
import orbitalMotionSchema from "../art/templates/orbitalMotion.schema.json";
import particleSystemSchema from "../art/templates/particleSystem.schema.json";
import geometricGridSchema from "../art/templates/geometricGrid.schema.json";
import ballotsSchema from "../art/templates/ballots.schema.json";
import lightningSchema from "../art/templates/lightning.schema.json";

// Runtime templates
import flowFieldRuntime from "../templates/flowFieldRuntime";
import gridPatternRuntime from "../templates/gridPatternRuntime";
import noiseWavesRuntime from "../templates/noiseWavesRuntime";
import orbitalMotionRuntime from "../templates/orbitalMotionRuntime";
import particleSystemRuntime from "../templates/particleSystemRuntime";
import geometricGridRuntime from "../templates/geometricGridRuntime";
import ballotsRuntime from "../templates/ballotsRuntime";
import lightningRuntime from "../templates/lightningRuntime";

const templates = {
  flowField: {
    title: "Flow Field",
    schema: flowFieldSchema,
    runtime: flowFieldRuntime,
  },
  gridPattern: {
    title: "Grid Pattern",
    schema: gridPatternSchema,
    runtime: gridPatternRuntime,
  },
  noiseWaves: {
    title: "Noise Waves",
    schema: noiseWavesSchema,
    runtime: noiseWavesRuntime,
  },
  orbitalMotion: {
    title: "Orbital Motion",
    schema: orbitalMotionSchema,
    runtime: orbitalMotionRuntime,
  },
  particleSystem: {
    title: "Particle System",
    schema: particleSystemSchema,
    runtime: particleSystemRuntime,
  },
  geometricGrid: {
    title: "Geometric Grid",
    schema: geometricGridSchema,
    runtime: geometricGridRuntime,
  },
  ballots: {
    title: "Ballots",
    schema: ballotsSchema,
    runtime: ballotsRuntime,
  },
  lightning: {
    title: "Lightning",
    schema: lightningSchema,
    runtime: lightningRuntime,
  },
};

function Field({ name, schema, value, onChange }) {
  const t = schema.type;

  if (schema.enum) {
    return (
      <label style={{ display: "block", marginBottom: 8 }}>
        {name}
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ marginLeft: 8 }}
        >
          {schema.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (t === "number" || t === "integer") {
    const min = schema.minimum ?? 0;
    const max = schema.maximum ?? 100;
    const step = t === "integer" ? 1 : schema.multipleOf || 0.001;
    return (
      <label style={{ display: "block", marginBottom: 8 }}>
        {name}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) =>
            onChange(
              t === "integer"
                ? parseInt(e.target.value, 10)
                : parseFloat(e.target.value)
            )
          }
          style={{ width: 240, marginLeft: 8 }}
        />
        <span style={{ marginLeft: 8 }}>{String(value)}</span>
      </label>
    );
  }

  if (t === "string") {
    return (
      <label style={{ display: "block", marginBottom: 8 }}>
        {name}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ marginLeft: 8, width: 200 }}
        />
      </label>
    );
  }

  if (schema.type === "array" && schema.items?.type === "string") {
    const arr = Array.isArray(value) ? value : [];
    const updateItem = (i, v) => {
      const next = arr.slice();
      next[i] = v;
      onChange(next);
    };
    const add = () => onChange([...(arr || []), "#ffffff"]);
    const remove = (i) => onChange(arr.filter((_, idx) => idx !== i));
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontWeight: 600 }}>{name}</div>
        {arr.map((item, i) => (
          <div
            key={i}
            style={{ display: "flex", alignItems: "center", marginTop: 4 }}
          >
            <input
              type="text"
              value={item}
              onChange={(e) => updateItem(i, e.target.value)}
              style={{ width: 140, marginRight: 8 }}
            />
            <button onClick={() => remove(i)}>Remove</button>
          </div>
        ))}
        <button onClick={add} style={{ marginTop: 6 }}>
          Add color
        </button>
      </div>
    );
  }

  return null;
}

export default function TemplateTuner() {
  const [templateKey, setTemplateKey] = useState("flowField");
  const { schema, runtime, title } = templates[templateKey];

  const defaults = useMemo(() => getDefaultConfig(schema), [schema]);
  const [config, setConfig] = useState(defaults);

  const { valid, data, errors } = useMemo(
    () => validateConfig(schema, config),
    [schema, config]
  );

  const sketch = useMemo(() => runtime(data), [runtime, data]);

  const reset = () => setConfig(getDefaultConfig(schema));
  const copyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      alert("Config copied to clipboard");
    } catch (_) {}
  };
  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateKey}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const setField = (key, value) =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={{ padding: 16 }}>
      <h2>Template Tuner</h2>

      <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div style={{ minWidth: 320, maxWidth: 400 }}>
          <label style={{ display: "block", marginBottom: 12 }}>
            Template
            <select
              value={templateKey}
              onChange={(e) => {
                const next = e.target.value;
                setTemplateKey(next);
                setConfig(getDefaultConfig(templates[next].schema));
              }}
              style={{ marginLeft: 8 }}
            >
              {Object.entries(templates).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.title}
                </option>
              ))}
            </select>
          </label>

          <div>
            {Object.entries(schema.properties).map(([key, prop]) => (
              <Field
                key={key}
                name={key}
                schema={prop}
                value={config[key] ?? prop.default ?? ""}
                onChange={(v) => setField(key, v)}
              />
            ))}
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={reset}>Reset</button>
            <button onClick={copyJson}>Copy JSON</button>
            <button onClick={downloadJson}>Download JSON</button>
          </div>

          {!valid && (
            <div style={{ marginTop: 12, color: "#b00020" }}>
              <div style={{ fontWeight: 600 }}>Validation errors:</div>
              <ul>
                {errors.map((e, i) => (
                  <li key={i}>{`${e.instancePath || "(root)"} ${
                    e.message
                  }`}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <P5Canvas width={600} height={600} sketch={sketch} title={title} />
        </div>
      </div>
    </div>
  );
}
