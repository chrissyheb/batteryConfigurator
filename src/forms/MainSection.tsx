
import React from 'react';
import { components } from '@/registry';
import { Collapsible } from '@/ui/Cards';
import { renderFieldTree, renderComponentFields, GeneratedList, type FormRendererCtx } from '@/core/form-renderer';

// BatteryInverter[] (inkl. Index/Inverter/Battery/Modbus-Sonderfälle) läuft
// jetzt vollständig über <GeneratedList listKey="MainBatteryInverter"/>
// (siehe registry/lists.ts) - Index ist dort über den Listenindex adressiert,
// Inverter/Battery/Modbus über die jeweilige ComponentDefinition
// (Modbus-Toggle als fieldOverride, siehe components/battery-inverter/spec.ts).
// Das Nachführen von BatteryCount/InverterCount (countFields, siehe
// registry/lists.ts + core/form-renderer.tsx -> GeneratedList) läuft ebenfalls
// dort, nicht mehr als eigener useEffect hier.
// SmartmeterMain ist seit der HardwareType/HardwareModel/
// CurrentTransformerPrimaryCurrent-Migration auf deklarative Hooks
// (onChangeEffect/enumFrom/readOnlyWhen, siehe components/smartmeter-main/spec.ts)
// ebenfalls vollständig generisch - kein Feld dieser Datei muss mehr
// hand-geschrieben werden.
export default function MainSection(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; delFromCfg:(p: any) => void; hasCfg:(p: any) => boolean; errorIndex: any, errorPrefixSet: any })
{
  const { cfg } = props;

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

      <GeneratedList listKey="MainPowerLimitGroups" title="Config - Power Limit Groups" {...ctx} />

      <Collapsible
        title={(cfg.Units?.Main?.Equipment?.SmartmeterMain?.Type ?? 'Unkown Smartmeter Type') + ' (' + (cfg.Units?.Main?.Equipment?.SmartmeterMain?.Name ?? '') + ')'}
        className="card"
        path={['Units','Main','Equipment','SmartmeterMain']}
        errorPrefixSet={props.errorPrefixSet}
      >
        {renderComponentFields(components.SmartmeterMain, ['Units','Main','Equipment','SmartmeterMain'], ctx)}
      </Collapsible>

      <GeneratedList listKey="MainBatteryInverter" title="Battery & Inverter" {...ctx} />
    </Collapsible>
  );
}
