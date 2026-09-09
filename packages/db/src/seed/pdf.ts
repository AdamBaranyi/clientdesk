/**
 * Erzeugt eine gültige, minimale PDF-Datei mit einer Textzeile. Die
 * Vorführdaten sollen echte PDF enthalten, ohne dass dafür eine Bibliothek
 * oder eine fremde Datei nötig wird.
 */
export function makeSimplePdf(title: string): Uint8Array {
  const escaped = title.replace(/([\\()])/g, '\\$1');
  const content = `BT /F1 18 Tf 72 720 Td (${escaped}) Tj ET`;

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ' +
      '/Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) {
    body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  }
  body +=
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n` + `startxref\n${xrefStart}\n%%EOF\n`;

  return new TextEncoder().encode(body);
}
