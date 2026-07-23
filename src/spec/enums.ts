// Zentrale Enum-/Wertelisten, von mehreren components/<name>/spec.ts referenziert
// (per enumRef: ['domain','key']). Bisher Teil von spec/catalog.ts.
//
// Hinweis Versionierung: enums.global.libVersion ist die Liste der wählbaren
// PLC-Lib-Versionen (Global.ModularPlc.Version). Diese steuert über
// core/versioning.ts (sinceVersion/untilVersion), welche Felder/Komponenten
// aktuell verfügbar sind.

import type { IndexStringType } from '@/core/field-types';

export const enums = {
  global: {
    libVersion: ['3.0.109', '3.0.108', '0.0.7', '0.0.6', '0.0.5'],
    hardwareVariant: ['Terra', 'BlokkV3']
  },
  system: {
    batteryBalancingModes: [[0, 'None'], [1, 'TotalDisabledConsumptionOptimizationDischarging'], [2, 'TotalChargeFromGrid'], [10, 'RoundRobinCrossCharge'], [11, 'RoundRobinChargeFromGrid']] as IndexStringType[],
    externalControlOperationModes: [[0, 'Standard'], [1, 'OffsetOnStandard'], [2, 'InverterSetpoint'], [3, 'GridSetpoint'], [4, 'GridSetpointReplaceConsumptionOptimization'], [5, 'InverterSetpointReplaceConsumptionOptimization'], [6, 'GRIIDReplaceConsumptionOptimization'], [7, 'FrequencyContainmentReserve'], [99, 'StandBy'], [100, 'Maintenance']] as IndexStringType[]
  },
  ems: {
    smartmeterHardwareToTypes: {
      CarloGavazzi: ['EM24'],
      Phoenix: ['EM375', 'MA370'],
      Janitza: ['UMG 96 PA', 'UMG 96 PQ', 'UMG 96 RM', 'UMG 509 Pro', 'UMG 604 Pro', 'UMG 801'],
      Custom: ['Custom'],
      Beckhoff: ['El34x3'],
      Virtual: ['Virtual']
    },
    smartmeterUseCaseTypes: [[0, 'Undefined'], [2, 'GridConnectionPointControl'], [3, 'PowerLimitationGroupEms1'], [4, 'PowerLimitationGroupEms2'], [5, 'PowerLimitationGroupMain1'], [6, 'PowerLimitationGroupMain2']] as IndexStringType[],
    smartmeterPowerSignTypes: [[0, 'Positive'], [1, 'Negative']] as IndexStringType[],
    rippleControlElectricalContactTypes: [[0, 'Unknown'], [1, 'NormallyClosed'], [3, 'NormallyOpenWirebreakProof'], [4, 'NormallyOpenNotWirebreakProof']] as IndexStringType[],
    rippleControlPowerLimitDirections: [[0, 'Bidirectional'], [1, 'ChargeOnly'], [2, 'DischargeOnly']] as IndexStringType[]
  },
  main: {
    smartmeterHardwareToTypes: {
      Virtual: ['Virtual'],
      Beckhoff: ['El34x3']
    },
    types: ['Terra', 'Blokk'],
    controlCabinetTypes: [[0, 'Undefined'], [10, 'TerraEmsBoxV1'], [11, 'TerraEmsBoxV1.5'], [12, 'TerraEmsBoxV2'], [20, 'TerraHub'], [50, 'BlokkNNV3']] as IndexStringType[],
  },
  batteryInverter: {
    inverterTypes: ['InverterTerra', 'InverterKaco'],
    batteryTypes: ['BatteryTerra', 'BatteryPylontechM1xBms'],
    modbusTypes: ['(not available)', 'BatteryInverterModbus']
  },
  inverterHardwareTypes: ['SofarTerra', 'Kaco'],
  batteryHardwareTypes: ['SofarTerra', 'PylontechM1C']
} as const;
