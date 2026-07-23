import { TypeNumber, TypeNumberUnit, TypeBool, TypeIndexString, IndexStringType } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const rippleControlElectricalContactTypes: IndexStringType[] = [[0, 'Unknown'], [1, 'NormallyClosed'], [3, 'NormallyOpenWirebreakProof'], [4, 'NormallyOpenNotWirebreakProof']];
export const rippleControlPowerLimitDirections: IndexStringType[] = [[0, 'Bidirectional'], [1, 'ChargeOnly'], [2, 'DischargeOnly']];

export const EmsConfig: ComponentDefinition = {
  key: 'EmsConfig',
  category: 'ems-config',
  fields: {
    SmartmeterCount: TypeNumber({ required: true, hint: 'Number of used Smartmeters \n - automatically calculated -', min: 0, int: true, readOnly: true }),
    SystemsInParallelCount: TypeNumber({ required: true, hint: 'Number of parallel systems within Main/Support combination \n - automatically calculated -', min: 1, int: true, readOnly: true }),
    GridConnectionPoint: {
      group: {
        PowerGridConsumptionLimit: TypeNumberUnit({ required: true, hint: 'Max. permitted consumption power from grid \n if no limit set to max. fuse power \n >= 0', min: 0, unit: 'kW' }),
        PowerGridFeedInLimit: TypeNumberUnit({ required: true, hint: 'Max. permitted feed in power from grid \n if no limit set to max. fuse power \n >= 0', min: 0, unit: 'kW' }),
        PowerGridConsumptionOffset: TypeNumberUnit({ required: true, hint: 'Control offset for grid connection point', unit: 'kW' }),
      }
    },
    MasterSlave: {
      group: {
        PowerActiveInstalledTotal: TypeNumberUnit({ required: true, hint: 'Sum of installed inverter active power (total Main/Support combination) \n > 0', min: 0, unit: 'kW' }),
        CapacityInstalledTotal: TypeNumberUnit({ required: true, hint: 'Sum of installed battery capacity (total Main/Support combination) \n > 0', min: 0, unit: 'kWh' }),
        PowerChargeLimitTotal: TypeNumberUnit({ required: true, hint: 'Max charge power (or installed active power) of total Main/Support combination \n >= 0', min: 0, unit: 'kW' }),
        PowerDischargeLimitTotal: TypeNumberUnit({ required: true, hint: 'Max discharge power (or installed active power) of total Main/Support combination \n >= 0', min: 0, unit: 'kW' }),
      }
    },
    RippleControl: {
      group: {
        DiContactType: TypeIndexString({ required: true, hint: 'Contact evaluation type \n Normally Closed (NC): limitation by lowest input with 0V (wire break proof) \n Normally Open (NO): limitation by lowest input with 24V\n        - not wirebreak proof: no signal -> limit 100% (=no limit)\n        - wirebreak proof: no signal -> limit 0%', enumRef: rippleControlElectricalContactTypes }),
        PowerLimitDirection: TypeIndexString({ required: true, hint: 'Direction of power limitation', enumRef: rippleControlPowerLimitDirections }),
        ForceBessPowerReduction: TypeBool({ required: true, hint: 'TRUE: power at BESS terminals is relevant and has to be reduces according to EVU setpoint \n FALSE: power at grid connection point is relevant' }),
        LimitToZeroOnMultipleSelection: TypeBool({ required: true, hint: 'TRUE: Limit power to 0% if multiple inputs are selected \n FALSE: Limit power to rate of minimal active input ' }),
        NominalPowerPV: TypeNumberUnit({ required: true, hint: 'used to limit PV max power setpoint \n >= 0', min: 0, unit: 'kW' }),
        NominalPowerProductionTotal: TypeNumberUnit({ required: true, hint: 'Sum of installed generator power wihtin the whole plant \n used for limitation at grid connection point (ForceBessPowerReduction = FALSE) \n >= 0', min: 0, unit: 'kW' }),
        MaxPowerRate0: TypeNumber({ required: true, hint: 'Power rates for EVU control \n 0 <= MaxPowerRates <= 1', min: 0, max: 1 }),
        MaxPowerRate1: TypeNumber({ required: true, hint: 'Power rates for EVU control \n 0 <= MaxPowerRates <= 1', min: 0, max: 1 }),
        MaxPowerRate2: TypeNumber({ required: true, hint: 'Power rates for EVU control \n 0 <= MaxPowerRates <= 1', min: 0, max: 1 }),
        MaxPowerRate3: TypeNumber({ required: true, hint: 'Power rates for EVU control \n 0 <= MaxPowerRates <= 1', min: 0, max: 1 }),
      }
    }
  },
  defaults: {
    SmartmeterCount: 1,
    SystemsInParallelCount: 1,
    GridConnectionPoint: {
      PowerGridConsumptionLimit: '0kW',
      PowerGridFeedInLimit: '0kW',
      PowerGridConsumptionOffset: '0kW'
    },
    MasterSlave: {
      PowerActiveInstalledTotal: '0kW',
      CapacityInstalledTotal: '0kWh',
      PowerChargeLimitTotal: '0kW',
      PowerDischargeLimitTotal: '0kW'
    },
    PowerLimitGroups: [],
    RippleControl: {
      DiContactType: [4, 'NormallyOpenNotWirebreakProof'],
      PowerLimitDirection: [2, 'DischargeOnly'],
      ForceBessPowerReduction: false,
      LimitToZeroOnMultipleSelection: false,
      NominalPowerPV: '1000000000kW',
      NominalPowerProductionTotal: '1000000000kW',
      MaxPowerRate0: 1,
      MaxPowerRate1: 0.6,
      MaxPowerRate2: 0.3,
      MaxPowerRate3: 0,
    }
  }
};
