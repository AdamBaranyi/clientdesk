const FEATURES = [
  {
    title: 'Kunden, Projekte, Meilensteine',
    detail:
      'Wer wird betreut, was läuft, was ist überfällig. Fortschritt entsteht aus erledigten Meilensteinen und nicht aus einer Schätzung.',
  },
  {
    title: 'Verträge mit Preisversionen',
    detail:
      'Eine Preisänderung gilt ab ihrem Datum und lässt vergangene Monatswerte unberührt. Der monatliche Vertragswert ist zu jedem Stichtag nachvollziehbar.',
  },
  {
    title: 'Getrenntes Kundenportal',
    detail:
      'Der Kunde sieht freigegebene Projekte, Unterlagen und den öffentlichen Teil des Verlaufs. Interne Notizen und Kommentare erreichen ihn nicht.',
  },
];

/**
 * Die drei Punkte als Zeilen, nicht als drei gleich breite Karten.
 *
 * Drei gleiche Spalten nebeneinander behaupten, die Punkte seien gleichwertig
 * und gleich lang — beides stimmt nicht, und die Anordnung ist ausserdem das
 * Erste, was man auf jeder generierten Startseite sieht.
 *
 * Zuerst standen hier laufende Nummern. Die mussten wieder weg: Nummern
 * behaupten eine Reihenfolge, und diese drei Punkte haben keine. Auf einem
 * Datenblatt verweist eine Positionsnummer auf etwas — hier verwies sie auf
 * nichts und ahmte nur das Aussehen einer Ordnung nach.
 */
export function LandingFeatures() {
  return (
    <ol className="mt-20 flex flex-col border-t border-line">
      {FEATURES.map((feature) => (
        <li
          key={feature.title}
          className="grid gap-x-8 gap-y-2 border-b border-line py-6 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]"
        >
          <h2 className="text-section leading-snug font-medium tracking-[-0.01em]">
            {feature.title}
          </h2>
          <p className="text-body max-w-[54ch] text-muted">{feature.detail}</p>
        </li>
      ))}
    </ol>
  );
}
