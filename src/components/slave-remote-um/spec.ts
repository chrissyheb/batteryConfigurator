import { TypeString, TypeUuid, TypeIPv4 } from '@/core/field-types';
import type { ComponentDefinition } from '@/registry/types';

export const SlaveRemoteUM: ComponentDefinition = {
  key: 'SlaveRemoteUM',
  category: 'ems-equipment',
  fields: {
    Type: { const: 'SlaveRemoteUM', required: true },
    Name: TypeString({ required: true, hint: 'Component name (used in TwinCAT project & log files)' }),
    Guid: TypeUuid({ required: true, hint: 'GUID of component for TwinCAT project generation/update' }),
    Config: {
      flatten: true,
      group: {
        IpAddress: TypeIPv4({ required: true, hint: 'IP Address of remote system' })
      }
    }
  },
  defaults: {
    Type: 'SlaveRemoteUM',
    Name: 'Remote Main Unit ${n0}',
    Guid: '@uuid',
    Config: {
      IpAddress: '192.168.100.10'
    }
  }
};
