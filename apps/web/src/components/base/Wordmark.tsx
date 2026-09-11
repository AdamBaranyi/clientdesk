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
 *
 * 20 px, eine Stufe über dem Arbeitsgrad und unter den Seitentiteln: die
 * Marke soll man lesen, ohne dass sie mit der Überschrift konkurriert. Bei
 * 12 px war sie eine Randnotiz. Unter 400 Pixeln Breite wird sie stufenlos
 * kleiner, bei 320 steht sie auf 16 px — nie darunter —, sonst passt sie
 * nicht neben Sprach- und Themenschalter.
 *
 * Den seitlichen Einzug gibt der Ort vor: in der Seitenleiste fluchtet die
 * Marke mit den Navigationspunkten, im Kopf der öffentlichen Seiten braucht
 * sie keinen.
 */
export function Wordmark({ name, className = '' }: { name: string; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 pt-1 pb-4 ${className}`}>
      <span className="font-condensed text-[length:clamp(16px,5vw,20px)] leading-tight font-semibold tracking-[0.12em] text-ink uppercase">
        {name}
      </span>
      <span className="h-px w-full bg-line" aria-hidden="true" />
    </div>
  );
}
