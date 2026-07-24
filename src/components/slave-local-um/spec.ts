import { TypeString, TypeUuid, TypeIPv4 } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const SlaveLocalUM: ComponentDefinition = {
  key: 'SlaveLocalUM',
  category: 'ems-equipment',
  fields: {
    Type: { const: 'SlaveLocalUM', required: true },
    Name: TypeString({ required: true, plcVariableName: true, hint: 'Component name in TwinCAT code \n - no spaces permitted -' }),
    DisplayName: TypeString({ required: true, hint: 'Component name in Log files' }),
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
    Config: {
      flatten: true,
      group: {
        IpAddress: TypeIPv4({ required: true, hint: 'IP Address of local system' })
      }
    }
  },
  defaults: {
    Type: 'SlaveLocalUM',
    Name: 'LocalMainUnit',
    DisplayName: 'Local Main Unit',
    Guid: '@uuid',
    Config: {
      IpAddress: '192.168.100.10'
    }
  }
};
