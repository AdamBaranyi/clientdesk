# Diagnosen

Befunde aus diesem Projekt, die nicht durch Hinsehen zu finden waren. Je Eintrag: was zu sehen
war, was gemessen wurde, woran es lag, was es jetzt hält.

Der Sinn ist nicht Vollständigkeit, sondern Nachvollziehbarkeit. Ein Fehler, der einmal still
zugeschlagen hat, schlägt wieder zu — und beim zweiten Mal soll die Suche kurz sein.

Vier Einträge sind **Fehldiagnosen**: dort war die erste Erklärung falsch. Die stehen hier
ausdrücklich mit drin, weil eine falsche Fährte teurer ist als der Fehler selbst.

---

## 1 · Ungeschichtetes CSS schlägt jede Tailwind-Utility

**Symptom.** `no-underline` stand an zwanzig Stellen in vierzehn Dateien und hat nie gewirkt.
Monate später dasselbe mit `text-muted` auf Links.

**Messung.**

```js
const aktiv = document.querySelector('nav a[aria-current="page"]');
const inaktiv = document.querySelector('nav a:not([aria-current])');
getComputedStyle(aktiv).color; // rgb(237, 235, 227)
getComputedStyle(inaktiv).color; // rgb(237, 235, 227)  ← identisch
```

**Ursache.** Regeln ausserhalb jeder Kaskadenschicht gewinnen gegen Regeln in `@layer utilities`,
**unabhängig von der Spezifität**. `a { color: … }` in `global.css` lag ungeschichtet und schlug
damit jede Utility-Klasse. Kein Fehler, keine Warnung, die Klasse steht im Markup und tut nichts.

**Korrektur.** Die Basisregeln für Links liegen in `@layer base`. Damit sind sie das, was sie sein
sollen: eine Vorgabe, die man überschreiben kann.

**Regel.** Alles, was in `global.css` ein Element global anspricht, gehört in eine Schicht. Wer
eine Utility-Klasse setzt und keine Wirkung sieht, prüft zuerst die Schichtung — nicht die
Spezifität.

---

## 2 · `flushSync` kommt gegen `startTransition` nicht an

**Symptom.** Der Seitenübergang mit geteiltem Element lief, sah aber aus wie eine gewöhnliche
Überblendung. Kein Fehler, keine Warnung.

**Messung.** `document.startViewTransition` umhüllt und beide Schnappschüsse protokolliert:

```
{ phase: "alter Schnappschuss", benannteZeile: ["Uferpark Gastro"] }
{ phase: "neuer Schnappschuss", ueberschrift: "Kunden" }   ← noch die alte Seite
```

**Ursache.** `startViewTransition` fotografiert vor und nach dem Rückruf. Das Lehrbuchmuster legt
`flushSync` um die Navigation — aber React Router wickelt jede Navigation in `startTransition`, und
eine Transition lässt sich nicht synchron erzwingen. Der zweite Schnappschuss traf die alte Seite.

**Korrektur.** Der Rückruf gibt ein Promise zurück, das die neue Überschrift aus einem
Layout-Effekt auflöst; gemessen 33 ms. Eine Frist von 250 ms löst es notfalls, damit ein
Fehlerzustand den Übergang nicht hängen lässt.

**Regel.** Wenn eine Bibliothek Zustandswechsel in `startTransition` legt, ist jedes „synchron
erzwingen" eine Annahme. Nachmessen, was der Browser tatsächlich sieht.

---

## 3 · Abgebrochene Seitenübergänge lecken Zurückweisungen

**Symptom.** Je Navigation eine `InvalidStateError` in der Konsole.

**Messung.**

```js
window.addEventListener('unhandledrejection', (e) => protokoll.push(e.reason?.name));
// nach einem Klick: ["InvalidStateError"]
```

**Ursache.** Ein Übergang bricht im Alltag ab — zweiter Klick, Zurück-Taste, Tabwechsel. Dann weist
der Browser `ready` **und** `finished` zurück. Ohne Behandlung landet das als unbehandelte
Zurückweisung.

**Korrektur.** Beide Promises bekommen ein `catch`, das den Abbruch schluckt; der
`view-transition-name` wird trotzdem entfernt, sonst wäre er beim nächsten Übergang doppelt
vergeben.

**Regel.** Ein Abbruch ist hier der Normalfall und kein Fehler. Aber er muss behandelt werden, sonst
verrauscht die Konsole und echte Fehler gehen darin unter.

---

## 4 · Fehldiagnose: `ResizeObserver` feuert in der Fensteremulation nicht

**Symptom.** Beim Verkleinern auf 320 Pixel blieb das Diagramm auf 1118 Pixeln stehen und die Seite
lief seitlich über — ein Verstoss gegen eine harte Projektregel.

**Erste Erklärung.** „Recharts reagiert nicht auf Grössenänderungen." Ich hatte bereits begonnen,
die Grössenmessung selbst zu schreiben.

**Messung, die das widerlegt.**

```js
Layout-Container:  422 px
window.innerWidth: 1147 px   ← die Seite weiss nichts von der Änderung
resize-Ereignisse: []
ResizeObserver:    []
```

**Ursache.** Die Emulation ändert das Layout-Ansichtsfenster, benachrichtigt die Seite aber nicht.
Kein auf Grössenbeobachtung gebautes Bauteil kann darauf reagieren — Recharts eingeschlossen. Mit
Neuladen bei der jeweiligen Breite: 480 → 422, 320 → 262, kein Überlauf.

**Korrektur.** Am Produkt **nichts**. Eine eigene Messung hätte denselben blinden Fleck gehabt und
wäre Code gegen ein Problem gewesen, das es nicht gibt.

**Regel.** Prüfbreiten werden **je Breite neu geladen**, nie durch Ziehen geändert. Steht als
Kommentar in `playwright.config.ts`, damit es niemand später „vereinfacht".

---

## 5 · Fehldiagnose: axe misst Kontraste mitten in der Bewegung

**Symptom.** Kontrastverletzungen im Kennzahlband — bei manchen Breiten, beim nächsten Lauf bei
anderen. Im Einzellauf nie.

**Erste Erklärung.** „Ein echter Kontrastfehler, der nur in bestimmten Umbrüchen auftritt."

**Messung, die das widerlegt.** Derselbe Lauf einzeln, mit ausgegebenen Farben: kein Befund. Der
Unterschied war die Parallelität, nicht die Breite.

**Ursache.** Der Eintritt beginnt bei Deckkraft null und hält diesen Wert dank `fill: both` auch
vor dem Start. Unter vier gleichzeitigen Arbeitern erwischt axe dieses Fenster. Erschwerend: das
Kennzahlband hängt sich erst ein, wenn seine Abfrage geantwortet hat — wer vorher `finish()`
aufruft, beendet Bewegungen, die es noch gar nicht gibt.

**Korrektur.** Reihenfolge im Test: erst `networkidle`, dann alle Bewegungen ans Ende setzen, dann
prüfen, dass keine mehr läuft. Dazu `reducedMotion: 'reduce'`.

**Regel.** Eine Prüfung, die bei manchen Breiten anschlägt und bei anderen nicht, ist bis zum
Beweis des Gegenteils ein Rennen und kein Befund.

---

## 6 · Fehldiagnose: die abgeschnittene Testausgabe

**Symptom.** `bunx playwright test | tail -6` zeigte `136 passed`. Ich hätte „alles grün"
gemeldet.

**Messung.** Derselbe Lauf über den JSON-Bericht ausgewertet: **144 gesamt, 140 grün, 4 rot.** Die
Fehlschläge standen oberhalb des abgeschnittenen Bereichs.

**Regel.** Testergebnisse werden gezählt, nicht gelesen. Wo eine Ausgabe abgeschnitten wird, zählt
der Bericht — nicht die letzten Zeilen.

---

## 7 · Drizzle bindet Spalten in Unterabfragen an die falsche Tabelle

**Symptom.** Ein Zähler stand überall auf null. Kein Fehler, keine leere Ergebnismenge, nur die
falsche Zahl.

**Ursache.** In einer korrelierten Unterabfrage aus einer rohen `sql`-Vorlage werden Spalten je nach
Abfrageform **unqualifiziert** gerendert. Aus `WHERE customer_id = customers.id` wurde
`WHERE customer_id = id`, und beide Namen banden an die innere Tabelle. Die Bedingung war damit
immer wahr für sich selbst und lieferte null.

**Korrektur.** Zählungen laufen über `db.$count`. Wo eine Vorlage unvermeidlich ist, wird die
äussere Referenz wörtlich geschrieben: `"service_contracts"."id"`.

**Regel.** Ein Test auf die **Zahl**, nicht auf die Form der Antwort. Der ursprüngliche Fehler kam
durch, weil kein Test den Zähler gelesen hat.

---

## 8 · Ein `aria-hidden`-Container mit fokussierbarem Inhalt

**Symptom.** axe: „ARIA hidden element must not be focusable or contain focusable elements".

**Ursache.** Das Diagramm ist `aria-hidden`, weil die Tabelle darunter die zugängliche Fassung ist.
Recharts setzt aber einen `tabindex` auf seine Zeichenfläche. Die Tastatur konnte in etwas landen,
das für den Screenreader nicht existiert.

**Korrektur.** `inert` zusätzlich zu `aria-hidden`.

**Regel.** `aria-hidden` blendet für Screenreader aus, nicht für die Tastatur. Beides gehört
zusammen.

---

## 9 · Ein Dialog, der aus einem Effekt geschlossen wird, gibt den Fokus nicht zurück

**Symptom.** Nach dem Schliessen begann die Tastaturbedienung wieder am Seitenanfang. Optisch war
nichts zu sehen.

**Ursache.** Die Aufräumfunktion eines normalen Effekts läuft, **nachdem** React das Element
abgehängt hat. Ein abgehängtes `dialog`-Element gibt den Fokus nicht mehr an den Auslöser zurück.

**Korrektur.** `useLayoutEffect`: dessen Aufräumfunktion läuft, solange das Element noch im Dokument
hängt.

**Regel.** Wer beim Abräumen noch am DOM arbeitet, braucht einen Layout-Effekt.

---

## 10 · `%` und `_` im Suchbegriff

**Symptom.** Ein einzelnes `%` in der Kommandopalette lieferte den ganzen Workspace.

**Ursache.** Beides sind ILIKE-Platzhalter. Der Begriff wird als Wert gebunden, es lässt sich also
kein SQL einschleusen — aber das Muster `%%%%` trifft jede Zeile.

**Korrektur.** Platzhalter im Begriff werden mit Backslash entschärft. Ein Test hält es fest.

**Regel.** Gebunden heisst nicht harmlos. Wer eine Benutzereingabe in ein Muster einsetzt, muss die
Mustersprache dieses Musters kennen.

---

## 11 · Warum die wichtigste Zahl nicht in ihre Zelle passte

**Symptom.** Der monatliche Vertragswert stand auf dem Dashboard so klein, dass er wie eine
Bildunterschrift aussah.

**Messung.** Vorschubbreiten in IBM Plex Mono, im laufenden Browser gemessen:

|                      | Zellbreite | `CHF 2'970.00` |
| -------------------- | ---------: | -------------: |
| vier gleiche Spalten |     283 px |         346 px |
| asymmetrisch, 43 %   |     466 px |         346 px |

**Ursache.** Nicht der Schriftgrad war zu zaghaft — die Zahl **passte bei 48 Pixeln nicht in ihre
Zelle**. Vier gleich breite Karten hatten die Grösse vorher festgelegt.

**Korrektur.** Asymmetrisches Band, Leitzahl 72 px, Einheit auf einer eigenen 11-px-Zeile. Beträge
ab zehn Zeichen gehen eine Stufe zurück, weil `10'000'000` sonst wieder nicht passt.

**Regel.** Bei Zahlensatz zuerst messen, dann urteilen. „Wirkt zu klein" und „passt nicht" sehen
gleich aus und haben verschiedene Ursachen.

---

## 12 · Die Startseite lud eine Diagrammbibliothek mit

**Symptom.** Ein einziges Bündel, 894 kB, 260 kB gepackt.

**Messung.** `bun run check:bundle-size` nach dem Bau.

**Ursache.** Kein Code-Splitting. Recharts ist die grösste Abhängigkeit und wird auf genau einer
Seite gebraucht.

**Korrektur.** Das Diagramm wird bei Bedarf geladen: Erstlast 149 kB gepackt, Diagramm 101 kB
getrennt. Der Platzhalter ist genauso hoch wie das Diagramm — sonst springt der Rest der Seite beim
Nachladen, und genau das zählt der CLS-Wert.

**Regel.** Die Auslieferungsgrösse ist eine Zahl mit Grenze in der CI, keine Einschätzung.

---

## 13 · Der Server wartete bei jedem Start zwei Minuten

**Symptom.** Nach dem ersten Neustart meldete `systemctl is-system-running` den Zustand
`degraded`. `systemd-networkd-wait-online` wartete 120 Sekunden und schlug dann fehl.

**Messung.** `networkctl list` zeigte die Netzwerkkarte dauerhaft im Zustand `configuring`. Die
IPv6-Adresse war gesetzt, eine IPv6-Standardroute fehlte. Das Gateway aus der Netzwerkvorlage des
Anbieters liegt ausserhalb des eigenen /64-Netzes, ist also nicht direkt erreichbar. Von Hand
gesetzt (`ip -6 route add default via … dev eth0 onlink`) funktionierte die Route sofort. Über
Netplan dagegen nicht, auch nicht mit `on-link: true` und `accept-ra: false`.

**Ursache.** Die Vorlage des Anbieters. Von innen lässt sich das nur mit Handgriffen umgehen, die
beim nächsten Neustart wieder fehlen.

**Korrektur.** Der Server läuft vorerst nur mit IPv4, im DNS steht kein AAAA-Eintrag. Der Wartedienst
bekommt über eine systemd-Ergänzung 15 statt 120 Sekunden. In der Datei steht, wann sie wieder
entfernt wird. Der Anbieter bekommt den Befund.

Jede Netzwerkänderung lief mit einem Totmannschalter: `systemd-run --on-active=180` legte die
Originaldatei nach drei Minuten zurück, sofern er nicht vorher abgebrochen wurde.

**Regel.** Netzwerkänderungen an einem entfernten Server nur mit automatischem Rückweg. Und jede
Übergangslösung nennt in der Datei selbst die Bedingung, unter der sie wieder verschwindet.

---

## 14 · Fehldiagnose: IPv6 bremst die Paketquellen

**Symptom.** `apt-get update` brauchte anderthalb Minuten. Bei `security.ubuntu.com` stand zuerst
`Ign:`, dann `Hit:`. Alle anderen Quellen antworteten in Sekunden.

**Erste Erklärung.** „Das kaputte IPv6 aus Eintrag 13: apt versucht zuerst IPv6 und wartet, bis das
abläuft." Die Korrektur war schon angekündigt: eine Zeile, die apt auf IPv4 zwingt.

**Messung, die das widerlegt.** Dieselbe Datei einmal über jede Adressfamilie:

|                                           | Ergebnis                         |
| ----------------------------------------- | -------------------------------- |
| IPv6                                      | Fehler nach 7 ms, ohne Wartezeit |
| IPv4                                      | keine Antwort nach 20 s          |
| alle neun IPv4-Adressen einzeln           | keine Antwort nach 5 bis 10 s    |
| anderer Ubuntu-Spiegel zum Vergleich      | 0,12 s                           |
| dieselben Adressen aus einem zweiten Netz | keine Antwort                    |

Ohne Route scheitert IPv6 sofort, es kostet also keine Zeit. Langsam war IPv4, und zwar nur zu
diesem einen Ziel und aus beiden Netzen gleich.

**Ursache.** Bei Canonical oder auf dem Weg dorthin, weder beim Anbieter noch bei IPv6. Die Updates
kamen trotzdem an, weil apt die nächste Adresse versucht.

**Korrektur.** Am Server keine. Die angekündigte IPv4-Zeile hätte nichts beschleunigt, und eine
Meldung an den Anbieter wäre eine Falschmeldung gewesen.

**Regel.** Den offensichtlich kaputten Teil nicht verdächtigen, bevor beide Wege getrennt gemessen
sind. Und bevor ein Befund an Dritte geht, einmal aus einem zweiten Netz prüfen.

---

## 15 · Caddy sortiert Header-Regeln nach Pfad, nicht nach Reihenfolge

**Symptom.** Gehashte Dateien unter `/assets` sollten ein Jahr im Cache liegen, kamen aber mit
`Cache-Control: no-cache`. Schriften ebenso.

**Messung.** `curl -D -` auf eine Seite, eine gehashte Datei und eine Schrift: alle drei
`no-cache`. In der Konfiguration stand die allgemeine Regel zuerst und die beiden Pfadregeln
danach. Gelesen sieht das richtig aus.

**Ursache.** Caddy ordnet gleichnamige Direktiven nach der Spezifität ihrer Pfad-Matcher. Die Regel
ohne Pfad lief deshalb zuletzt und überschrieb die beiden anderen, egal wo sie in der Datei stand.

**Korrektur.** Drei Matcher, die einander ausschliessen: `/assets/*`, `/fonts/*` und alles andere.
Dann ist die Reihenfolge gleichgültig. Ein Kommentar in `infra/Caddyfile` sagt, warum.

**Regel.** Header werden am ausgelieferten Ergebnis geprüft, nicht an der Konfiguration.

---

## 16 · Lokal grün, in der CI rot: die eigene .env verdeckte einen leeren Link

**Symptom.** axe meldete in der CI auf der Datenschutzseite `link-name`, „Links must have
discernible text", bei allen sechs Breiten. Lokal liefen dieselben Prüfungen grün.

**Messung.** Lokal mit leeren Impressum-Angaben gestartet
(`VITE_OPERATOR_EMAIL= … bunx playwright test`): derselbe Befund, nur auf der Datenschutzseite,
nicht im Impressum.

**Ursache.** Die Angaben kommen aus der Umgebung. Lokal stand eine E-Mail-Adresse in der `.env`, in
der CI keine. Das Impressum liess die leere Zeile weg, die Datenschutzseite setzte den Link
trotzdem, mit leerem Text. Für einen Screenreader ist so ein Link stumm.

**Korrektur.** Ohne Adresse verweist der Satz aufs Impressum. Beide Zustände sind geprüft: ohne
Angaben 30 von 30 Prüfungen der Rechtsseiten, mit Angaben die volle Suite.

**Regel.** Was aus der Umgebung kommt, hat mindestens zwei Zustände, und beide gehören geprüft. Die
eigene `.env` ist nur einer davon.

---

## 17 · Ein CSP-Verstoss, den der eigene Test nicht sah

**Symptom.** Lighthouse gegen den Server, am Tag des ersten Deploys: „Best Practices" 93 statt 100,
mit einem Eintrag „Content security policy" ohne Einzelheiten. Die Produktionsprüfung derselben
Seite war grün, „null Verstösse".

**Messung.** Die Startseite in Playwright geladen, mit einem Listener auf
`securitypolicyviolation` und den DevTools-Issues über CDP: `script-src`, Typ `eval`, im Bündel
mit Zod. In der Konsole stand dazu nichts.

**Ursache.** Zod prüft beim ersten Objektschema mit `new Function`, ob es schnelleren Prüfcode
erzeugen darf. Die CSP verbietet das, Zod fängt den Fehler ab und prüft ohne. Funktional
folgenlos — aber der Browser meldet den Versuch als Verstoss. Die Produktionsprüfung zählte nur
Konsolenfehler, und dieser Verstoss erscheint dort nicht. Ihre eigene Gegenprobe hatte ein
Inline-Skript, einen Inline-Style und ein fremdes Bild eingeschleust; alle drei landen in der
Konsole. Der stille Fall kam darin nicht vor.

**Korrektur.** Zod läuft in der Oberfläche ohne JIT (`jitless`), dann entfällt die Probe. Die
Einstellung musste vor Zod gesetzt werden, und das war der zweite Teil der Arbeit:
`z.config()` im Einstieg kam zu spät, weil Zod mit den Schemas in einem gemeinsamen Bündel liegt,
das vor dem Code des Einstiegs ausgewertet wird. Ein zweites Modulskript in `index.html` legte
Vite mit dem Einstieg zusammen, mit demselben Ergebnis. Geholfen hat eine ungebündelte Datei,
`public/zod-jitless.js`, als erstes Skript mit `defer`. Sie setzt `globalThis.__zod_globalConfig`,
das Zod beim Laden übernimmt.

Die Produktionsprüfung hört jetzt im Dokument auf `securitypolicyviolation`, auf jeder Seite neu.
Gegenprobe: gegen den Server mit dem alten Stand wird sie rot und nennt den Verstoss, gegen den
neuen Stand ist sie grün.

**Regel.** Eine Gegenprobe beweist nur die Fälle, die sie enthält. „Null Verstösse" hiess „null
Verstösse, die in der Konsole erscheinen".

---

## 18 · Lokal gemessen war eine Entwicklungsfassung von React

**Symptom.** Der Budgetcheck meldete lokal 254 KB Erstlast, in der CI 191 KB. Dieselbe Quelle.

**Messung.** Die Quellkarte des Bündels nach Herkunft aufgeschlüsselt: `react-dom` allein 343 KB
ungepackt. So gross ist nur die Entwicklungsfassung.

**Ursache.** Bun lädt die `.env` im Projekt automatisch, dort steht `NODE_ENV=development` für die
API. Vite übernimmt eine gesetzte Umgebungsvariable und baut dann für die Entwicklung. Die CI hat
keine `.env` und baute richtig.

**Korrektur.** Das Bauskript der Oberfläche setzt `NODE_ENV=production`. Lokal und in der CI misst
der Check jetzt dieselben 135.7 KB.

**Regel.** Eine Messung, die lokal und in der CI verschieden ausfällt, misst zuerst die Umgebung.

---

## 19 · Gepusht trotz Fund im Secret-Scan

**Symptom.** Nach dem Push meldete der Scan in der CI einen Fund, den der lokale Lauf davor
angeblich nicht hatte.

**Ursache.** Der lokale Aufruf war `gitleaks … | tail -2 && git push`. Der Exit-Code einer Pipe
ist der des letzten Glieds, also von `tail`, und der ist immer 0. Die Warnung stand in der
Ausgabe, der Push lief trotzdem. Der Fund selbst war harmlos: die eigene Tabelle in
`docs/SECURITY.md` zitierte das Testpasswort als Zuweisung.

**Korrektur.** Eintrag in `.gitleaksignore` mit Begründung, die Tabellenzeile umformuliert. Der
Scan läuft vor einem Push jetzt ohne Pipe, und der Exit-Code wird ausdrücklich geprüft.

**Regel.** Ein Prüfschritt vor einer nicht umkehrbaren Aktion gehört nie in eine Pipe.

---

## 20 · Die Barrierefreiheitsprüfung lief nie ohne Bewegung

**Symptom.** Ein neuer Test für den Nebel der Startseite verlangte bei reduzierter Bewegung, dass
es keinen Pause-Knopf gibt. Er fand einen, bei allen sechs Breiten.

**Messung.** Dieselbe Seite in einem von Hand gestarteten Browser mit `reducedMotion: 'reduce'`:
kein Knopf, der Nebel steht still. Die Seite war richtig, der Test nicht.

**Ursache.** `test.use({ reducedMotion: 'reduce' })` sieht aus wie eine Testoption, ist aber
keine: in Playwright 1.57 gehört die Einstellung unter `contextOptions`. `test.use` übergeht
Unbekanntes ohne Warnung. Dieselbe Zeile stand seit Meilenstein 6a in `e2e/a11y.spec.ts`; axe
lief dort also nie ohne Bewegung, obwohl Kommentar und Doku das sagten. Aufgefallen ist es nicht,
weil die Prüfung laufende Bewegungen ohnehin ans Ende setzt. TypeScript hätte die Zeile sofort
gemeldet — aber die Tests liefen durch keinen Typecheck.

**Korrektur.** `contextOptions: { reducedMotion: 'reduce' }` in beiden Dateien, und
`bun run typecheck` prüft jetzt auch `e2e/` und die Playwright-Konfigurationen
(`tsconfig.e2e.json`). Der erste Lauf fand noch eine zweite Stelle: `className` ist bei SVG kein
Text.

**Regel.** Testcode ist Code. Was keinen Typecheck durchläuft, kann still das Falsche prüfen.

---

## 21 · Der Nebel verschwand im Entwicklungsmodus

**Symptom.** Auf dem Entwicklungsserver stand die Startseite ohne Nebel da, ohne Fehler in der
Konsole. Im Produktionsbau war er da.

**Messung.** Shader übersetzt, Programm gebunden, `createFog` auf einer Probeleinwand in Ordnung.
Nur auf der Seite selbst lieferte es `null`.

**Ursache.** React startet Effekte im Entwicklungsmodus zur Probe zweimal: aufbauen, abräumen,
wieder aufbauen. Beim Abräumen verwarf der Nebel seinen WebGL-Kontext absichtlich
(`WEBGL_lose_context`). Der zweite Aufbau bekam dieselbe Leinwand mit einem toten Kontext, der
Shader liess sich nicht mehr übersetzen, und die Komponente gab still auf.

**Korrektur.** Der Kontext wird nicht mehr verworfen; mit der Leinwand verschwindet er ohnehin.

**Regel.** Aufräumen muss so sein, dass ein erneuter Aufbau danach funktioniert. React prüft das
im Entwicklungsmodus absichtlich.

---

## Was daraus als Werkzeug geblieben ist

| Werkzeug                    | Hält fest                                                    |
| --------------------------- | ------------------------------------------------------------ |
| `bun run verify`            | Format, Dateilänge, Lint samt `jsx-a11y`, Typen              |
| `bun run test`              | 196 Unit- und Integrationstests                              |
| `bun run test:e2e`          | 228 Prüfungen über sechs Breiten, samt axe und vier Sprachen |
| `bun run check:bundle-size` | Erstlast 142 KB, CSS 8 KB, Diagramm 115 KB, je gzip          |
| `e2e/production.spec.ts`    | Header, CSP ohne Verstoss auch ohne Konsoleneintrag, Demo    |
