
import React from 'react';
import { components } from '@/registry';
import { GeneratedForm } from '@/core/form-renderer';

// System hat weder Listen (Smartmeter[], BatteryInverter[], ...) noch
// Cross-Field-Seiteneffekte (HardwareType -> HardwareModel, Modbus-Toggle) -
// deshalb als erste Komponente vollständig über den generischen Renderer
// abgedeckt (siehe core/form-renderer.tsx). Gruppentitel ("Battery Balancing",
// "External Control") kommen aus components/system/spec.ts (`title` an den
// jeweiligen group-Knoten).
export default function SystemSection(props: { cfg: any; setCfg: (c: any) => void; setInCfg:(p: any, v: any) => void; getCfg: (p: any) => any; getOrCfg:(p: any, v: any) => any; errorIndex: any, errorPrefixSet:any })
{
  return (
    <GeneratedForm
      def={components.System}
      path={['System']}
      title="System"
      cfg={props.cfg}
      getOrCfg={props.getOrCfg}
      setInCfg={props.setInCfg}
      errorPrefixSet={props.errorPrefixSet}
    />
  );
}
