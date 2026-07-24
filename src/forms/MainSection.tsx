
import React from 'react';
import { useEffect } from 'react';
import { SelectField, TextField, GuidField, CheckField, NumberField } from '@/ui/Fields';
import { PathType, createByKey, getModbusTypes, getMainSmartmeterHardwares, getMainSmartmeterModels, mainEquipmentKeys, mainConfigKeys } from '@/spec/builder';
import { components } from '@/registry';
import { getVersionContext, isAvailable } from '@/core/versioning';
import { JSONValue } from '@/app/store';
import { Collapsible } from '@/ui/Cards';
import { renderFieldTree, type FormRendererCtx } from '@/core/form-renderer';

function BatteryInverterCard(props: { idx: number; count: number; cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any, errorPrefixSet:any })
{
  const { idx, count, cfg, setCfg, setInCfg, getOrCfg, delFromCfg } = props;

  const itemPath: PathType = ['Units','Main','Equipment','BatteryInverter',idx];
  const ctx: FormRendererCtx = { cfg, getOrCfg, setInCfg, errorPrefixSet: props.errorPrefixSet };

  const modbusAvailable = getOrCfg(['Units','Main','Equipment','BatteryInverter',idx,'Modbus'], false);

  // Nur die Felder mit echtem Sonderfall (Index: an Listenindex gekoppelt;
  // Config: separat geflacht statt als eigene Karte) werden explizit
  // herausgenommen - der Rest wird per Object-Rest automatisch mitgerendert.
  // So tauchen neu hinzugefügte Felder (z.B. ein neues DisplayName) automatisch
  // im Formular auf, ohne dass diese Datei nochmal angefasst werden muss.
  const { Index: _biIndex, Inverter: _biInverter, Battery: _biBattery, Modbus: _biModbus, ...batteryInverterRest } = components.BatteryInverter.fields;
  const { Config: inverterConfig, ...inverterRest } = components.BatteryInverterInverter.fields.group;
  const { Config: batteryConfig, ...batteryRest } = components.BatteryInverterBattery.fields.group;
  const { Type: _modbusType, Config: modbusConfig, ...modbusRest } = components.BatteryInverterModbus.fields.group;

  // Versionierung: Modbus ist als Komponente nur für bestimmte HardwareVariants
  // verfügbar (siehe components/battery-inverter/spec.ts -> BatteryInverterModbus.availability).
  // Statt das Formular immer zu zeigen und erst per Cross-Rule (spec/rules.ts)
  // nachträglich einen Fehler zu melden, blenden wir es hier direkt aus.
  const versionCtx = getVersionContext(cfg);
  const modbusComponentAvailable = isAvailable(components.BatteryInverterModbus.availability, versionCtx, cfg);

  function removeElement(path: PathType, i?: number): void
  {
    if (i !== undefined && i !== null) { delFromCfg(path.concat([i])); }
    else { delFromCfg(path); }
  };

  return (
    <Collapsible
      title={getOrCfg(['Units','Main','Equipment','BatteryInverter',idx,'Type'], 'Unkown Smartmeter Type') + ' (' + getOrCfg(['Units','Main','Equipment','BatteryInverter',idx,'Name'], '') + ')'}
      className="card stack"
      actionType={(count === 1) ? undefined : "delete"}
      onAction={() => removeElement(['Units','Main','Equipment','BatteryInverter'],idx)}
      path={itemPath}
      errorPrefixSet={props.errorPrefixSet}
    >
      {renderFieldTree(itemPath, batteryInverterRest, ctx)}
      {/* Index ist an den Listenindex gekoppelt (nicht an einen gespeicherten
          Wert) - deshalb weiterhin die explizite `value`-Übersteuerung. */}
      <NumberField
        value={idx}
        path={['Units','Main','Equipment','BatteryInverter',idx,'Index']}
        defLink={components.BatteryInverter.fields.Index}
      />

      {/* Inverter/Battery: generisch bis auf das Flatten der jeweiligen
          "Config"-Untergruppe (die hat in der bestehenden UI keine eigene
          Karte, sondern liegt flach in der Inverter/Battery-Karte). */}
      <Collapsible
        title="Inverter"
        className="card"
        path={[...itemPath,'Inverter']}
        errorPrefixSet={props.errorPrefixSet}
      >
        {renderFieldTree([...itemPath,'Inverter'], inverterRest, ctx)}
        {renderFieldTree([...itemPath,'Inverter','Config'], inverterConfig.group, ctx)}
      </Collapsible>

      <Collapsible
        title="Battery"
        className="card"
        path={[...itemPath,'Battery']}
        errorPrefixSet={props.errorPrefixSet}
      >
        {renderFieldTree([...itemPath,'Battery'], batteryRest, ctx)}
        {renderFieldTree([...itemPath,'Battery','Config'], batteryConfig.group, ctx)}
      </Collapsible>

      {modbusComponentAvailable && (
        <Collapsible
          title="Modbus"
          className="card"
          path={[...itemPath,'Modbus']}
          errorPrefixSet={props.errorPrefixSet}
        >
          {/* Toggle bleibt hand-geschrieben: legt/löscht die ganze Modbus-
              Unterkomponente (Seiteneffekt über das eigentliche Feld hinaus). */}
          <SelectField
            path={['Units','Main','Equipment','BatteryInverter',idx,'Modbus','Type']}
              defLink={components.BatteryInverterModbus.fields.group.Type}
            options={getModbusTypes()}
            onChange=
            {(v: string) =>
              {
                if (v === getModbusTypes()[0]) { delFromCfg(['Units','Main','Equipment','BatteryInverter',idx,'Modbus']); }
                else { setInCfg(['Units','Main','Equipment','BatteryInverter',idx,'Modbus'], createByKey('BatteryInverterModbus',{n: idx})); }
              }
            }
          />
          {modbusAvailable && (<>
            {renderFieldTree([...itemPath,'Modbus'], modbusRest, ctx)}
            {renderFieldTree([...itemPath,'Modbus','Config'], modbusConfig.group, ctx)}
          </>)}
        </Collapsible>
      )}
    </Collapsible>
  );
}


export default function MainSection(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any, errorPrefixSet: any })
{
  const { cfg, setCfg, setInCfg, getCfg, getOrCfg, delFromCfg, hasCfg, errorIndex, errorPrefixSet } = props;

  const ctx: FormRendererCtx = { cfg, getOrCfg, setInCfg, errorPrefixSet };

  const versionCtx = getVersionContext(cfg);
  // Versionierungs-Beispiel auf Feldebene (siehe components/smartmeter-main/spec.ts):
  // CurrentTransformerPrimaryCurrent ist illustrativ an eine PLC-Lib-Version gebunden.
  // (Die Availability-Prüfung übernimmt beim generischen Rendern core/form-renderer.tsx
  // automatisch - hier nur noch für das dynamische readOnly unten benötigt.)
  const currentTransformerAvailable = isAvailable(components.SmartmeterMain.fields.CurrentTransformerPrimaryCurrent.availability, versionCtx, cfg);

  // Nur die Felder mit echtem Sonderfall werden explizit ausgenommen - der Rest
  // (inkl. künftig neu hinzugefügter Felder) wird automatisch generisch gerendert.
  const { HardwareType: _smHardwareType, HardwareModel: _smHardwareModel, CurrentTransformerPrimaryCurrent: _smCurrentTransformer, ...smartmeterMainRest } = components.SmartmeterMain.fields;

  function addElement(path: PathType, type: mainEquipmentKeys|mainConfigKeys): void
  {
    const list:JSONValue = getOrCfg(path, []);
    let idxNew: number = 0;
    if (!Array.isArray(list)) { return; }
    idxNew = list.length;
    const item: any = createByKey(type, { n: idxNew+1 });
    const pathNew: PathType = path.concat([idxNew]);
    setInCfg(pathNew, item);
  }


  function removeElement(path: PathType, i?: number): void
  {
    if (i !== undefined && i !== null) { delFromCfg(path.concat([i])); }
    else { delFromCfg(path); }
  };


  // Effect -> get numbers of batteries and inverters -> change value on JSON-Structure change
  useEffect(() => {
    const BatteryCount = cfg.Units?.Main?.Equipment?.BatteryInverter?.length ?? 0;
    if (cfg.Units?.Main?.Config?.BatteryCount !== BatteryCount) {
      setInCfg(['Units','Main','Config','BatteryCount'], BatteryCount);
    }
    const InverterCount = cfg.Units?.Main?.Equipment?.BatteryInverter?.length ?? 0;
    if (cfg.Units?.Main?.Config?.InverterCount !== InverterCount) {
      setInCfg(['Units','Main','Config','InverterCount'], InverterCount);
    }
  }, [cfg.Units?.Main?.Equipment?.BatteryInverter?.length ?? 0]);

  // Effect -> get numbers of batteries and inverters -> change value on JSON-Structure change
  useEffect(() => {
    if (cfg.Units?.Main?.Equipment?.SmartmeterMain?.HardwareModel !== 'El34x3') {
      setInCfg(['Units','Main','Equipment','SmartmeterMain','CurrentTransformerPrimaryCurrent'], '0A');
    }
  }, [cfg.Units?.Main?.Equipment?.SmartmeterMain?.HardwareModel ?? 'Virtual']);

  return (
    <Collapsible
      title="Main"
      defaultOpen
      className="card stack"
      path={['Units','Main']}
      errorPrefixSet={props.errorPrefixSet}
    >
      <Collapsible
        title="Config - Main Unit"
        className="card"
        path={['Units','Main','Config']}
        errorPrefixSet={props.errorPrefixSet}
      >
        {renderFieldTree(['Units','Main','Config'], components.MainConfig.fields, ctx)}
      </Collapsible>

      <Collapsible
        title="Config - Power Limit Groups"
        className="card stack"
        actionType="add"
        onAction={() => {addElement(['Units','Main','Config','PowerLimitGroups'],'PowerLimitGroup')}}
        path={['Units','Main','Config','PowerLimitGroups']}
        errorPrefixSet={props.errorPrefixSet}
      >
        { getOrCfg(['Units','Main','Config','PowerLimitGroups'], []).map((e: any, i: number) =>
        {
          const itemPath: PathType = ['Units','Main','Config','PowerLimitGroups',i];
          return (
            <Collapsible
              key={i}
              title={'Power Limitation Group Main ' + (i+1)}
              className="card"
              actionType="delete"
              onAction={() => removeElement(['Units','Main','Config','PowerLimitGroups'],i)}
              path={itemPath}
              errorPrefixSet={props.errorPrefixSet}
            >
              {renderFieldTree(itemPath, components.PowerLimitGroup.fields, ctx)}
            </Collapsible>
          );
        })}
      </Collapsible>

      <Collapsible
        title={getOrCfg(['Units','Main','Equipment','SmartmeterMain','Type'], 'Unkown Smartmeter Type') + ' (' + getOrCfg(['Units','Main','Equipment',"SmartmeterMain",'Name'], '') + ')'}
        className="card"
        path={['Units','Main','Equipment','SmartmeterMain']}
        errorPrefixSet={props.errorPrefixSet}
      >
        {renderFieldTree(['Units','Main','Equipment','SmartmeterMain'], smartmeterMainRest, ctx)}
        {/* HardwareType/HardwareModel bleiben hand-geschrieben (Seiteneffekt:
            HardwareType-Wahl belegt HardwareModel automatisch vor). */}
        <SelectField
          path={['Units','Main','Equipment','SmartmeterMain','HardwareType']}
          defLink={components.SmartmeterMain.fields.HardwareType}
          options={getMainSmartmeterHardwares()}
          onChange={(v: string) =>
          {
            const model = getMainSmartmeterModels(v)[0] ?? '';
            setInCfg(['Units','Main','Equipment','SmartmeterMain','HardwareType'], v);
            setInCfg(['Units','Main','Equipment','SmartmeterMain','HardwareModel'], model);
          }}
        />
        <SelectField
          path={['Units','Main','Equipment','SmartmeterMain','HardwareModel']}
          defLink={components.SmartmeterMain.fields.HardwareModel}
          options={getMainSmartmeterModels(getCfg(['Units','Main','Equipment','SmartmeterMain','HardwareType']))}
        />
        {/* Dynamisches readOnly (abhängig vom aktuell gewählten HardwareModel) ist
            nicht generisch ableitbar - bleibt hand-geschrieben. Availability
            (sinceVersion) selbst würde der generische Renderer bereits automatisch
            berücksichtigen. */}
        {currentTransformerAvailable && (
          <NumberField
            path={['Units','Main','Equipment','SmartmeterMain','CurrentTransformerPrimaryCurrent']}
            defLink={components.SmartmeterMain.fields.CurrentTransformerPrimaryCurrent}
            readOnly={getOrCfg(['Units','Main','Equipment','SmartmeterMain','HardwareModel'], 'Virtual') !== 'El34x3'}
          />
        )}
      </Collapsible>

      <Collapsible
        title="Battery & Inverter"
        className="card"
        actionType="add"
        onAction={() => {addElement(['Units','Main','Equipment','BatteryInverter'],'BatteryInverter')}}
        path={['Units','Main','Equipment','BatteryInverter']}
        errorPrefixSet={props.errorPrefixSet}
      >
        {((cfg.Units?.Main?.Equipment?.BatteryInverter ?? []).filter((e: any) => { return e.Type === 'BatteryInverter'; })).map((_: any, idx: number, array: any) =>
          {
            return <BatteryInverterCard key={idx} idx={idx} count={array.length} cfg={cfg} setCfg={setCfg} setInCfg={setInCfg} getCfg={getCfg} getOrCfg={getOrCfg} delFromCfg={delFromCfg} hasCfg={hasCfg} errorIndex={errorIndex} errorPrefixSet={errorPrefixSet} />;
          })
        }
      </Collapsible>
    </Collapsible>
  );
}
