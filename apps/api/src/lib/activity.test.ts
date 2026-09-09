import { describe, expect, it } from 'vitest';
import { filterMetadata, isKnownAction } from './activity.ts';

describe('Metadaten-Whitelist des Aktivitätsprotokolls', () => {
  it('behält die erlaubten Schlüssel', () => {
    expect(filterMetadata('customer.created', { name: 'Alpenblick Studio' })).toEqual({
      name: 'Alpenblick Studio',
    });
  });

  it('verwirft interne Notizen, auch wenn sie mitgegeben werden', () => {
    const result = filterMetadata('customer.created', {
      name: 'Alpenblick Studio',
      internalNote: 'Zahlt immer zu spät',
    });
    expect(result).toEqual({ name: 'Alpenblick Studio' });
    expect(result).not.toHaveProperty('internalNote');
  });

  it('verwirft Kommentartexte bei einem Statuswechsel', () => {
    const result = filterMetadata('project.status_changed', {
      from: 'active',
      to: 'completed',
      hasReason: true,
      completionReason: 'Kunde hat den Rest selbst übernommen',
    });
    expect(result).toEqual({ from: 'active', to: 'completed', hasReason: true });
  });

  it('gibt bei unbekanntem Aktionstyp gar keine Metadaten zurück', () => {
    expect(filterMetadata('irgendwas.erfunden', { name: 'x', secret: 'y' })).toEqual({});
    expect(isKnownAction('irgendwas.erfunden')).toBe(false);
  });

  it('lässt fehlende erlaubte Schlüssel einfach weg', () => {
    expect(filterMetadata('customer.updated', {})).toEqual({});
  });
});
