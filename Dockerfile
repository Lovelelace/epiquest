# syntax=docker/dockerfile:1

# Image de base commune : Node 22 + pnpm via Corepack
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV NEXT_TELEMETRY_DISABLED=1 TURBO_TELEMETRY_DISABLED=1
RUN corepack enable
WORKDIR /app

# Dépendances : seuls les manifestes sont copiés pour profiter du cache Docker
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Un manifeste par paquet ou app : en ajouter une ligne à chaque nouveau dossier
COPY apps/db/package.json apps/db/
COPY apps/mobile/package.json apps/mobile/
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY packages/rules/package.json packages/rules/
COPY packages/schemas/package.json packages/schemas/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# Environnement de développement : sources montées par docker compose
FROM deps AS dev
COPY . .
CMD ["pnpm", "test"]

# Build et vérifications : utilisé par la CI pour valider l'image
FROM deps AS build
COPY . .
RUN pnpm lint && pnpm typecheck && pnpm test && pnpm build
