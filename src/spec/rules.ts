
export const cardinality = { ems:{smartmeterMax:10, slaveLocalEq:1, slaveRemoteMax:9}, main:{smartmeterMainEq:1, batteryInverterMin:1} } as const
export type Issue = { message: string, path: (string|number)[] }
export function applyCrossRules(config: any, add: (i: Issue)=>void) {
  const hv = config?.ModularPlc?.Hardwarevariante
  const main = config?.Units?.Main; if (!main) return
  const eq = main.Equipment || []; const biList = eq.filter((e:any)=>e?.Type==='BatteryInverter')
  const isTerraHV = typeof hv === 'string' && /terra/i.test(hv); const expectedMainType = isTerraHV ? 'Terra' : 'Blokk'
  if (main.Type !== expectedMainType) add({ message: `Main.Type muss ${expectedMainType} sein (wegen Hardwarevariante=${hv})`, path: ['Units','Main','Type'] })
  biList.forEach((bi:any, idx:number)=>{
    const inv = bi?.Inverter?.Type; const bat = bi?.Battery?.Type; const hasModbus = !!bi?.Modbus
    if (inv === 'TerraInverter'){ 
      if (bat !== 'TerraBattery') add({message:'Bei TerraInverter ist TerraBattery Pflicht', path:['Units','Main','Equipment',idx,'Battery','Type']})
      if (!hasModbus) add({message:'Bei TerraInverter ist Modbus Pflicht', path:['Units','Main','Equipment',idx,'Modbus']}) 
    } else { 
      if (bat === 'TerraBattery') add({message:'TerraBattery verboten wenn Inverter ≠ TerraInverter', path:['Units','Main','Equipment',idx,'Battery','Type']})
      if (hasModbus && bi?.Modbus?.Type==='TerraModbus') add({message:'TerraModbus verboten wenn Inverter ≠ TerraInverter', path:['Units','Main','Equipment',idx,'Modbus']}) 
    }
    if (isTerraHV){ 
      if (inv!=='TerraInverter') add({message:'HV=Terra ⇒ Inverter=TerraInverter', path:['Units','Main','Equipment',idx,'Inverter','Type']})
      if (bat!=='TerraBattery') add({message:'HV=Terra ⇒ Battery=TerraBattery', path:['Units','Main','Equipment',idx,'Battery','Type']})
      if (!hasModbus) add({message:'HV=Terra ⇒ Modbus erforderlich', path:['Units','Main','Equipment',idx,'Modbus']}) 
    } else { 
      if (inv==='TerraInverter') add({message:'HV≠Terra ⇒ kein TerraInverter', path:['Units','Main','Equipment',idx,'Inverter','Type']})
      if (bat==='TerraBattery') add({message:'HV≠Terra ⇒ keine TerraBattery', path:['Units','Main','Equipment',idx,'Battery','Type']})
      if (hasModbus) add({message:'HV≠Terra ⇒ kein Modbus', path:['Units','Main','Equipment',idx,'Modbus']}) 
    }
  })
}
export function applyCardinality(config:any, add:(i:Issue)=>void){
  const emsEq = config?.Units?.Ems?.Equipment ?? []
  const smCount = emsEq.filter((e:any)=>e?.Type==='Smartmeter').length
  const localCount = emsEq.filter((e:any)=>e?.Type==='SlaveLocalUM').length
  const remoteCount = emsEq.filter((e:any)=>e?.Type==='SlaveRemoteUM').length
  if (localCount !== 1) add({message:'SlaveLocalUM muss genau einmal vorhanden sein', path:['Units','Ems','Equipment']})
  if (smCount > 10) add({message:'Smartmeter max. 10', path:['Units','Ems','Equipment']})
  if (remoteCount > 9) add({message:'SlaveRemoteUM max. 9', path:['Units','Ems','Equipment']})
  const mainEq = config?.Units?.Main?.Equipment ?? []
  const smMainCount = mainEq.filter((e:any)=>e?.Type==='SmartmeterMain').length
  const biCount = mainEq.filter((e:any)=>e?.Type==='BatteryInverter').length
  if (smMainCount !== 1) add({message:'SmartmeterMain muss genau einmal vorhanden sein', path:['Units','Main','Equipment']})
  if (biCount < 1) add({message:'Mindestens ein BatteryInverter erforderlich', path:['Units','Main','Equipment']})
}
