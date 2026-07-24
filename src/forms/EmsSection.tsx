
import React from 'react';
import { NumberField } from '@/ui/Fields';
import { components } from '@/registry';
import { Collapsible } from '@/ui/Cards';
import { renderFieldTree, renderFieldNode, GeneratedList, type FormRendererCtx } from '@/core/form-renderer';

// Ems hat keine einzelne "Ems"-ComponentDefinition, die Config+Equipment
// vereint (das Layout kombiniert EmsConfig-Gruppen mit mehreren Equipment-
// Listen) - deshalb kein GeneratedForm für die ganze Section, sondern
// gezielter Einsatz von renderFieldNode für die listenfreien Teile und
// <GeneratedList> für die Equipment-/Config-Listen (Smartmeter[],
// LocalRemoteSystems[], PowerLimitGroups[] - siehe registry/lists.ts).
// Add/Remove-Mechanik, Cardinality, Titel, die HardwareType->HardwareModel-
// Kopplung UND das Nachführen von SmartmeterCount/SystemsInParallelCount
// (countFields, siehe registry/lists.ts + core/form-renderer.tsx ->
// GeneratedList) stecken jetzt vollständig in der jeweiligen ListDefinition
// bzw. components/*/spec.ts - diese Datei enthält keine Listen-spezifische
// Logik mehr.
export default function EmsSection(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any, errorPrefixSet:any })
{
  const ctx: FormRendererCtx = {
    cfg: props.cfg,
    getOrCfg: props.getOrCfg,
    setInCfg: props.setInCfg,
    delFromCfg: props.delFromCfg,
    errorPrefixSet: props.errorPrefixSet,
    renderFieldTree
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

      {/* RippleControl ist vollständig generisch (MaxPowerRate ist seit
          TypeArray ein einziges Feld statt vier Einzelwerten - kein Sonderfall
          mehr, siehe core/field-types.ts -> TypeArray). */}
      {renderFieldNode(['Units','Ems','Config','RippleControl'], components.EmsConfig.fields.RippleControl, ctx)}

      <GeneratedList listKey="EmsPowerLimitGroups" title="Config - Power Limit Groups" {...ctx} />

      <GeneratedList
        listKey="EmsSmartmeter"
        title="Smartmeter"
        extra={<NumberField path={['Units','Ems','Config','SmartmeterCount']} defLink={components.EmsConfig.fields.SmartmeterCount} />}
        {...ctx}
      />

      <GeneratedList
        listKey="EmsLocalRemoteSystems"
        title="Local/Remote Main Units"
        extra={<NumberField path={['Units','Ems','Config','SystemsInParallelCount']} defLink={components.EmsConfig.fields.SystemsInParallelCount} />}
        {...ctx}
      />
    </Collapsible>
  );
}
