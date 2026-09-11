import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { seedWorkspaceWithOwner, type SeededWorkspace } from '../helpers/fixtures.ts';
import { login } from '../helpers/scenario.ts';
import { startTestServer, type TestServer } from '../helpers/test-server.ts';

let server: TestServer;
let account: SeededWorkspace;

beforeAll(async () => {
  server = await startTestServer();
}, 60_000);

afterAll(async () => {
  await server.close();
});

beforeEach(async () => {
  await server.reset();
  account = await seedWorkspaceWithOwner(server.db, {
    workspaceName: 'Seeblick Digital',
    email: 'owner@seeblick.test',
  });
});

interface ErrorBody {
  error: { code: string; message: string; fieldErrors?: Record<string, string[]> };
}

async function failedLogin(
  acceptLanguage?: string,
): Promise<{ status: number; body: ErrorBody; language: string | null }> {
  const client = server.client();
  const csrf = await client.csrfToken();
  const response = await client.request('/api/v1/auth/login', {
    method: 'POST',
    csrf,
    headers: acceptLanguage ? { 'accept-language': acceptLanguage } : {},
    body: JSON.stringify({ email: account.email, password: 'falsch' }),
  });
  return {
    status: response.status,
    body: (await response.json()) as ErrorBody,
    language: response.headers.get('content-language'),
  };
}

describe('Sprache der API-Meldungen', () => {
  it('antwortet ohne Angabe auf Deutsch', async () => {
    const result = await failedLogin();
    expect(result.status).toBe(401);
    expect(result.body.error.message).toBe('E-Mail oder Passwort ist falsch.');
    expect(result.language).toBe('de');
  });

  it('antwortet auf Englisch, wenn die Oberfläche Englisch verlangt', async () => {
    const result = await failedLogin('en');
    expect(result.body.error.message).toBe('Email or password is incorrect.');
    expect(result.language).toBe('en');
  });

  it('nimmt den ersten Wunsch aus einem Browser-Header', async () => {
    expect((await failedLogin('en-GB,en;q=0.9,de;q=0.8')).body.error.message).toBe(
      'Email or password is incorrect.',
    );
    expect((await failedLogin('de-CH,de;q=0.9,en;q=0.8')).body.error.message).toBe(
      'E-Mail oder Passwort ist falsch.',
    );
  });

  it('antwortet auf Französisch und Italienisch, wenn der Browser das verlangt', async () => {
    const french = await failedLogin('fr-CH,fr;q=0.9');
    expect(french.language).toBe('fr');
    expect(french.body.error.message).toBe("L'e-mail ou le mot de passe est incorrect.");

    const italian = await failedLogin('it-CH');
    expect(italian.language).toBe('it');
    expect(italian.body.error.message).toBe("L'e-mail o la password non è corretta.");
  });

  it('übersetzt auch die Prüfmeldungen der gemeinsamen Schemas', async () => {
    const client = await login(server, account);
    const csrf = await client.csrfToken();
    const create = (language: string) =>
      client.request(`/api/v1/workspaces/${account.workspaceId}/customers`, {
        method: 'POST',
        csrf,
        headers: { 'accept-language': language },
        body: JSON.stringify({ name: '   ' }),
      });

    const english = (await (await create('en')).json()) as ErrorBody;
    expect(english.error.message).toBe('Invalid input.');
    expect(english.error.fieldErrors?.name).toEqual(['Name is required']);

    const german = (await (await create('de')).json()) as ErrorBody;
    expect(german.error.message).toBe('Eingabe ungültig.');
    expect(german.error.fieldErrors?.name).toEqual(['Name ist erforderlich']);

    const french = (await (await create('fr-CH')).json()) as ErrorBody;
    expect(french.error.fieldErrors?.name).toEqual(['Le nom est obligatoire']);
  });

  it('mischt die Sprachen gleichzeitiger Requests nicht', async () => {
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, index) => failedLogin(index % 2 === 0 ? 'en' : 'de')),
    );
    results.forEach((result, index) => {
      expect(result.body.error.message).toBe(
        index % 2 === 0 ? 'Email or password is incorrect.' : 'E-Mail oder Passwort ist falsch.',
      );
    });
  });
});
