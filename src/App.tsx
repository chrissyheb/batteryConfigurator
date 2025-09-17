import React from "react";
import { z, ZodIssue } from "zod";
import { configSchema } from "./schema";

export type Config = z.infer<typeof configSchema>;
type FieldErrors = Record<string, string[]>;

const toKey = (path: (string | number)[]) => path.join(".") || "_root";
const uuid = () =>
  (crypto as any).randomUUID?.() || Math.random().toString(36).slice(2);

// Smartmeter: fixe Listen
const SM_MANUFACTURERS = [
  "CarloGavazzi",
  "Phoenix",
  "Janitza",
  "Beckhoff",
] as const;

const SM_TYPES: Record<(typeof SM_MANUFACTURERS)[number], string[]> = {
  CarloGavazzi: ["EM24"],
  Phoenix: ["EM375"],
  Janitza: ["UMG 96 PA", "UMG 96 RM", "UMG 509 Pro"],
  Beckhoff: ["El34x3"],
};

// PLC-Listen
const PLC_VERSIONS = ["0.0.1", "0.0.2", "0.0.3"] as const;
const PLC_HARDWARE = ["BlokkV3", "Terra"] as const;

// ---------- validation helpers ----------
function issuesToMap(issues: ZodIssue[]): FieldErrors {
  const m: FieldErrors = {};
  for (const i of issues) {
    const k = toKey(i.path as (string | number)[]);
    (m[k] ||= []).push(i.message);
  }
  return m;
}

// Terra-Regeln BatteryInverter (fachlich)
function terraCheck(cfg: Config): FieldErrors {
  const errs: FieldErrors = {};
  const main = cfg.Units?.Main;
  if (!main) return errs;

  (main.Equipment || []).forEach((it: any, i: number) => {
    if (it?.Type !== "BatteryInverter") return;
    const invType = it?.Inverter?.Type;
    const batType = it?.Battery?.Type;
    const mbType = it?.Modbus?.Type;
    const base = `Units.Main.Equipment.${i}`;

    if (invType === "TerraInverter") {
      if (!it.Battery || batType !== "TerraBattery")
        (errs[`${base}.Battery.Type`] ||= []).push(
          "TerraInverter erfordert Battery=TerraBattery"
        );
      if (!it.Modbus)
        (errs[`${base}.Modbus`] ||= []).push(
          "TerraInverter erfordert Modbus=TerraModbus"
        );
      else if (mbType !== "TerraModbus")
        (errs[`${base}.Modbus.Type`] ||= []).push(
          "Modbus.Type muss TerraModbus sein"
        );
    } else if (invType && invType !== "TerraInverter") {
      if (!it.Battery)
        (errs[`${base}.Battery`] ||= []).push("Battery erforderlich");
      if (batType === "TerraBattery")
        (errs[`${base}.Battery.Type`] ||= []).push(
          "TerraBattery nicht erlaubt"
        );
      if (mbType === "TerraModbus")
        (errs[`${base}.Modbus.Type`] ||= []).push(
          "TerraModbus nicht erlaubt"
        );
    }
  });
  return errs;
}

// Hardware-Validierung: symmetrisch für beide Varianten
function hardwareGateCheck(cfg: Config): FieldErrors {
  const errs: FieldErrors = {};
  const hw = cfg.ModularPlc?.Hardwarevariante;
  const main = cfg.Units?.Main;
  if (!main) return errs;

  (main.Equipment || []).forEach((it: any, i: number) => {
    if (it?.Type !== "BatteryInverter") return;
    const base = `Units.Main.Equipment.${i}`;

    const invType = it.Inverter?.Type;
    const batType = it.Battery?.Type;
    const hasModbus = !!it.Modbus;
    const mbType = it.Modbus?.Type;

    if (hw === "Terra") {
      // Auf Terra-HW sind Terra-Komponenten erforderlich
      if (invType !== "TerraInverter")
        (errs[`${base}.Inverter.Type`] ||= []).push(
          "Bei Hardwarevariante Terra ist nur Inverter=TerraInverter erlaubt"
        );
      if (batType !== "TerraBattery")
        (errs[`${base}.Battery.Type`] ||= []).push(
          "Bei Hardwarevariante Terra ist nur Battery=TerraBattery erlaubt"
        );
      if (!hasModbus)
        (errs[`${base}.Modbus`] ||= []).push(
          "Bei Hardwarevariante Terra ist Modbus=TerraModbus erforderlich"
        );
      else if (mbType !== "TerraModbus")
        (errs[`${base}.Modbus.Type`] ||= []).push(
          "Bei Hardwarevariante Terra muss Modbus.Type=TerraModbus sein"
        );
    } else {
      // Auf BlokkV3 sind Terra-Komponenten verboten
      if (invType === "TerraInverter")
        (errs[`${base}.Inverter.Type`] ||= []).push(
          "TerraInverter ist auf BlokkV3 nicht erlaubt"
        );
      if (batType === "TerraBattery")
        (errs[`${base}.Battery.Type`] ||= []).push(
          "TerraBattery ist auf BlokkV3 nicht erlaubt"
        );
      if (mbType === "TerraModbus")
        (errs[`${base}.Modbus.Type`] ||= []).push(
          "TerraModbus ist auf BlokkV3 nicht erlaubt"
        );
    }
  });

  return errs;
}

function validateConfig(cfg: Config): { ok: boolean; errors: FieldErrors } {
  const base = configSchema.safeParse(cfg);
  if (!base.success) return { ok: false, errors: issuesToMap(base.error.issues) };
  const e1 = terraCheck(base.data);
  const e2 = hardwareGateCheck(base.data);
  const all = { ...e1 };
  for (const [k, v] of Object.entries(e2)) (all[k] ||= []).push(...v);
  return { ok: Object.keys(all).length === 0, errors: all };
}

// ---------- App ----------
export default function App() {
  const [config, setConfig] = React.useState<Config>(() => ({
    Customer: "",
    ModularPlc: { Version: "0.0.1", Hardwarevariante: "BlokkV3" },
    Units: { Ems: { Equipment: [] }, Main: { Type: "Blokk", Equipment: [] } },
  }));
  const [errors, setErrors] = React.useState<FieldErrors>({});

  // load from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem("battery-config");
    if (!saved) return;
    try {
      const json = JSON.parse(saved);
      const res = validateConfig(json);
      setConfig(json);
      setErrors(res.errors);
    } catch {}
  }, []);

  // persist
  React.useEffect(() => {
    localStorage.setItem("battery-config", JSON.stringify(config));
  }, [config]);

  function setConfigAndValidate(next: Config) {
    setConfig(next);
    setErrors(validateConfig(next).errors);
  }

  function addItem(unit: "Ems" | "Main", item: any) {
    const next: Config = {
      ...config,
      Units: {
        ...config.Units,
        [unit]: {
          ...config.Units[unit],
          Equipment: [...(config.Units[unit]?.Equipment || []), item],
        },
      },
    } as Config;
    setConfigAndValidate(next);
  }

  function replaceItem(unit: "Ems" | "Main", index: number, full: any) {
    const list = [...(config.Units[unit].Equipment || [])];
    list[index] = full;
    setConfigAndValidate({
      ...config,
      Units: { ...config.Units, [unit]: { ...config.Units[unit], Equipment: list } },
    } as Config);
  }

  function removeItem(unit: "Ems" | "Main", index: number) {
    const list = [...(config.Units[unit].Equipment || [])];
    list.splice(index, 1);
    setConfigAndValidate({
      ...config,
      Units: { ...config.Units, [unit]: { ...config.Units[unit], Equipment: list } },
    } as Config);
  }

  // Import
  const fileRef = React.useRef<HTMLInputElement>(null);
  async function onImportFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = validateConfig(json);
      if (res.ok) {
        setConfig(json);
        setErrors({});
        localStorage.setItem("battery-config", JSON.stringify(json));
      } else {
        setConfig(json); // editierbar lassen + Fehler anzeigen
        setErrors(res.errors);
      }
    } catch {
      setErrors({ _root: ["Ungültige Datei oder JSON-Format"] });
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const hasErrors = Object.keys(errors).length > 0;
  const hwVariant = config.ModularPlc.Hardwarevariante;

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Batteriespeicher-Konfigurator</h1>
        <div className="flex gap-2 items-center">
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files?.[0] || null)}
          />
          <button className="px-3 py-2 border rounded" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
          <button
            className="px-3 py-2 border rounded disabled:opacity-50"
            disabled={hasErrors}
            title={hasErrors ? "Export deaktiviert: Bitte Fehler beheben" : ""}
            onClick={() => {
              const blob = new Blob([JSON.stringify(config, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "battery-config.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export JSON
          </button>
        </div>
      </header>

      {/* Projekt-Header */}
      <section className="border rounded p-3 space-y-3 bg-white">
        <h2 className="text-xl font-semibold">Projekt</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <TextInput
            label="Customer"
            value={config.Customer}
            onChange={(v: string) => setConfigAndValidate({ ...config, Customer: v })}
            error={errors["Customer"]?.join("; ")}
          />
          <Select
            label="ModularPlc.Version"
            value={config.ModularPlc.Version}
            onChange={(v: string) =>
              setConfigAndValidate({
                ...config,
                ModularPlc: { ...config.ModularPlc, Version: v as any },
              })
            }
            options={[...PLC_VERSIONS]}
            error={errors["ModularPlc.Version"]?.join("; ")}
          />
          <Select
            label="ModularPlc.Hardwarevariante"
            value={config.ModularPlc.Hardwarevariante}
            onChange={(v: string) =>
              setConfigAndValidate({
                ...config,
                ModularPlc: {
                  ...config.ModularPlc,
                  Hardwarevariante: v as any,
                },
              })
            }
            options={[...PLC_HARDWARE]}
            error={errors["ModularPlc.Hardwarevariante"]?.join("; ")}
          />
        </div>
        {hwVariant !== "Terra" ? (
          <p className="text-sm opacity-70">
            Hardwarevariante <b>{hwVariant}</b>: Terra-Komponenten sind nicht
            erlaubt. Vorhandene Terra-Komponenten bitte ändern.
          </p>
        ) : (
          <p className="text-sm opacity-70">
            Hardwarevariante <b>Terra</b>: Terra-Optionen verfügbar (auf Terra
            sind Terra-Komponenten erforderlich).
          </p>
        )}
      </section>

      {hasErrors && (
        <div className="border border-red-300 bg-red-50 rounded p-3">
          <div className="font-semibold mb-2">Validierungsfehler</div>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {Object.entries(errors).map(([k, msgs]) => (
              <li key={k}>
                <span className="font-mono">{k}</span>: {msgs.join("; ")}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Section
        title="EMS"
        add={() => addItem("Ems", newEmsDefault())}
        list={
          <UnitList
            unit="Ems"
            items={config.Units.Ems.Equipment}
            errors={errors}
            onChange={(i, full) => replaceItem("Ems", i, full)}
            onRemove={(i) => removeItem("Ems", i)}
            hwVariant={hwVariant}
          />
        }
      />

      <Section
        title="Main"
        add={() => addItem("Main", newMainDefault(hwVariant))}
        list={
          <UnitList
            unit="Main"
            items={config.Units.Main.Equipment}
            errors={errors}
            onChange={(i, full) => replaceItem("Main", i, full)}
            onRemove={(i) => removeItem("Main", i)}
            hwVariant={hwVariant}
          />
        }
      />
    </main>
  );
}

// ---------- Small UI helpers ----------
function Section({ title, add, list }: any) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button className="px-2 py-1 rounded border" onClick={add}>
          + Hinzufügen
        </button>
      </div>
      {list}
    </section>
  );
}

function errText(errors: FieldErrors, base: string, rel?: string) {
  const k = rel ? `${base}.${rel}` : base;
  return errors[k]?.join("; ");
}

function TextInput({ label, value, onChange, error, readOnly, trailing }: any) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 font-medium">{label}</span>
      <div className="flex gap-2 items-center">
        <input
          className={`border rounded px-2 py-1 w-full ${
            readOnly ? "bg-gray-50" : ""
          }`}
          value={value}
          readOnly={readOnly}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {trailing}
      </div>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </label>
  );
}

function Select({ label, value, onChange, options, error }: any) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 font-medium">{label}</span>
      <select
        className="border rounded px-2 py-1 w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o: string) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </label>
  );
}

// ---------- EMS editor ----------
function EmsItemEditor({ value, basePath, errors, onChange }: any) {
  const [item, setItem] = React.useState<any>(() => ({
    Guid: uuid(),
    Type: "Smartmeter",
    Name: "Smartmeter",
    Hardware: { Manufacturer: "CarloGavazzi", Type: "EM24" },
    Config: { Usecase: "GridConnectionPointControl", Port: 502 },
    ...value,
  }));
  React.useEffect(() => setItem(value), [value]);
  function push(next: any) {
    setItem(next);
    onChange(next);
  }

  const type = item.Type;
  const allowed = ["Smartmeter", "SlaveLocalUM"];

  function onTypeChange(t: string) {
    if (t === "Smartmeter") {
      push({
        ...item,
        Type: t,
        Hardware:
          item.Hardware || { Manufacturer: "CarloGavazzi", Type: "EM24" },
        Config:
          item.Config || {
            Usecase: "GridConnectionPointControl",
            Port: 502,
          },
      });
    } else {
      const { Hardware, Config, ...rest } = item;
      push({ ...rest, Type: t });
    }
  }

  // Aktuelle Auswahl für Hardware (mit Fallback)
  const smMan =
    item.Hardware?.Manufacturer &&
    (SM_MANUFACTURERS as readonly string[]).includes(
      item.Hardware.Manufacturer
    )
      ? item.Hardware.Manufacturer
      : "CarloGavazzi";
  const smTypeOptions = SM_TYPES[smMan] || [];
  const smTypeCurrent =
    item.Hardware?.Type && smTypeOptions.includes(item.Hardware.Type)
      ? item.Hardware.Type
      : smTypeOptions[0];

  return (
    <div className="space-y-3">
      {/* Top-Level: Type immer links zuerst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          label="Type"
          value={type}
          onChange={onTypeChange}
          options={allowed}
          error={errText(errors, basePath, "Type")}
        />
        <TextInput
          label="Name"
          value={item.Name || ""}
          onChange={(v: string) => push({ ...item, Name: v })}
          error={errText(errors, basePath, "Name")}
        />
        <TextInput
          label="GUID"
          value={item.Guid || ""}
          readOnly
          trailing={
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => push({ ...item, Guid: uuid() })}
            >
              Neu generieren
            </button>
          }
          error={errText(errors, basePath, "Guid")}
        />
      </div>

      {type === "Smartmeter" && (
        <div className="grid grid-cols-1 md-grid-cols-2 md:grid-cols-2 gap-3">
          {/* Hardware zuerst: Hersteller -> Hardware-Typ */}
          <Select
            label="Hersteller"
            value={smMan}
            onChange={(v: string) => {
              const nextMan = (SM_MANUFACTURERS as readonly string[]).includes(
                v
              )
                ? (v as any)
                : "CarloGavazzi";
              const firstType = SM_TYPES[nextMan][0];
              push({
                ...item,
                Hardware: { Manufacturer: nextMan, Type: firstType },
              });
            }}
            options={[...SM_MANUFACTURERS]}
            error={errText(errors, basePath, "Hardware.Manufacturer")}
          />
          <Select
            label="Hardware-Typ"
            value={smTypeCurrent}
            onChange={(v: string) =>
              push({ ...item, Hardware: { Manufacturer: smMan, Type: v } })
            }
            options={smTypeOptions}
            error={errText(errors, basePath, "Hardware.Type")}
          />

          {/* Danach Usecase / TCP-Port */}
          <Select
            label="Usecase"
            value={item.Config?.Usecase || "GridConnectionPointControl"}
            onChange={(v: string) =>
              push({ ...item, Config: { ...(item.Config || {}), Usecase: v } })
            }
            options={["GridConnectionPointControl"]}
            error={errText(errors, basePath, "Config.Usecase")}
          />
          <TextInput
            label="TCP Port"
            value={item.Config?.Port ?? 502}
            onChange={(v: string) =>
              push({ ...item, Config: { ...(item.Config || {}), Port: v } })
            }
            error={errText(errors, basePath, "Config.Port")}
          />
        </div>
      )}
    </div>
  );
}

// ---------- Main editor ----------
function MainItemEditor({ value, basePath, errors, onChange, hwVariant }: any) {
  const [item, setItem] = React.useState<any>(() => ({
    Guid: uuid(),
    Type: "BatteryInverter",
    Name: "BatteryInverter",
    ...value,
  }));
  React.useEffect(() => setItem(value), [value]);
  function push(next: any) {
    setItem(next);
    onChange(next);
  }

  const canUseTerra = hwVariant === "Terra";
  const type = item.Type;
  const allowed = ["BatteryInverter", "SmartmeterMain"];

  function onTypeChange(t: string) {
    if (t === "SmartmeterMain") {
      const { Inverter, Battery, Modbus, ...rest } = item;
      push({ ...rest, Type: t, Config: { Variant: "SmartmeterVirtual" } });
    } else {
      // BatteryInverter defaults – keine Auto-Konvertierung bei HW-Wechsel
      push({
        ...item,
        Type: t,
        Inverter:
          item.Inverter ||
          ({
            Name: "Inverter",
            Type: canUseTerra ? "TerraInverter" : "InverterKaco",
            Guid: uuid(),
            Config: {
              InverterType: canUseTerra ? "SofarTerra" : "Kaco",
              NominalInverterPower: 125000,
            },
          } as any),
        Battery:
          item.Battery ||
          ({
            Name: "Battery",
            Type: canUseTerra ? "TerraBattery" : "BatteryPylontechM1xBms",
            Guid: uuid(),
            Config: {
              BatteryType: canUseTerra ? "SofarTerra" : "PylontechM1C",
              BatteryCabinetCount: 1,
              BatteryCabinetModuleCount: 6,
            },
          } as any),
        ...(canUseTerra
          ? { Modbus: item.Modbus || { Name: "TerraModbus", Type: "TerraModbus", Guid: uuid() } }
          : {}),
      });
    }
  }

  // KEINE Auto-Anpassungen bei Inverter-/HW-Wechsel – nur Validierungsfehler

  const invType =
    item.Inverter?.Type || (canUseTerra ? "TerraInverter" : "InverterKaco");
  const invOptions = canUseTerra
    ? ["TerraInverter", "InverterKaco"]
    : ["InverterKaco"];
  const batteryOptions =
    canUseTerra && invType === "TerraInverter"
      ? ["TerraBattery"]
      : ["BatteryPylontechM1xBms"];

  const showModbusEditor = !!item.Modbus || invType === "TerraInverter";

  return (
    <div className="space-y-4">
      {/* Top-Level: Type immer links zuerst */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select
          label="Type"
          value={type}
          onChange={onTypeChange}
          options={allowed}
          error={errText(errors, basePath, "Type")}
        />
        <TextInput
          label="Name"
          value={item.Name || ""}
          onChange={(v: string) => push({ ...item, Name: v })}
          error={errText(errors, basePath, "Name")}
        />
        <TextInput
          label="GUID"
          value={item.Guid || ""}
          readOnly
          trailing={
            <button
              type="button"
              className="px-2 py-1 border rounded"
              onClick={() => push({ ...item, Guid: uuid() })}
            >
              Neu generieren
            </button>
          }
          error={errText(errors, basePath, "Guid")}
        />
      </div>

      {type === "SmartmeterMain" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select
            label="Variante"
            value={item.Config?.Variant || "SmartmeterVirtual"}
            onChange={(v: string) =>
              push({ ...item, Config: { ...(item.Config || {}), Variant: v } })
            }
            options={["SmartmeterVirtual", "EL3443"]}
            error={errText(errors, basePath, "Config.Variant")}
          />
          <p className="text-sm opacity-70">
            Wähle zwischen virtuellem Smartmeter und EL3443.
          </p>
        </div>
      )}

      {type === "BatteryInverter" && (
        <>
          {/* Inverter */}
          <fieldset className="border rounded p-3">
            <legend className="px-1 text-sm font-semibold">Inverter</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1) Type links zuerst */}
              <Select
                label="Type"
                value={invType}
                onChange={(v: string) =>
                  push({
                    ...item,
                    Inverter: { ...(item.Inverter || {}), Type: v },
                  })
                }
                options={invOptions}
                error={errText(errors, basePath, "Inverter.Type")}
              />
              {/* 2) Name */}
              <TextInput
                label="Name"
                value={item.Inverter?.Name || ""}
                onChange={(v: string) =>
                  push({
                    ...item,
                    Inverter: { ...(item.Inverter || {}), Name: v },
                  })
                }
                error={errText(errors, basePath, "Inverter.Name")}
              />
              {/* 3) GUID */}
              <TextInput
                label="GUID"
                value={item.Inverter?.Guid || ""}
                readOnly
                trailing={
                  <button
                    type="button"
                    className="px-2 py-1 border rounded"
                    onClick={() =>
                      push({
                        ...item,
                        Inverter: { ...(item.Inverter || {}), Guid: uuid() },
                      })
                    }
                  >
                    Neu generieren
                  </button>
                }
                error={errText(errors, basePath, "Inverter.Guid")}
              />
              {/* 4) Vendor */}
              <Select
                label="Vendor"
                value={
                  item.Inverter?.Config?.InverterType ||
                  (invType === "TerraInverter" ? "SofarTerra" : "Kaco")
                }
                onChange={(v: string) =>
                  push({
                    ...item,
                    Inverter: {
                      ...(item.Inverter || {}),
                      Config: {
                        ...(item.Inverter?.Config || {}),
                        InverterType: v,
                      },
                    },
                  })
                }
                options={invType === "TerraInverter" ? ["SofarTerra"] : ["Kaco"]}
                error={errText(errors, basePath, "Inverter.Config.InverterType")}
              />
              {/* 5) Power */}
              <TextInput
                label="Nominal Power (W)"
                value={item.Inverter?.Config?.NominalInverterPower ?? 0}
                onChange={(v: string) =>
                  push({
                    ...item,
                    Inverter: {
                      ...(item.Inverter || {}),
                      Config: {
                        ...(item.Inverter?.Config || {}),
                        NominalInverterPower: v,
                      },
                    },
                  })
                }
                error={errText(
                  errors,
                  basePath,
                  "Inverter.Config.NominalInverterPower"
                )}
              />
            </div>
          </fieldset>

          {/* Battery */}
          <fieldset className="border rounded p-3">
            <legend className="px-1 text-sm font-semibold">Battery</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* 1) Type links zuerst */}
              <Select
                label="Type"
                value={item.Battery?.Type || batteryOptions[0]}
                onChange={(v: string) =>
                  push({
                    ...item,
                    Battery: { ...(item.Battery || {}), Type: v },
                  })
                }
                options={batteryOptions}
                error={errText(errors, basePath, "Battery.Type")}
              />
              {/* 2) Name */}
              <TextInput
                label="Name"
                value={item.Battery?.Name || ""}
                onChange={(v: string) =>
                  push({
                    ...item,
                    Battery: { ...(item.Battery || {}), Name: v },
                  })
                }
                error={errText(errors, basePath, "Battery.Name")}
              />
              {/* 3) GUID */}
              <TextInput
                label="GUID"
                value={item.Battery?.Guid || ""}
                readOnly
                trailing={
                  <button
                    type="button"
                    className="px-2 py-1 border rounded"
                    onClick={() =>
                      push({
                        ...item,
                        Battery: { ...(item.Battery || {}), Guid: uuid() },
                      })
                    }
                  >
                    Neu generieren
                  </button>
                }
                error={errText(errors, basePath, "Battery.Guid")}
              />
              {/* 4) Vendor */}
              <Select
                label="Vendor"
                value={
                  item.Battery?.Config?.BatteryType ||
                  (invType === "TerraInverter" ? "SofarTerra" : "PylontechM1C")
                }
                onChange={(v: string) =>
                  push({
                    ...item,
                    Battery: {
                      ...(item.Battery || {}),
                      Config: {
                        ...(item.Battery?.Config || {}),
                        BatteryType: v,
                      },
                    },
                  })
                }
                options={
                  invType === "TerraInverter" ? ["SofarTerra"] : ["PylontechM1C"]
                }
                error={errText(errors, basePath, "Battery.Config.BatteryType")}
              />
              {/* 5) Counts */}
              <TextInput
                label="Cabinet Count"
                value={item.Battery?.Config?.BatteryCabinetCount ?? 1}
                onChange={(v: string) =>
                  push({
                    ...item,
                    Battery: {
                      ...(item.Battery || {}),
                      Config: {
                        ...(item.Battery?.Config || {}),
                        BatteryCabinetCount: v,
                      },
                    },
                  })
                }
                error={errText(
                  errors,
                  basePath,
                  "Battery.Config.BatteryCabinetCount"
                )}
              />
              <TextInput
                label="Module Count"
                value={item.Battery?.Config?.BatteryCabinetModuleCount ?? 1}
                onChange={(v: string) =>
                  push({
                    ...item,
                    Battery: {
                      ...(item.Battery || {}),
                      Config: {
                        ...(item.Battery?.Config || {}),
                        BatteryCabinetModuleCount: v,
                      },
                    },
                  })
                }
                error={errText(
                  errors,
                  basePath,
                  "Battery.Config.BatteryCabinetModuleCount"
                )}
              />
            </div>
          </fieldset>

          {/* Modbus */}
          {showModbusEditor && (
            <fieldset className="border rounded p-3">
              <legend className="px-1 text-sm font-semibold">Modbus</legend>
              {!item.Modbus ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="px-2 py-1 border rounded"
                    onClick={() =>
                      push({
                        ...item,
                        Modbus: {
                          Name: "TerraModbus",
                          Type: "TerraModbus",
                          Guid: uuid(),
                        },
                      })
                    }
                    disabled={!canUseTerra || invType !== "TerraInverter"}
                    title={
                      !canUseTerra
                        ? "Nur bei Hardwarevariante Terra"
                        : invType !== "TerraInverter"
                        ? "Nur bei Inverter=TerraInverter"
                        : ""
                    }
                  >
                    Modbus hinzufügen (TerraModbus)
                  </button>
                  {errText(errors, basePath, "Modbus") && (
                    <p className="text-red-600 text-xs">
                      {errText(errors, basePath, "Modbus")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 1) Type zuerst (read-only) */}
                  <div>
                    <label className="block text-sm font-medium">Type</label>
                    <input
                      className="border rounded px-2 py-1 w-full bg-gray-50"
                      value="TerraModbus"
                      readOnly
                    />
                  </div>
                  {/* 2) Name */}
                  <TextInput
                    label="Name"
                    value={item.Modbus?.Name || ""}
                    onChange={(v: string) =>
                      push({
                        ...item,
                        Modbus: { ...(item.Modbus || {}), Name: v },
                      })
                    }
                    error={errText(errors, basePath, "Modbus.Name")}
                  />
                  {/* 3) GUID */}
                  <TextInput
                    label="GUID"
                    value={item.Modbus?.Guid || ""}
                    readOnly
                    trailing={
                      <button
                        type="button"
                        className="px-2 py-1 border rounded"
                        onClick={() =>
                          push({
                            ...item,
                            Modbus: {
                              ...(item.Modbus || {}),
                              Guid: uuid(),
                            },
                          })
                        }
                      >
                        Neu generieren
                      </button>
                    }
                    error={errText(errors, basePath, "Modbus.Guid")}
                  />
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      className="px-2 py-1 border rounded"
                      onClick={() => {
                        const { Modbus, ...rest } = item as any;
                        push(rest);
                      }}
                    >
                      Modbus entfernen
                    </button>
                  </div>
                </div>
              )}
            </fieldset>
          )}
        </>
      )}
    </div>
  );
}

// ---------- Defaults ----------
function newEmsDefault() {
  return {
    Name: "Smartmeter",
    Type: "Smartmeter",
    Guid: uuid(),
    Hardware: { Manufacturer: "CarloGavazzi", Type: "EM24" },
    Config: { Usecase: "GridConnectionPointControl", Port: 502 },
  };
}

function newMainDefault(hwVariant: (typeof PLC_HARDWARE)[number]) {
  if (hwVariant === "Terra") {
    return {
      Name: "BatteryInverter",
      Type: "BatteryInverter",
      Guid: uuid(),
      Inverter: {
        Name: "Inverter",
        Type: "TerraInverter",
        Guid: uuid(),
        Config: { InverterType: "SofarTerra", NominalInverterPower: 125000 },
      },
      Battery: {
        Name: "Battery",
        Type: "TerraBattery",
        Guid: uuid(),
        Config: {
          BatteryType: "SofarTerra",
          BatteryCabinetCount: 1,
          BatteryCabinetModuleCount: 6,
        },
      },
      Modbus: { Name: "TerraModbus", Type: "TerraModbus", Guid: uuid() },
    };
  }
  return {
    Name: "BatteryInverter",
    Type: "BatteryInverter",
    Guid: uuid(),
    Inverter: {
      Name: "Inverter",
      Type: "InverterKaco",
      Guid: uuid(),
      Config: { InverterType: "Kaco", NominalInverterPower: 125000 },
    },
    Battery: {
      Name: "Battery",
      Type: "BatteryPylontechM1xBms",
      Guid: uuid(),
      Config: {
        BatteryType: "PylontechM1C",
        BatteryCabinetCount: 1,
        BatteryCabinetModuleCount: 6,
      },
    },
  };
}

// ---------- Unit list ----------
function UnitList({
  unit,
  items,
  errors,
  onChange,
  onRemove,
  hwVariant,
}: {
  unit: "Ems" | "Main";
  items: any[];
  errors: FieldErrors;
  onChange: (index: number, full: any) => void;
  onRemove: (index: number) => void;
  hwVariant: (typeof PLC_HARDWARE)[number];
}) {
  if (!items || items.length === 0)
    return (
      <p className="text-sm text-gray-600">Noch keine Elemente hinzugefügt.</p>
    );
  return (
    <div className="space-y-2">
      {items.map((it, idx) => {
        const basePath =
          unit === "Ems"
            ? `Units.Ems.Equipment.${idx}`
            : `Units.Main.Equipment.${idx}`;

        // Fehler, die zu genau dieser Komponente gehören
        const localErrors = Object.entries(errors)
          .filter(([k]) => k === basePath || k.startsWith(basePath + "."))
          .flatMap(([, msgs]) => msgs);

        return (
          <div key={idx} className="border rounded p-3 space-y-3">
            {unit === "Ems" ? (
              <EmsItemEditor
                value={it}
                basePath={basePath}
                errors={errors}
                onChange={(full: any) => onChange(idx, full)}
              />
            ) : (
              <MainItemEditor
                value={it}
                basePath={basePath}
                errors={errors}
                onChange={(full: any) => onChange(idx, full)}
                hwVariant={hwVariant}
              />
            )}

            {/* Lokale Fehlermeldungen direkt in der Karte */}
            {localErrors.length > 0 && (
              <div className="border border-red-300 bg-red-50 rounded p-2">
                <ul className="list-disc pl-5 text-sm">
                  {localErrors.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end">
              <button className="px-2 py-1 border rounded" onClick={() => onRemove(idx)}>
                Entfernen
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
