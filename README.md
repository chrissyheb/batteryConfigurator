# Battery Configurator (Template)

Minimaler React + TypeScript Konfigurator:
- Units: **EMS** & **Main**
- EMS: `Smartmeter`, `SlaveLocalUM`
- Main: `BatteryInverter`, `SmartmeterMain`
- **Terra-Kopplung**: `TerraInverter` ⇒ `TerraBattery` + `TerraModbus`; Nicht-Terra ⇒ keine Terra-Komponenten, Battery Pflicht
- **Import** (JSON) mit Validierung, **Export** (deaktiviert bei Fehlern)
- Live-Validierung via Zod

## Start
```bash
npm install
npm run dev
