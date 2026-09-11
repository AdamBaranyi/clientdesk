import { describe, expect, it } from 'vitest';
import { requestLogSerializers } from './logger.ts';

describe('Request-Log', () => {
  it('behält Kennung, Methode und Pfad und lässt Header, Adresse und Query weg', () => {
    const serialized = {
      id: 7,
      method: 'GET',
      url: '/api/v1/workspaces/w1/search?q=Alpenblick',
      headers: { 'x-forwarded-for': '203.0.113.9', 'user-agent': 'Firefox' },
      remoteAddress: '172.18.0.5',
    };

    expect(requestLogSerializers.req(serialized)).toEqual({
      id: 7,
      method: 'GET',
      path: '/api/v1/workspaces/w1/search',
    });
  });

  it('nimmt von der Antwort nur den Status', () => {
    const serialized = { statusCode: 404, headers: { 'set-cookie': 'tallyroom.sid=abc' } };

    expect(requestLogSerializers.res(serialized)).toEqual({ statusCode: 404 });
  });
});
