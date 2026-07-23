import { TypeString, TypeNumber, TypeNumberUnit, TypeIndexString, TypeBool } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const System: ComponentDefinition = {
  key: 'System',
  category: 'system',
  fields: {
    SerialNumber: TypeString({ required: true, hint: 'Serial number of the BESS system \n TEMSM-001 \n TE0000000047 \n BK0000000246' }),
    BatteryBalancing: {
      group: {
        PreemptiveMode: TypeIndexString({ required: true, hint: 'Balancing mode used for preemptive balancing', enumRef: ['system', 'batteryBalancingModes'] }),
        PreemptiveDaysToEnable: TypeNumber({ required: true, hint: 'Preemptive balancing starts number of days after last successful balancing process.\n >= 0 \n 0: preemptive balancing disabled ', min: 0, max: 365, int: true }),
        PreemptiveMaxGridChargePower: TypeNumberUnit({ required: true, hint: 'Max power sum used for charging from grid during preemptive balancing \n >= 0', min: 0, unit: 'kW' }),
        ForcedDaysToEnable: TypeNumber({ required: true, hint: 'Balancing is forced number of days after last successful balancing process. \n >= 0', min: 0, max: 365, int: true }),
        ForcedMaxGridChargePowerPerInverter: TypeNumberUnit({ required: true, hint: 'Max power per inverter used for charging from grid during forced balancing \n >= 0 \n 0: forced balancing disabled', min: 0, unit: 'kW' }),
      }
    },
    ExternalControl: {
      group: {
        FallbackMode: TypeIndexString({ required: true, hint: 'Fallback operation mode if connection to external control unit (BEAAM, Master-BESS, external EMS) is lost', enumRef: ['system', 'externalControlOperationModes'] }),
        EmsEzaCommunicationRequired: TypeBool({ required: true, hint: 'Choose whether an active communication from an EZA controller is mandatory for operation or not' }),
      }
    }
  },
  defaults: {
    SerialNumber: 'TE0000000000',
    BatteryBalancing: {
      PreemptiveMode: [0, 'None'],
      PreemptiveDaysToEnable: 60,
      PreemptiveMaxGridChargePower: '30kW',
      ForcedDaysToEnable: 90,
      ForcedMaxGridChargePowerPerInverter: '5kW'
    },
    ExternalControl: {
      FallbackMode: [0, 'Standard'],
      EmsEzaCommunicationRequired: false
    }
  }
};
