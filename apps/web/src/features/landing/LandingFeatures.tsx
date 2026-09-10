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
 * Die drei Punkte als nummerierte Zeilen, nicht als drei gleich breite Karten.
 *
 * Drei gleiche Spalten nebeneinander behaupten, die Punkte seien gleichwertig
 * und gleich lang — beides stimmt nicht, und die Anordnung ist ausserdem das
 * Erste, was man auf jeder generierten Startseite sieht. Untereinander mit
 * laufender Nummer liest es sich wie ein Blatt mit Positionen: die Nummer
 * führt, der Titel steht neben dem Text statt darüber.
 */
export function LandingFeatures() {
  return (
    <ol className="mt-20 flex flex-col border-t border-line">
      {FEATURES.map((feature, index) => (
        <li
          key={feature.title}
          className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 border-b border-line py-6 md:grid-cols-[auto_minmax(0,18rem)_minmax(0,1fr)] md:gap-x-8"
        >
          <span className="text-dense font-mono tabular-nums text-muted" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <h2 className="text-section leading-snug font-medium tracking-[-0.01em]">
            {feature.title}
          </h2>
          <p className="text-body col-start-2 max-w-[54ch] text-muted md:col-start-3">
            {feature.detail}
          </p>
        </li>
      ))}
    </ol>
  );
}
