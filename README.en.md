# Tallyroom

[Deutsch](README.md) · **English**

A SaaS dashboard with a client portal for small digital agencies. The team keeps clients, projects,
monthly service contracts, requests and documents in one place; clients use a separate portal and
see only the part that has been explicitly shared with them.

The interface is available in German, French, Italian and English. The French and Italian texts
have not been reviewed by native speakers; the legal pages state that the German version is
binding.

A portfolio project by Adam Baranyi. All data in the application is made up.

> **Live since 11.09.2026** at <https://tallyroom.adambaranyi.xyz>, on its own server with Caddy,
> Docker Compose and Let's Encrypt.
>
> **Status: milestone 6 of 6.** All required features are in place, including an isolated visitor
> demo with role switching and a command palette. Deployment is complete, D0 to D8: nightly
> backups, a passed restore drill on the server, the server guide below and a
> [case study](docs/FALLSTUDIE.md) (German). The detailed
> status is in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) (German).

## Tech stack

| Area                        | Technology                                                                    |
| --------------------------- | ----------------------------------------------------------------------------- |
| Runtime and package manager | Bun 1.3.14                                                                    |
| Frontend                    | React 19.2, TypeScript 6.0.3 strict, Vite 8, React Router 8, TanStack Query 5 |
| Styling                     | Tailwind CSS 4.3, Lucide icons, IBM Plex Sans and Mono, self-hosted           |
| Backend                     | Express 5.2, TypeScript                                                       |
| Data                        | PostgreSQL 18, Drizzle ORM 0.45 with versioned migrations                     |
| Files                       | Garage as S3-compatible object storage, private bucket                        |
| Authentication              | Server-side sessions, PostgreSQL session store, Argon2id                      |
| Tests                       | Vitest 5 against a real test database, Playwright 1.57 with axe               |
| Operations                  | Docker Compose, GitHub Actions                                                |

TypeScript is deliberately pinned to 6.0.3 rather than 7: `typescript-eslint` currently supports
only `<6.1.0`, and a green lint pipeline is worth more than the latest minor release.

## Getting started

Requirements: [Bun](https://bun.sh) 1.3 or later, and Docker.

```bash
bun install
cp .env.example .env
# SESSION_SECRET erzeugen und in .env eintragen:
openssl rand -base64 48
```

Start the databases and object storage (Postgres on 5440, the test database on 5441, Garage as S3
storage on 3900):

```bash
docker compose -f infra/docker-compose.yml up -d
```

Garage creates the bucket and access keys on first start. The bucket is private. Documents are only
reachable through the authorised API — there is no public URL and there are no presigned links.

Apply the migrations and create an internal account:

```bash
bun run db:migrate
bun run admin:create -- --email dein@konto.test --name "Vor Nachname" --workspace "Deine Agentur"
```

The command prints a random password once. There is deliberately no public sign-up: internal
accounts are created with this command, further ones through invitation links. A forgotten
password is replaced with `bun run admin:reset-password -- --email dein@konto.test`, again random
and shown once; every session of the account ends.

Alternatively, create a workspace with demo data — eight fictional clients, twelve projects and
milestones with sensible deadlines:

```bash
bun run seed:demo -- --email demo@tallyroom.test --password Dein-Passwort
```

The command also creates two client logins and lists them at the end. That lets you show the
difference between the team view and the client portal on the same data: the same request shows
the team an internal comment that the client view knows nothing about.

All dates are relative to the day the command runs, so the data still looks plausible later on.
Companies and people are fictional.

Start the app:

```bash
bun run dev
```

The web app runs on <http://localhost:5173>, the API on <http://localhost:4000>. The Vite server
proxies `/api` to the API so that the session cookie and the CSRF origin check work without CORS.

### If it fails to start

`Port 5173 is already in use` means something is still running there. The port is fixed on purpose:
if Vite fell back to 5174, the origin would no longer match the CSRF check and login would fail
without a helpful message.

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN   # zeigt, welcher Prozess den Port hält
```

The same applies to the API on port 4000.

## Checks

```bash
bun run verify   # Format, Dateilänge, Schriftgrösse, Lint, Typen
bun run test     # Unit- und Integrationstests
bun run test:e2e # Playwright über sechs Breiten
bun run test:e2e:browsers # dieselben Prüfungen in Safaris und Firefox' Engine
```

The integration tests need the test database running and `TEST_DATABASE_URL` from `.env`.
`bun run test` does not read that file itself, so run them locally with
`bun --env-file=.env run vitest run`.

As of 12.09.2026: 214 unit and integration tests, 292 Playwright checks across six widths
(including axe, all four languages and the tour) and a production check against the live server,
3 of 3 passing. Details in [docs/TESTING.md](docs/TESTING.md) (German).

### Measuring performance

Local only. This creates a separate workspace with 1,000 clients, 3,000 projects, 1,500 contracts
and 10,000 requests, then measures the API:

```bash
bun run seed:load
bun run measure
```

Without this seed there is nothing to measure, and any quoted timing would be made up. The results
are in [docs/TESTING.md](docs/TESTING.md) (German).

### Lighthouse and bundle size

Against the live site on 11.09.2026, two runs each: on mobile, 98 to 99 for performance and 100
each for accessibility, best practices and SEO; on desktop, 100 in all four categories.

The start page loads 135.7 KB of JavaScript (gzip). The team view, client portal and legal pages
are loaded on demand.

## On your own server

The live instance runs on a KVM server (8 vCPU, 16 GB RAM, 150 GB SSD, Ubuntu 24.04 LTS). The
images are built on the server itself, from a checkout of this public repository — no registry, no
access token.

### One-time setup

1. **Access and firewall.** Key-based login only, no direct root; a separate user whose `sudo` asks
   for a password. `ufw` allows only 22, 80, 443 inbound and `443/udp` for HTTP/3.
2. **Automatic security updates** via `unattended-upgrades`, rebooting when required at 03:30. Plus
   4 GB of swap with `vm.swappiness=10`.
3. **Docker Engine and Compose** from the official repository. Check the signing key against the
   published fingerprint and abort if it differs. Cap container logs at 3 × 10 MB and enable
   `live-restore`, so a Docker update does not take running containers down with it.
4. **DNS.** An A record pointing at the server. No AAAA record while the provider's IPv6 route is
   broken ([finding 13](docs/DIAGNOSTICS.md), German) — an AAAA record without a working route makes
   the site unreachable for IPv6 visitors.
5. **Check out where the deploy expects it.** The checkout belongs to root; Git refuses every
   command there for other users.

   ```bash
   sudo git clone https://github.com/AdamBaranyi/tallyroom /opt/tallyroom
   ```

6. **First deploy, with the imprint details.** They are not in the public repository and are passed
   once; after that they live in `infra/.env.production`.

   ```bash
   ssh -t vps1 'sudo OPERATOR_STREET="…" OPERATOR_CITY="…" OPERATOR_EMAIL="…" /opt/tallyroom/infra/deploy.sh'
   ```

   On the first run the script generates every secret itself — session key, database and storage
   passwords — and stores them readable by root only. They never leave the server.

### Deploy

```bash
ssh -t vps1 'sudo /opt/tallyroom/infra/deploy.sh'
```

In order: fetch `origin/main`, build the images, start database and storage, **back up the
database**, apply migrations, start API and Caddy, prune build leftovers, print the status. The
backup before the migration is the way back, because migrations only run forwards. Building takes
about 42 seconds on this server.

A green pipeline deploys nothing — the deploy is triggered by hand, on purpose.

### Rollback

```bash
ssh -t vps1 'sudo /opt/tallyroom/infra/deploy.sh 1a2b3c4'
```

Puts the code back on that commit; the tagged images of previous builds stay on the server for it.
That is enough as long as no migration sits in between. If the database is affected, restore it
first: the steps, the commands and the restore drill to run beforehand with the same backup are in
[docs/BETRIEB.md](docs/BETRIEB.md) (German).

## The demo

On the start page, "Start demo" creates a workspace just for that visitor, with a full set of
sample data, five identities and a lifetime of 60 minutes. After that, a cleanup job removes
everything: data, sessions and files.

A banner marks the demo throughout and holds the role switcher: three internal identities and two
client logins. Switching only works within your own demo.

A new demo starts with a six-step guided tour, which can be restarted from the demo banner.

Demo limits: 30 clients, 50 projects, 50 contracts, 100 requests. Your own files are not accepted;
a bundled sample document is there for test uploads. `DEMO_ENABLED=false` switches the whole thing
off, and the demo area then does not exist.

## Project rules

- **No project code file longer than 400 lines.** Enforced by the ESLint rule `max-lines` and also
  by `bun run check:file-length`, which covers formats ESLint does not see. Either one fails CI.
  How lines are counted, and the only exclusion, are described in
  [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (German).
- **Usable from 320 CSS pixels.** Tested at 320, 375, 390, 768, 1024 and 1440 pixels. Results in
  [docs/TESTING.md](docs/TESTING.md) (German).
- **Appearance:** Device, Light or Dark. The default is Device, which follows
  `prefers-color-scheme` without a reload.

## Documentation

- [docs/FALLSTUDIE.md](docs/FALLSTUDIE.md) (German) — decisions traced back to user tasks, with
  evidence
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) (German) — structure, data model, decisions, code
  quality
- [docs/SECURITY.md](docs/SECURITY.md) (German) — threat overview, safeguards, tested cases
- [docs/TESTING.md](docs/TESTING.md) (German) — tests run, test widths, known gaps
- [docs/DIAGNOSTICS.md](docs/DIAGNOSTICS.md) (German) — findings with measurement, cause and fix
- [docs/BETRIEB.md](docs/BETRIEB.md) (German) — backups, restore drill, password reset on the server
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) (German) — done, open, blocked

## Deliberately left out

These are missing by decision, not by oversight:

- **Password reset by email.** It cannot be built properly without sending email. The operator
  sets a new password with `admin:reset-password`.
- Payments, invoices, Stripe, calendar, sending email, real-time notifications
- Multi-factor authentication and public self-registration
- Other currencies — in the MVP everything is CHF and monthly
