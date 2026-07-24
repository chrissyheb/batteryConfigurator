
import React from 'react';
import { useEffect } from 'react';
import { SelectField, TextField, GuidField, NumberField, CheckField } from '@/ui/Fields';
import { PathType, emsEquipmentKeys, emsConfigKeys, createByKey, getEmsSmartmeterHardwares, getEmsSmartmeterModels } from '@/spec/builder';
import { components } from '@/registry';
import { JSONValue } from '@/app/store';
import { Collapsible } from '@/ui/Cards';
import { renderFieldTree, renderFieldNode, type FormRendererCtx } from '@/core/form-renderer';

// Ems hat keine einzelne "Ems"-ComponentDefinition, die Config+Equipment
// vereint (das Layout kombiniert EmsConfig-Gruppen mit mehreren Equipment-
// Listen) - deshalb kein GeneratedForm für die ganze Section, sondern
// gezielter Einsatz von renderFieldNode/renderFieldTree für die Teile ohne
// Listen/Seiteneffekte. Listen-Mechanik (add/remove/Titel/Cardinality),
// Smartmeter-HardwareType->HardwareModel-Kopplung und die RippleControl-
// MaxPowerRate-Sondergruppierung bleiben bewusst hand-geschrieben (siehe
// core/form-renderer.tsx Kommentar zum aktuellen Funktionsumfang).
export default function EmsSection(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any, errorPrefixSet:any })
{
  const { cfg, setInCfg, getOrCfg, delFromCfg,  errorIndex } = props;

  const ctx: FormRendererCtx = { cfg: props.cfg, getOrCfg: props.getOrCfg, setInCfg: props.setInCfg, errorPrefixSet: props.errorPrefixSet };

  // Nur Felder mit echtem Sonderfall werden explizit ausgenommen - der Rest
  // (inkl. künftig neu hinzugefügter Felder) wird automatisch generisch gerendert.
  const { HardwareType: _smHardwareType, HardwareModel: _smHardwareModel, Config: smartmeterConfig, ...smartmeterRest } = components.Smartmeter.fields;
  const { Config: slaveLocalConfig, ...slaveLocalRest } = components.SlaveLocalUM.fields;
  const { Config: slaveRemoteConfig, ...slaveRemoteRest } = components.SlaveRemoteUM.fields;

  let systemsInParallelCount: number = 0;

  // Effekt: NumberOfArrayEntries automatisch nachführen
  useEffect(() => {
    const systemsInParallelCount = cfg.Units?.Ems?.Equipment?.LocalRemoteSystems?.length ?? 0; // add local unit
    if (cfg.Units?.Ems?.Config?.SystemsInParallelCount !== systemsInParallelCount) {
      setInCfg(['Units','Ems','Config','SystemsInParallelCount'], systemsInParallelCount);
    }
  }, [cfg.Units?.Ems?.Equipment?.LocalRemoteSystems?.length ?? 0]); // <— wichtig: auf Länge hören, nicht auf ganze Struktur!

  // Effekt: NumberOfArrayEntries automatisch nachführen
  useEffect(() => {
    const smartmeterCount = cfg.Units?.Ems?.Equipment?.Smartmeter?.length ?? 0;
    if (cfg.Units?.Ems?.Config?.SmartmeterCount !== smartmeterCount) {
      setInCfg(['Units','Ems','Config','SmartmeterCount'], smartmeterCount);
    }
  }, [cfg.Units?.Ems?.Equipment?.Smartmeter?.length ?? 0]); // <— wichtig: auf Länge hören, nicht auf ganze Struktur!


  function addElement(path: PathType, type: emsEquipmentKeys|emsConfigKeys): void
  {
    //const pathExt: PathType = path.concat([type]);
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

  return (
    <Collapsible
      title="EMS"
      defaultOpen
      className="card stack"
      path={['Units','Ems']}
      errorPrefixSet={props.errorPrefixSet}
    >
      {renderFieldNode(['Units','Ems','Config','GridConnectionPoint'], components.EmsConfig.fields.GridConnectionPoint, ctx)}

      {renderFieldNode(['Units','Ems','Config','MasterSlave'], components.EmsConfig.fields.MasterSlave, ctx)}

      {/* RippleControl ist jetzt vollständig generisch (MaxPowerRate ist seit
          TypeArray ein einziges Feld statt vier Einzelwerten - kein Sonderfall
          mehr, siehe core/field-types.ts -> TypeArray). */}
      {renderFieldNode(['Units','Ems','Config','RippleControl'], components.EmsConfig.fields.RippleControl, ctx)}

      <Collapsible
        title="Config - Power Limit Groups"
        className="card stack"
        actionType="add"
        onAction={() => {addElement(['Units','Ems','Config','PowerLimitGroups'],'PowerLimitGroup')}}
        path={['Units','Ems','Config','PowerLimitGroups']}
        errorPrefixSet={props.errorPrefixSet}
      >
        {getOrCfg(['Units','Ems','Config','PowerLimitGroups'], []).map((e: any, i: number) =>
        {
          const itemPath: PathType = ['Units','Ems','Config','PowerLimitGroups',i];
          return (
            <Collapsible
              key={i}
              title={'Power Limitation Group Ems ' + (i+1)}
              className="card"
              actionType="delete"
              onAction={() => removeElement(['Units','Ems','Config','PowerLimitGroups'],i)}
              path={itemPath}
              errorPrefixSet={props.errorPrefixSet}
            >
              {renderFieldTree(itemPath, components.PowerLimitGroup.fields, ctx)}
            </Collapsible>
          );
        })}
      </Collapsible>

      <Collapsible
        title="Smartmeter"
        className="card stack"
        actionType="add"
        onAction={() => {addElement(['Units','Ems','Equipment','Smartmeter'],'Smartmeter')}}
        path={['Units','Ems','Equipment','Smartmeter']}
        errorPrefixSet={props.errorPrefixSet}
      >
        <NumberField
          path={['Units','Ems','Config','SmartmeterCount']}
          defLink={components.EmsConfig.fields.SmartmeterCount}
        />
        {getOrCfg(['Units','Ems','Equipment','Smartmeter'], []).map((e: any, i: number) =>
        {
          const itemPath: PathType = ['Units','Ems','Equipment','Smartmeter',i];
          return (
            <Collapsible
              key={i}
              title={getOrCfg(['Units','Ems','Equipment','Smartmeter',i,'Type'], 'Unkown Smartmeter') + ' (' + getOrCfg(['Units','Ems','Equipment','Smartmeter',i,'DisplayName'], '') + ')'}
              className="card"
              actionType="delete"
              onAction={() => removeElement(['Units','Ems','Equipment','Smartmeter'],i)}
              path={itemPath}
              errorPrefixSet={props.errorPrefixSet}
            >
              {renderFieldTree(itemPath, smartmeterRest, ctx)}
              {/* HardwareType/HardwareModel bleiben hand-geschrieben: Auswahl von
                  HardwareType belegt HardwareModel automatisch mit dem ersten
                  passenden Modell vor (Seiteneffekt, nicht generisch ableitbar). */}
              <SelectField
                path={['Units','Ems','Equipment','Smartmeter',i,'HardwareType']}
                defLink={components.Smartmeter.fields.HardwareType}
                options={getEmsSmartmeterHardwares()}
                onChange={(v: string) =>
                {
                  const models = getEmsSmartmeterModels(v);
                  setInCfg(['Units','Ems','Equipment','Smartmeter',i,'HardwareType'], v);
                  setInCfg(['Units','Ems','Equipment','Smartmeter',i,'HardwareModel'], models[0]);
                }}
              />
              <SelectField
                path={['Units','Ems','Equipment','Smartmeter',i,'HardwareModel']}
                defLink={components.Smartmeter.fields.HardwareModel}
                options={getEmsSmartmeterModels(getOrCfg(['Units','Ems','Equipment','Smartmeter',i,'HardwareType'], ''))}
              />
              {renderFieldTree([...itemPath, 'Config'], smartmeterConfig.group, ctx)}
            </Collapsible>
          );
        })}
      </Collapsible>


      <Collapsible
        title="Local/Remote Main Units"
        className="card stack"
        actionType="add"
        onAction={() => {addElement(['Units','Ems','Equipment','LocalRemoteSystems'],'SlaveRemoteUM')}}
        path={['Units','Ems','Equipment','LocalRemoteSystems']}
        errorPrefixSet={props.errorPrefixSet}
      >
        <NumberField
          path={['Units','Ems','Config','SystemsInParallelCount']}
          defLink={components.EmsConfig.fields.SystemsInParallelCount}
        />
        {getOrCfg(['Units','Ems','Equipment','LocalRemoteSystems'], []).map((e: any, i: number) =>
        {
          const itemPath: PathType = ['Units','Ems','Equipment','LocalRemoteSystems',i];
          if (e.Type === 'SlaveLocalUM')
          {
            return (
              <Collapsible
                key={i}
                title={(getOrCfg(['Units','Ems','Equipment',"LocalRemoteSystems",i,'Type'], 'Unkown Local System') === 'SlaveLocalUM' ? 'Local System' : 'Unknown Local System') + ' (' + getOrCfg(['Units','Ems','Equipment','LocalRemoteSystems',i,'DisplayName'], '') + ')'}
                className="card"
                path={itemPath}
                errorPrefixSet={props.errorPrefixSet}
              >
                {renderFieldTree(itemPath, slaveLocalRest, ctx)}
                {renderFieldTree([...itemPath, 'Config'], slaveLocalConfig.group, ctx)}
              </Collapsible>
            );
          }
          else if (e.Type === 'SlaveRemoteUM')
          {
            return (
              <Collapsible
                key={i}
                title={(getOrCfg(['Units','Ems','Equipment','LocalRemoteSystems',i,'Type'], 'Unkown Remote System') === 'SlaveRemoteUM' ? 'Remote System' : 'Unknown Remote System') + ' (' + getOrCfg(['Units','Ems','Equipment','LocalRemoteSystems',i,'DisplayName'], '') + ')'}
                className="card"
                actionType="delete"
                onAction={() => removeElement(['Units','Ems','Equipment','LocalRemoteSystems'],i)}
                path={itemPath}
                errorPrefixSet={props.errorPrefixSet}
              >
                {renderFieldTree(itemPath, slaveRemoteRest, ctx)}
                {renderFieldTree([...itemPath, 'Config'], slaveRemoteConfig.group, ctx)}
              </Collapsible>
            );
          }

        })}
      </Collapsible>
    </Collapsible>
  );
}
