# ---- Stage 1: compile TypeScript ----
FROM node:24-alpine AS build
WORKDIR /app

# Install dependencies first, so this layer is cached when only code changes
COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Stage 2: small runtime image ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Production dependencies only
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

# Don't run as root
USER node

EXPOSE 3000

# Run node directly (not "npm start") so it receives SIGTERM for graceful shutdown
CMD ["node", "dist/server.js"]
