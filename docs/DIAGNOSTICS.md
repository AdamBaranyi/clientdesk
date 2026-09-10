# Diagnosen

Befunde aus diesem Projekt, die nicht durch Hinsehen zu finden waren. Je Eintrag: was zu sehen
war, was gemessen wurde, woran es lag, was es jetzt hält.

Der Sinn ist nicht Vollständigkeit, sondern Nachvollziehbarkeit. Ein Fehler, der einmal still
zugeschlagen hat, schlägt wieder zu — und beim zweiten Mal soll die Suche kurz sein.

Drei Einträge sind **Fehldiagnosen**: dort war die erste Erklärung falsch. Die stehen hier
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

## Was daraus als Werkzeug geblieben ist

| Werkzeug                    | Hält fest                                           |
| --------------------------- | --------------------------------------------------- |
| `bun run verify`            | Format, Dateilänge, Lint samt `jsx-a11y`, Typen     |
| `bun run test`              | 166 Unit- und Integrationstests                     |
| `bun run test:e2e`          | 147 Prüfungen über sechs Breiten, davon 72 mit axe  |
| `bun run check:bundle-size` | Erstlast 170 KB, CSS 8 KB, Diagramm 115 KB, je gzip |
