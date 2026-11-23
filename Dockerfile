# syntax=docker/dockerfile:1

# Image de base commune : Node 22 + pnpm via Corepack
FROM node:22-bookworm-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# Dépendances : seuls les manifestes sont copiés pour profiter du cache Docker
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Ajouter ici le package.json de chaque nouveau paquet ou app (apps/server, apps/web…)
COPY packages/rules/package.json packages/rules/
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
