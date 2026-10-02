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

ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_DIR=/data

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev

# Copy server and built frontend from builder
COPY server/ ./server/
COPY --from=builder /app/dist ./dist

# Create persistent data directory
RUN mkdir -p /data

VOLUME ["/data"]
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "server/index.js"]
