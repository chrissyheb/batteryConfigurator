# TODO / Projektstatus

Selbstständige Zusammenfassung des Projektstatus - gedacht, damit auch ohne
Kenntnis vorheriger Chat-Sessions direkt weitergearbeitet werden kann.

## Projekt-Kontext

**Battery Configurator** - Vite/React/TypeScript-Tool, das JSON-Configs für
TwinCAT-PLC-Projekte (Terra/Blokk-Hardware-Varianten) erzeugt. Kein Backend
außer einem simplen Go-Server (`server/`), der die gebaute SPA ausliefert.

## Architektur, die man kennen muss

- **`src/registry/index.ts`** - zentrale `components`-Map (`ComponentDefinition`en).
  Jede Komponente (Smartmeter, BatteryInverter, ...) lebt in
  `src/components/<name>/spec.ts`.
- **`src/core/field-types.ts`** - Feld-Bausteine (`TypeString`, `TypeNumber`,
  `TypeNumberUnit`, `TypeBool`, `TypeIndexString`, `TypeArray`, ...) plus
  `AvailabilitySpec`/`isAvailable` für Version-/HardwareVariant-Gating.
- **`src/core/schema-builder.ts`** - generiert aus dem Field-Spec-Baum ein
  Zod-Schema (`groupSchema`/`fieldSchema`).
- **`src/core/form-renderer.tsx`** - generischer Renderer, der denselben Baum
  als JSX zeichnet (`renderFieldTree`, `GeneratedList`, `GeneratedForm`).
- **`src/spec/builder.ts`** - `validate()`, `getInitialConfig()`,
  `createByKey()`, `isPlausibleConfig()`.
- **`src/spec/rules.ts`** - Cross-Component-Validierung (`applyCrossRules`,
  `applyCardinality`), die zusätzlich zum Zod-Schema läuft.
- **`src/registry/lists.ts`** - Equipment-/Config-Listen (Smartmeter[],
  BatteryInverter[], ...) mit Add/Remove/Cardinality/`indexField`/`countFields`.
- **`src/app/store.ts`** - Reducer (`SET`/`PATCH`/`SET_AT_PATH`/`DELETE_AT_PATH`),
  `useStore()` validiert bei jeder Zustandsänderung neu.
- **`src/ui/Fields.tsx`** - liest/schreibt State über einen globalen Singleton
  (`setGlobalProps`/`gFun()`), NICHT über React-Context.

**Wichtige Namenskonvention:** `Global.ModularPlc.HardwareVariant` ist
`'Terra' | 'Blokk'`, `Units.Main.Type` MUSS immer identisch dazu sein (wird
automatisch von `App.tsx` per `useEffect` synchronisiert, siehe unten).

## Arbeitsweise, die sich bewährt hat

- Kein Test-Framework vorhanden. Verifikation lief bisher über
  `npx tsc --noEmit -p tsconfig.json` (Typecheck) plus Ad-hoc-Skripte mit
  `npx tsx --tsconfig tsconfig.json <script>.mts`, geschrieben ins
  Projekt-Root und danach wieder gelöscht.
- **Zirkulärer Import:** `spec/builder.ts` <-> `registry/index.ts` <->
  `registry/lists.ts`. Funktioniert in der echten App (Vite-Bundling,
  Einstieg über `main.tsx`), bricht aber unter `tsx`/Node-ESM, wenn man
  z.B. `battery-inverter/spec.ts` direkt als ersten Import eines Testskripts
  nimmt. **Workaround:** immer zuerst
  `import { validate, getInitialConfig } from './src/spec/builder.ts';`
  importieren, danach alles andere - das reproduziert die Ladereihenfolge
  der echten App und vermeidet TDZ-Fehler.
- Empfehlung: einen Vitest-Test-Grundstock aufsetzen (Vite ist schon da),
  der die unten genannten `validate()`-Fälle dauerhaft absichert, statt sie
  jedes Mal neu von Hand zu verifizieren.

## Bereits erledigt (chronologisch, mit Kernaussage)

1. `clearVariableName`-Crash bei leerem String beheben -> Funktion später
   komplett entfernt (siehe Punkt "plcVariableName").
2. `label ?? pathDefined ? x : y`-Operator-Präzedenz-Bug in `ui/Fields.tsx`
   (4 Stellen) behoben.
3. `TypeNumberUnit`-Felder wurden nie validiert (`type` war fälschlich
   `'string'` statt `'numberWithUnit'`) -> `core/field-types.ts` gefixt,
   19 betroffene Felder.
4. Import einer unvollständigen JSON crashte die App -> `spec/rules.ts:90`
   fehlender Optional-Chain ergänzt, plus neue `isPlausibleConfig()` in
   `spec/builder.ts` (grober Shape-Check Global/Units) für Import
   (`utils/io.ts`) und localStorage-Laden (`utils/storage.ts`).
5. `BatteryInverter.Index` wurde nie in die Config geschrieben, nur in der
   UI überschrieben -> `registry/lists.ts` bekam `indexField`,
   `core/form-renderer.tsx`s `GeneratedList` führt es jetzt per `useEffect`
   automatisch nach.
6. Name/DisplayName-Merge (User-Feature-Wunsch): überall wo beide
   existierten, zu einem `Name`-Feld zusammengeführt, das Leerzeichen/
   Sonderzeichen erlaubt (`battery-inverter`, `smartmeter-ems`,
   `smartmeter-main`, `slave-local-um`, `slave-remote-um` specs;
   `registry/lists.ts`-Titel angepasst).
7. `plcVariableName`-Feature komplett entfernt (war nach Punkt 6 nirgends
   mehr nötig) - `core/field-types.ts`, `core/schema-builder.ts`,
   `ui/Fields.tsx`, `utils/helper.ts` (`clearVariableName` gelöscht).
8. Hängengebliebene Dropdowns: wenn ein gespeicherter Enum-/IndexString-Wert
   nicht mehr in der (HardwareVariant-gefilterten) Optionsliste enthalten
   war, zeigte der Browser fälschlich die erste Option als ausgewählt an,
   ohne dass ein `change`-Event feuerte -> `core/form-renderer.tsx`s
   `renderLeaf` listet den aktuellen (ggf. ungültigen) Wert jetzt immer mit.
9. "Unknown key"-Validierungsfehler waren nicht behebbar -> `app/App.tsx`
   zeigt jetzt einen "Entfernen"-Button neben solchen Fehlern, der
   `del(path)` aufruft.
10. `CurrentTransformerPrimaryCurrent` war fälschlich bei **jedem**
    HardwareType (nicht nur Beckhoff) Pflicht, sobald `Version >= 0.0.7` ->
    `smartmeter-ems/spec.ts`: `when`-Fallback beim Schema-Bau (kein
    Instanz-Pfad) von `true` auf `false` gedreht; echte Pflicht läuft
    weiterhin über die Cross-Rule `validateCurrentTransformer`.
11. Modbus-Karte (`battery-inverter/spec.ts` `fieldOverride.Modbus`) wurde
    ausgeblendet, sobald der HardwareVariant Modbus nicht erlaubte - auch
    wenn schon ein (ungültiges) Modbus-Objekt existierte -> erst auf "nur
    ausblenden wenn nichts vorhanden" gefixt, dann auf User-Wunsch komplett
    entfernt: die Karte wird **nie mehr** ausgeblendet, Gültigkeit prüft
    weiterhin die Cross-Rule.
12. `HardwareVariant`-Wert `'BlokkV3'` überall zu `'Blokk'` umbenannt
    (`components/global/spec.ts` + alle `availability.hardwareVariants`-Gates
    in `battery-inverter/spec.ts`/`main-config/spec.ts`, Label `'BlokkNNV3'`
    blieb unverändert - ist ein Hardware-Modellname, keine Variante).
13. `Units.Main.Type` muss immer `Global.ModularPlc.HardwareVariant`
    entsprechen -> neuer `useEffect` in `app/App.tsx` synct das automatisch;
    `spec/builder.ts`s `getInitialConfig()` leitet es direkt ab statt
    unabhängig hartzukodieren.
14. Ungenutztes/typunsicheres `MainType`-Feld-Spec-Objekt aus
    `main-config/spec.ts` und der `components`-Map (`registry/index.ts`)
    entfernt (war nie ein echtes `ComponentDefinition`, `createByKey('MainType', ...)`
    hätte zur Laufzeit geworfen).
15. `readOnly` auf Checkbox (`ui/Fields.tsx` `CheckField`) wirkte nicht
    (HTML ignoriert das bei `type="checkbox"`) -> auf `disabled` umgestellt.
16. Namens-Duplikatsprüfung (`spec/rules.ts`) deckte nur den
    `BatteryInverter`-Teilbaum ab -> neue `flagDuplicateNames()`-Helper-
    Funktion, jetzt getrennt pro Unit: Ems (Smartmeter[] +
    LocalRemoteSystems[]) und Main (SmartmeterMain + BatteryInverter[]/
    Battery/Inverter/Modbus) - derselbe Name darf zwischen Ems und Main
    vorkommen, nur innerhalb derselben Unit nicht doppelt.
17. Vertauschte ARIA-Labels in `ui/Cards.tsx` (`expand`/`collapse` genau
    verkehrt herum) korrigiert; `aria-describedby` zeigte in allen 5
    Feldkomponenten (`ui/Fields.tsx`) auf rohen Text statt einer Element-ID
    -> neue `.visually-hidden`-CSS-Klasse (`styles/app.css`) +
    `HintText`-Helper-Komponente, jedes Feld hat jetzt eine
    `useId()`-basierte Hint-ID.
18. Platzhalter-Hint `'Bla'` in `TextField` entfernt.
19. **Toter/irreführender Code**:
    - `spec/builder.ts`: 20 ungenutzte Getter-Funktionen entfernt
      (`getInverterTypes`, `getUiMeta`, etc.), dazu `EmsHardwareKey`/
      `MainHardwareKey`-Typen und `nextIndexForType`; entsprechend viele
      überflüssig gewordene Importe bereinigt; ungenutzten `key`-Parameter
      aus `resolveScalars` entfernt.
    - `core/schema-builder.ts`: beide `Array.isArray`-Zweige in
      `groupSchema` entfernt (verifiziert unerreichbar - keine Feld-Spec
      ist je ein Array - und zusätzlich fehlerhaft); doppelten `int()`-
      Aufruf im `number`-Case entfernt.
    - `app/store.ts`: wirkungslose `parent = parent.splice(...)`-Zuweisung
      in `delIn` bereinigt.
    - `spec/rules.ts`: Legacy-Fallback `emsEq.emsEqSmartmeter?.length`
      entfernt; leeren `if`-Block mit auskommentiertem `add(...)` entfernt
      (Grund: Mindestanzahl BatteryInverter läuft schon über das
      Zod-Schema).
    - `ui/Cards.tsx`: ungenutztes `contentWrapperRef` entfernt.
    - `app/App.tsx`: ungenutzten `errorAt`-Import entfernt.
    - `ui/Fields.tsx`: Kommentar "links ausrichten" bei zentrierender
      Tooltip-Berechnung korrigiert.

## Noch offen (Empfehlung: Reihenfolge unten)

**Empfohlener nächster Schritt:** Minimaler Vitest-Grundstock für
`validate()` (Duplikat-Namen pro Unit, HardwareVariant-Mismatches,
`numberWithUnit`-Grenzwerte, Unknown-Key-Handling, Modbus-Sichtbarkeit) -
sichert alle obigen Fixes dauerhaft ab, geringes Risiko, Vite/Vitest-Setup
ist trivial.

**Architektur** (größer, riskanter, ohne Zeitdruck):
- `ui/Fields.tsx`: globaler Singleton via `setGlobalProps`/`gFun()` statt
  React-Context - verhindert `React.memo`, macht Tests global-state-
  abhängig.
- Durchgängig `any`-Typen statt eines aus dem Zod-Schema abgeleiteten
  Config-Typs (`validate(cfg: any)`, `createByKey(): any`, alle
  Feldkomponenten `props: any`); Section-Props (`EmsSection`/`MainSection`/
  `SystemSection`) dreifach fast identisch dupliziert.
- `app/store.ts`: Zod-Schema wird bei **jedem** Tastendruck komplett neu
  gebaut (`buildConfigSchema` in `useMemo`, hängt nur an `VersionContext`,
  aber ungecacht).
- `app/store.ts:172`: `useMemo`-Deps unvollständig (`addIssues` fehlt,
  läuft nur indirekt über `issues`-Zähler mit); gemeldete "path not
  defined"-Fehler werden nie geleert.
- Kein konkretes Migrations-Beispiel für Config-Schema-Versionierung -
  Ansatz ist geklärt (`sinceVersion`/`untilVersion` pro Feld + Transform-
  Funktion beim Laden, `Global.ModularPlc.Version` als Basis, **kein**
  separates `schemaVersion`-Feld), aber noch nicht an einem echten Fall
  demonstriert (Kandidat: `MaxPowerRate0..3` -> Array in
  `ems-config/spec.ts`).

**Projekt-Hygiene:**
- Kein `.gitattributes` - weiterhin LF/CRLF-Warnungen bei jedem `git diff`.
- Sprachmix (`index.html lang="de"`, englische UI-Texte, deutsche
  Code-Kommentare).
- `utils/io.ts`: `URL.revokeObjectURL(url)` direkt nach `a.click()` - kann
  in manchen Browsern den Download-Start überholen.
- Kein Linter/CI.
