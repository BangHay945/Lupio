# syntax=docker/dockerfile:1
# ==============================================================================
# Stage 1: Base image with Node.js 20 & Native System FFmpeg
# ==============================================================================
FROM node:20-slim AS base

ENV DEBIAN_FRONTEND=noninteractive
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      ffmpeg \
      ca-certificates \
      curl \
      fontconfig \
      fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ==============================================================================
# Stage 2: Install dependencies
# ==============================================================================
FROM base AS deps
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci || npm install

# ==============================================================================
# Stage 3: Build Next.js standalone application
# ==============================================================================
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY apps/web ./

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=1280"

# Mount persistent Next.js compiler cache for blazing fast incremental rebuilds
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# ==============================================================================
# Stage 4: Production Runner (Minimal & Lightweight)
# ==============================================================================
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Pre-create data and media persistence directories
RUN mkdir -p /app/data /app/uploads /app/public/hls /app/public/thumbnails

# Copy standalone server and static assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["node", "server.js"]
