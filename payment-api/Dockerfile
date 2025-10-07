FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies including TypeScript
RUN npm ci

# Copy source
COPY src ./src

# Build TypeScript
RUN npx tsc

# Production image
FROM node:20-alpine

WORKDIR /app

# Set environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install production dependencies (but keep typescript for now)
RUN npm ci --include=prod

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Expose port (Railway will use PORT env var)
EXPOSE 8080

# Start
CMD ["node", "dist/index.js"]
