# syntax=docker/dockerfile:1
#
# Ein Dockerfile mit zwei Zielen, gebaut aus dem Wurzelverzeichnis:
#   docker build --target api -t tallyroom-api .
#   docker build --target web -t tallyroom-web .
# Im Betrieb baut infra/compose.prod.yml beide.

ARG BUN_VERSION=1.3.14
ARG CADDY_VERSION=2.11.4

# Zuerst nur die Paketlisten. So bilden die Abhängigkeiten eine eigene Schicht
# und werden nicht bei jeder Änderung am Quelltext neu installiert.
FROM oven/bun:${BUN_VERSION}-slim AS manifests
WORKDIR /app
COPY package.json bun.lock bunfig.toml ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY packages/contracts/package.json packages/contracts/
COPY packages/db/package.json packages/db/

# --- API ---------------------------------------------------------------------
# Bun führt TypeScript direkt aus, es gibt kein Build-Artefakt. Im Image liegen
# nur die Laufzeitabhängigkeiten der API und ihrer Workspace-Pakete.
FROM manifests AS api
ENV NODE_ENV=production
RUN bun install --frozen-lockfile --production --filter '@tallyroom/api'
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY packages/db packages/db
COPY apps/api apps/api
# Das Basis-Image bringt den Benutzer `bun` mit. Die API braucht keine
# Root-Rechte und bekommt sie nicht.
USER bun
EXPOSE 4000
CMD ["bun", "apps/api/src/index.ts"]

# --- Web ---------------------------------------------------------------------
# Der Build braucht die Entwicklungswerkzeuge (Vite, TypeScript), das Ergebnis
# sind nur statische Dateien. Die Stufe selbst wird nie ausgeliefert.
FROM manifests AS web-build
RUN bun install --frozen-lockfile
COPY tsconfig.base.json ./
COPY packages/contracts packages/contracts
COPY apps/web apps/web
RUN bun run --filter '@tallyroom/web' build

# Caddy mit der fertigen Oberfläche. Kein Bun, kein Node, kein Quelltext.
FROM caddy:${CADDY_VERSION}-alpine AS web
COPY infra/Caddyfile /etc/caddy/Caddyfile
COPY --from=web-build /app/apps/web/dist /srv
