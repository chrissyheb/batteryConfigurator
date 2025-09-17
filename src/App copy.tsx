import React from "react";
import { z, ZodIssue } from "zod";
import { configSchema } from "./schema";

export type Config = z.infer<typeof configSchema>;

type FieldErrors = Record<string, string[]>;
const toKey = (path: (string | number)[]) => path.join(".") || "_root";
const uuid = () => (crypto as any).randomUUID?.() || Math.random().toString(36).slice(2);

// ----- validation helpers -----
function issuesToMap(issues: ZodIssue[]): FieldErrors {
  const m: FieldErrors = {};
  for (const i of issues) {
    const k = toKey(i.path as (string | number)[]);
    (m[k] ||= []).push(i.message);
  }
  return m;
}
function terraCheck(cfg: Config): FieldErrors {
  const errs: FieldErrors = {};
  const main = cfg.Units?.Main; if (!main) return errs;
  (main.Equipment || []).forEach((it: any, i: number) => {
    if (it?.Type !== "BatteryInverter") return;
    const invType = it?.Inverter?.Type, batType = it?.Battery?.Type, mbType = it?.Modbus?.Type;
    const base = `Units.Main.Equipment.${i}`;
    if (invType === "TerraInverter") {
      if (!it.Battery || batType !== "TerraBattery") (errs[`${base}.Battery.Type`] ||= []).push("TerraInverter erfordert Battery=TerraBattery");
      if (!it.Modbus) (errs[`${base}.Modbus`] ||= []).push("TerraInverter erfordert Modbus");
      else if (mbType !== "TerraModbus") (errs[`${base}.Modbus.Type`] ||= []).push("Modbus.Type muss TerraModbus sein");
    } else if (invType && invType !== "TerraInverter") {
      if (!it.Battery) (errs[`${base}.Battery`] ||= []).push("Battery erforderlich");
      if (batType === "TerraBattery") (errs[`${base}.Battery.Type`] ||= []).push("TerraBattery nicht erlaubt");
      if (mbType === "TerraModbus") (errs[`${base}.Modbus.Type`] ||= []).push("TerraModbus nicht erlaubt");
    }
  });
  return errs;
}
function validateConfig(cfg: Config): { ok: boolean; errors: FieldErrors } {
  const base = configSchema.safeParse(cfg);
  if (!base.success) return { ok: false, errors: issuesToMap(base.error.issues) };
  const t = terraCheck(base.data); return { ok: Object.keys(t).length === 0, errors: t };
}

// ----- app -----
export default function App() {
  const [config, setConfig] = React.useState<Config>(() => ({
    Customer: "",
    ModularPlc: { Version: "", Hardwarevariante: "" },
    Units: { Ems: { Equipment: [] }, Main: { Type: "Blokk", Equipment: [] } },
  }));
  const [errors, setErrors] = React.useState<FieldErrors>({});

  React.useEffect(() => {
    const saved = localStorage.getItem("battery-config");
    if (!saved) return;
    try { const json = JSON.parse(saved); const res = validateConfig(json); setConfig(json); setErrors(res.errors); } catch {}
  }, []);
  React.useEffect(() => { localStorage.setItem("battery-config", JSON.stringify(config)); }, [config]);

  function setConfigAndValidate(next: Config) { setConfig(next); setErrors(validateConfig(next).errors); }
  function addItem(unit: "Ems" | "Main", item: any) {
    const next: Config = { ...config, Units: { ...config.Units, [unit]: { ...config.Units[unit], Equipment: [...(config.Units[unit]?.Equipment || []), item] } } } as Config;
    setConfigAndValidate(next);
  }
  function replaceItem(unit: "Ems" | "Main", index: number, full: any) {
    const list = [...(config.Units[unit].Equipment || [])]; list[index] = full;
    setConfigAndValidate({ ...config, Units: { ...config.Units, [unit]: { ...config.Units[unit], Equipment: list } } } as Config);
  }
  function removeItem(unit: "Ems" | "Main", index: number) {
    const list = [...(config.Units[unit].Equipment || [])]; list.splice(index, 1);
    setConfigAndValidate({ ...config, Units: { ...config.Units, [unit]: { ...config.Units[unit], Equipment: list } } } as Config);
  }

  // import
  const fileRef = React.useRef<HTMLInputElement>(null);
  async function onImportFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text(); const json = JSON.parse(text);
      const res = validateConfig(json);
      if (res.ok) { setConfig(json); setErrors({}); localStorage.setItem("battery-config", JSON.stringify(json)); }
      else { setConfig(json); setErrors(res.errors); } // bleibt editierbar
    } catch { setErrors({ _root: ["Ungültige Datei oder JSON-Format"] }); }
    finally { if (fileRef.current) fileRef.current.value = ""; }
  }
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <main className="p-6 max-w-6xl mx-auto space-y-6">
      <header className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Batteriespeicher-Konfigurator</h1>
        <div className="flex gap-2 items-center">
          <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={(e) => onImportFile(e.target.files?.[0] || null)} />
          <button className="px-3 py-2 border rounded" onClick={() => fileRef.current?.click()}>Import JSON</button>
          <button className="px-3 py-2 border rounded disabled:opacity-50" disabled={hasErrors}
            title={hasErrors ? "Export deaktiviert: Bitte Fehler beheben" : ""}
            onClick={() => { const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob); const a = document.createElement("a");
              a.href = url; a.download = "battery-config.json"; a.click(); URL.revokeObjectURL(url); }}>
            Export JSON
          </button>
        </div>
      </header>

      {hasErrors && (
        <div className="border border-red-300 bg-red-50 rounded p-3">
          <div className="font-semibold mb-2">Validierungsfehler</div>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            {Object.entries(errors).map(([k, msgs]) => (<li key={k}><span className="font-mono">{k}</span>: {msgs.join("; ")}</li>))}
          </ul>
        </div>
      )}

      <Section
        title="EMS"
        add={() => addItem("Ems", newEmsDefault())}
        list={<UnitList unit="Ems" items={config.Units.Ems.Equipment} errors={errors}
                        onChange={(i, full) => replaceItem("Ems", i, full)} onRemove={(i) => removeItem("Ems", i)} />}
      />
      <Section
        title="Main"
        add={() => addItem("Main", newMainDefault())}
        list={<UnitList unit="Main" items={config.Units.Main.Equipment} errors={errors}
                        onChange={(i, full) => replaceItem("Main", i, full)} onRemove={(i) => removeItem("Main", i)} />}
      />
    </main>
  );
}

// ----- small UI helpers -----
function Section({ title, add, list }: any) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button className="px-2 py-1 rounded border" onClick={add}>+ Hinzufügen</button>
      </div>
      {list}
    </section>
  );
}
function errText(errors: FieldErrors, base: string, rel?: string) { const k = rel ? `${base}.${rel}` : base; return errors[k]?.join("; "); }
function TextInput({ label, value, onChange, error, readOnly, trailing }: any) {
  return (
    <label className="block text-sm">
      <span className="block mb-1 font-medium">{label}</span>
      <div className="flex gap-2 items-center">
        <input className={`border rounded px-2 py-1 w-full ${readOnly ? "bg-gray-50" : ""}`} value={value} readOnly={readOnly} onChange={(e) => onChange?.(e.target.value)} />
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
      <select className="border rounded px-2 py-1 w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o: string) => (<option key={o} value={o}>{o}</option>))}
      </select>
      {error && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </label>
  );
}

// ----- EMS editor -----
function EmsItemEditor({ value, basePath, errors, onChange }: any) {
  const [item, setItem] = React.useState<any>(() => ({ Guid: uuid(), Type: "Smartmeter", Name: "Smartmeter", ...value }));
  React.useEffect(() => setItem(value), [value]);
  function push(next: any) { setItem(next); onChange(next); }
  const type = item.Type;
  const allowed = ["Smartmeter", "SlaveLocalUM"];
  function onTypeChange(t: string) {
    if (t === "Smartmeter") {
      push({ ...item, Type: t, Hardware: item.Hardware || { Manufacturer: "CarloGavazzi", Type: "EM 24" }, Config: item.Config || { Usecase: "GridConnectionPointControl", Port: 502 } });
    } else {
      const { Hardware, Config, ...rest } = item; push({ ...rest, Type: t });
    }
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select label="Type" value={type} onChange={onTypeChange} options={allowed} error={errText(errors, basePath, "Type")} />
        <TextInput label="Name" value={item.Name || ""} onChange={(v: string) => push({ ...item, Name: v })} error={errText(errors, basePath, "Name")} />
        <TextInput label="GUID" value={item.Guid || ""} readOnly trailing={<button type="button" className="px-2 py-1 border rounded" onClick={() => push({ ...item, Guid: uuid() })}>Neu generieren</button>} error={errText(errors, basePath, "Guid")} />
      </div>
      {type === "Smartmeter" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Select label="Usecase" value={item.Config?.Usecase || "GridConnectionPointControl"} onChange={(v: string) => push({ ...item, Config: { ...(item.Config || {}), Usecase: v } })} options={["GridConnectionPointControl"]} error={errText(errors, basePath, "Config.Usecase")} />
          <TextInput label="TCP Port" value={item.Config?.Port ?? 502} onChange={(v: string) => push({ ...item, Config: { ...(item.Config || {}), Port: v } })} error={errText(errors, basePath, "Config.Port")} />
          <TextInput label="Hersteller" value={item.Hardware?.Manufacturer || ""} onChange={(v: string) => push({ ...item, Hardware: { ...(item.Hardware || {}), Manufacturer: v } })} error={errText(errors, basePath, "Hardware.Manufacturer")} />
          <TextInput label="HW-Typ" value={item.Hardware?.Type || ""} onChange={(v: string) => push({ ...item, Hardware: { ...(item.Hardware || {}), Type: v } })} error={errText(errors, basePath, "Hardware.Type")} />
        </div>
      )}
    </div>
  );
}

// ----- Main editor -----
function MainItemEditor({ value, basePath, errors, onChange }: any) {
  const [item, setItem] = React.useState<any>(() => ({ Guid: uuid(), Type: "BatteryInverter", Name: "BatteryInverter", ...value }));
  React.useEffect(() => setItem(value), [value]);
  function push(next: any) { setItem(next); onChange(next); }
  const type = item.Type;
  const allowed = ["BatteryInverter", "SmartmeterMain"];
  function onTypeChange(t: string) {
    if (t === "SmartmeterMain") {
      const { Inverter, Battery, Modbus, ...rest } = item; push({ ...rest, Type: t });
    } else {
      push({
        ...item, Type: t,
        Inverter: item.Inverter || { Name: "Inverter", Type: "TerraInverter", Guid: uuid(), Config: { InverterType: "SofarTerra", NominalInverterPower: 125000 } },
        Battery:  item.Battery  || { Name: "Battery",  Type: "TerraBattery", Guid: uuid(), Config: { BatteryType: "SofarTerra", BatteryCabinetCount: 1, BatteryCabinetModuleCount: 6 } },
        Modbus:   item.Modbus   || { Name: "TerraModbus", Type: "TerraModbus", Guid: uuid() },
      });
    }
  }
  const invType = item.Inverter?.Type || "TerraInverter";
  React.useEffect(() => {
    if (type !== "BatteryInverter") return;
    if (invType === "TerraInverter") {
      push({ ...item,
        Battery: { ...(item.Battery || {}), Type: "TerraBattery", Config: { ...(item.Battery?.Config || {}), BatteryType: "SofarTerra" } },
        Modbus:  { Name: item.Modbus?.Name || "TerraModbus", Type: "TerraModbus", Guid: item.Modbus?.Guid || uuid() }
      });
    } else {
      const { Modbus, ...rest } = item;
      push({ ...rest, Battery: { ...(item.Battery || {}), Type: "BatteryPylontechM1xBms", Config: { ...(item.Battery?.Config || {}), BatteryType: "PylontechM1C" } } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invType]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Select label="Type" value={type} onChange={onTypeChange} options={allowed} error={errText(errors, basePath, "Type")} />
        <TextInput label="Name" value={item.Name || ""} onChange={(v: string) => push({ ...item, Name: v })} error={errText(errors, basePath, "Name")} />
        <TextInput label="GUID" value={item.Guid || ""} readOnly trailing={<button type="button" className="px-2 py-1 border rounded" onClick={() => push({ ...item, Guid: uuid() })}>Neu generieren</button>} error={errText(errors, basePath, "Guid")} />
      </div>

      {type === "SmartmeterMain" && (<p className="text-sm text-gray-600">Virtuelles Smartmeter ohne zusätzliche Konfiguration.</p>)}

      {type === "BatteryInverter" && (<>
        <fieldset className="border rounded p-3">
          <legend className="px-1 text-sm font-semibold">Inverter</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextInput label="Name" value={item.Inverter?.Name || ""} onChange={(v: string) => push({ ...item, Inverter: { ...(item.Inverter || {}), Name: v } })} error={errText(errors, basePath, "Inverter.Name")} />
            <Select label="Type" value={invType} onChange={(v: string) => push({ ...item, Inverter: { ...(item.Inverter || {}), Type: v } })} options={["TerraInverter", "InverterKaco"]} error={errText(errors, basePath, "Inverter.Type")} />
            <TextInput label="GUID" value={item.Inverter?.Guid || ""} readOnly trailing={<button type="button" className="px-2 py-1 border rounded" onClick={() => push({ ...item, Inverter: { ...(item.Inverter || {}), Guid: uuid() } })}>Neu generieren</button>} error={errText(errors, basePath, "Inverter.Guid")} />
            <Select label="Vendor" value={item.Inverter?.Config?.InverterType || (invType === "TerraInverter" ? "SofarTerra" : "Kaco")} onChange={(v: string) => push({ ...item, Inverter: { ...(item.Inverter || {}), Config: { ...(item.Inverter?.Config || {}), InverterType: v } } })} options={invType === "TerraInverter" ? ["SofarTerra"] : ["Kaco"]} error={errText(errors, basePath, "Inverter.Config.InverterType")} />
            <TextInput label="Nominal Power (W)" value={item.Inverter?.Config?.NominalInverterPower ?? 0} onChange={(v: string) => push({ ...item, Inverter: { ...(item.Inverter || {}), Config: { ...(item.Inverter?.Config || {}), NominalInverterPower: v } } })} error={errText(errors, basePath, "Inverter.Config.NominalInverterPower")} />
          </div>
        </fieldset>

        <fieldset className="border rounded p-3">
          <legend className="px-1 text-sm font-semibold">Battery</legend>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <TextInput label="Name" value={item.Battery?.Name || ""} onChange={(v: string) => push({ ...item, Battery: { ...(item.Battery || {}), Name: v } })} error={errText(errors, basePath, "Battery.Name")} />
            <Select label="Type" value={item.Battery?.Type || (invType === "TerraInverter" ? "TerraBattery" : "BatteryPylontechM1xBms")} onChange={(v: string) => push({ ...item, Battery: { ...(item.Battery || {}), Type: v } })} options={invType === "TerraInverter" ? ["TerraBattery"] : ["BatteryPylontechM1xBms"]} error={errText(errors, basePath, "Battery.Type")} />
            <TextInput label="GUID" value={item.Battery?.Guid || ""} readOnly trailing={<button type="button" className="px-2 py-1 border rounded" onClick={() => push({ ...item, Battery: { ...(item.Battery || {}), Guid: uuid() } })}>Neu generieren</button>} error={errText(errors, basePath, "Battery.Guid")} />
            <Select label="Vendor" value={item.Battery?.Config?.BatteryType || (invType === "TerraInverter" ? "SofarTerra" : "PylontechM1C")} onChange={(v: string) => push({ ...item, Battery: { ...(item.Battery || {}), Config: { ...(item.Battery?.Config || {}), BatteryType: v } } })} options={invType === "TerraInverter" ? ["SofarTerra"] : ["PylontechM1C"]} error={errText(errors, basePath, "Battery.Config.BatteryType")} />
            <TextInput label="Cabinet Count" value={item.Battery?.Config?.BatteryCabinetCount ?? 1} onChange={(v: string) => push({ ...item, Battery: { ...(item.Battery || {}), Config: { ...(item.Battery?.Config || {}), BatteryCabinetCount: v } } })} error={errText(errors, basePath, "Battery.Config.BatteryCabinetCount")} />
            <TextInput label="Module Count" value={item.Battery?.Config?.BatteryCabinetModuleCount ?? 1} onChange={(v: string) => push({ ...item, Battery: { ...(item.Battery || {}), Config: { ...(item.Battery?.Config || {}), BatteryCabinetModuleCount: v } } })} error={errText(errors, basePath, "Battery.Config.BatteryCabinetModuleCount")} />
          </div>
        </fieldset>

        {invType === "TerraInverter" && (
          <fieldset className="border rounded p-3">
            <legend className="px-1 text-sm font-semibold">Modbus</legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TextInput label="Name" value={item.Modbus?.Name || ""} onChange={(v: string) => push({ ...item, Modbus: { ...(item.Modbus || {}), Name: v } })} error={errText(errors, basePath, "Modbus.Name")} />
              <TextInput label="GUID" value={item.Modbus?.Guid || ""} readOnly trailing={<button type="button" className="px-2 py-1 border rounded" onClick={() => push({ ...item, Modbus: { ...(item.Modbus || {}), Guid: uuid() } })}>Neu generieren</button>} error={errText(errors, basePath, "Modbus.Guid")} />
              <div><label className="block text-sm font-medium">Type</label><input className="border rounded px-2 py-1 w-full bg-gray-50" value="TerraModbus" readOnly /></div>
            </div>
          </fieldset>
        )}
      </>)}
    </div>
  );
}

// ----- defaults for +Add -----
function newEmsDefault() {
  return { Name: "Smartmeter", Type: "Smartmeter", Guid: uuid(), Hardware: { Manufacturer: "CarloGavazzi", Type: "EM 24" }, Config: { Usecase: "GridConnectionPointControl", Port: 502 } };
}
function newMainDefault() {
  return { Name: "BatteryInverter", Type: "BatteryInverter", Guid: uuid(),
    Inverter: { Name: "Inverter", Type: "TerraInverter", Guid: uuid(), Config: { InverterType: "SofarTerra", NominalInverterPower: 125000 } },
    Battery:  { Name: "Battery",  Type: "TerraBattery",  Guid: uuid(), Config: { BatteryType: "SofarTerra", BatteryCabinetCount: 1, BatteryCabinetModuleCount: 6 } },
    Modbus:   { Name: "TerraModbus", Type: "TerraModbus", Guid: uuid() } };
}

// ----- unit list -----
function UnitList({ unit, items, errors, onChange, onRemove }: {
  unit: "Ems" | "Main"; items: any[]; errors: FieldErrors;
  onChange: (index: number, full: any) => void; onRemove: (index: number) => void;
}) {
  if (!items || items.length === 0) return <p className="text-sm text-gray-600">Noch keine Elemente hinzugefügt.</p>;
  return (
    <div className="space-y-2">
      {items.map((it, idx) => (
        <div key={idx} className="border rounded p-3 space-y-3">
          {unit === "Ems"
            ? <EmsItemEditor value={it} basePath={`Units.Ems.Equipment.${idx}`} errors={errors} onChange={(full: any) => onChange(idx, full)} />
            : <MainItemEditor value={it} basePath={`Units.Main.Equipment.${idx}`} errors={errors} onChange={(full: any) => onChange(idx, full)} />}
          <div className="flex justify-end"><button className="px-2 py-1 border rounded" onClick={() => onRemove(idx)}>Entfernen</button></div>
        </div>
      ))}
    </div>
  );
}
