/**
 * Die Wortmarke, gesetzt statt gezeichnet.
 *
 * Vorher stand hier ein Lucide-Symbol in Akzentfarbe neben fettem Text. Ein
 * beliebiges Symbol aus einer Bibliothek als Marke zu nehmen ist der
 * verbreitetste Reflex überhaupt — es bedeutet nichts, es füllt nur den Platz,
 * an dem eine Marke stehen müsste.
 *
 * Ein Datenblatt hat kein Logo, es hat einen Kopf: Name in Versalien, darunter
 * eine Linie. Das ist billiger, ehrlicher und unverwechselbarer als das Symbol.
 */
export function Wordmark({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-2 px-2.5 pt-1 pb-4">
      <span className="font-condensed text-label font-semibold tracking-[0.18em] text-ink uppercase">
        {name}
      </span>
      <span className="h-px w-full bg-line" aria-hidden="true" />
    </div>
  );
}
