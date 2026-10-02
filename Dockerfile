# --- Stage 1: Build Frontend ---
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# --- Stage 2: Production Runtime ---
FROM node:22-alpine AS runner
WORKDIR /app

# Instalar tzdata y sqlite para soporte de zona horaria y backups
RUN apk add --no-cache tzdata sqlite bash

ENV NODE_ENV=production
ENV TZ=America/Argentina/Buenos_Aires
ENV PORT=3000
ENV DATA_DIR=/data

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy server, scripts and built frontend from builder
COPY server/ ./server/
COPY scripts/ ./scripts/
RUN chmod +x ./scripts/*.sh 2>/dev/null || true
COPY --from=builder /app/dist ./dist

# Create persistent data directory
RUN mkdir -p /data/backups

VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server/index.js"]
