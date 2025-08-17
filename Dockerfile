## ---- Base with Bun (smaller + faster installs) ----
FROM oven/bun:1.1-alpine AS base
WORKDIR /app

## ---- Dependencies layer (leverages Bun's cache) ----
FROM base AS deps
# Copy only lockfiles & manifest for better layer caching
COPY package.json bun.lock* package-lock.json* ./
# If migrating from npm you may not yet have bun.lockb; bun will generate it.
RUN bun install --frozen-lockfile || bun install

## ---- Build layer ----
FROM base AS build
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN bun run build

## ---- Production runtime (copy only needed artifacts) ----
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY package.json bun.lock* ./
COPY .env ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/build ./build

# Expose a default port (adjust if different)
EXPOSE 3000

# Start the react-router server using bun
CMD ["bun", "run", "start"]