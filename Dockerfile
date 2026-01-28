# Everything opencode - Docker Container
# Multi-stage build for production and development

# Stage 1: Base image with Node.js and common tools
FROM node:18-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    curl \
    bash

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Stage 2: Dependencies
FROM base AS deps

# Copy package files
COPY package*.json ./
COPY .npmrc ./

# Install dependencies
RUN npm ci --only=production

# Stage 3: Development dependencies
FROM deps AS dev-deps

# Install all dependencies including dev dependencies
RUN npm ci

# Stage 4: Builder
FROM dev-deps AS builder

# Copy source code
COPY . .

# Run tests and build verification
RUN npm run quality

# Stage 5: Production image
FROM base AS production

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY --from=builder /app .

# Copy only necessary files for production
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/languages ./languages
COPY --from=builder /app/tests ./tests
COPY --from=builder /app/hooks ./hooks
COPY --from=builder /app/.opencode-plugin ./.opencode-plugin
COPY --from=builder /app/agents ./agents
COPY --from=builder /app/skills ./skills
COPY --from=builder /app/commands ./commands
COPY --from=builder /app/rules ./rules
COPY --from=builder /app/contexts ./contexts
COPY --from=builder /app/examples ./examples
COPY --from=builder /app/mcp-configs ./mcp-configs
COPY --from=builder /app/plugins ./plugins
COPY --from=builder /app/documentation ./documentation
COPY --from=builder /app/README.md ./README.md
COPY --from=builder /app/AGENTS.md ./AGENTS.md
COPY --from=builder /app/CONTRIBUTING.md ./CONTRIBUTING.md

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('fs').existsSync('/app/package.json') ? process.exit(0) : process.exit(1)"

# Default command
CMD ["node", "scripts/verify-installation.js"]

# Stage 6: Development image
FROM dev-deps AS development

# Copy all source code
COPY . .

# Set ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports for development services
EXPOSE 3000 3001 3002 3003 3004 3005 3006

# Default command for development
CMD ["npm", "run", "dev"]

# Stage 7: PineScript Optimizer Service
FROM base AS pinescript-optimizer

# Copy optimizer specific dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY scripts/pinescript/optimizer.js ./scripts/pinescript/
COPY scripts/pinescript/optimizer-modules/ ./scripts/pinescript/optimizer-modules/
COPY scripts/lib/ ./scripts/lib/
COPY tests/ ./tests/

USER nodejs

CMD ["node", "scripts/pinescript/optimizer.js", "--help"]

# Stage 8: Debug Server Service
FROM base AS debug-server

# Copy debug server specific dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY scripts/pinescript/debug-server.js ./scripts/pinescript/
COPY scripts/pinescript/debug-server-modules/ ./scripts/pinescript/debug-server-modules/
COPY scripts/lib/ ./scripts/lib/

EXPOSE 3000

USER nodejs

CMD ["node", "scripts/pinescript/debug-server.js", "--port", "3000"]

# Stage 9: TemplateUtils Service
FROM base AS template-utils

# Copy template utils specific dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY scripts/lib/template-utils.js ./scripts/lib/
COPY scripts/lib/template-modules/ ./scripts/lib/template-modules/

USER nodejs

CMD ["node", "-e", "const TemplateUtils = require('./scripts/lib/template-utils'); console.log('TemplateUtils service ready')"]

# Stage 10: Command Runner Service
FROM base AS command-runner

# Install additional tools for command runners
RUN apk add --no-cache \
    clojure \
    leiningen \
    python3 \
    py3-pip \
    go \
    rust \
    cargo \
    elixir

# Copy command runner dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY scripts/clojure/ ./scripts/clojure/
COPY scripts/javascript/ ./scripts/javascript/
COPY scripts/commands/ ./scripts/commands/
COPY scripts/go/ ./scripts/go/
COPY scripts/rust/ ./scripts/rust/
COPY scripts/elixir/ ./scripts/elixir/
COPY scripts/lib/ ./scripts/lib/

USER nodejs

CMD ["node", "scripts/clojure/command-runner.js", "--help"]

# Labels
LABEL org.opencontainers.image.title="Everything opencode"
LABEL org.opencontainers.image.description="Comprehensive plugin for opencode AI coding agent"
LABEL org.opencontainers.image.version="1.0.0"
LABEL org.opencontainers.image.authors="David M. <david@example.com>"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.source="https://github.com/yourusername/everything-opencode"