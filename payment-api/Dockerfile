FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install ALL dependencies including TypeScript
RUN npm ci

# Copy source
COPY src ./src

# Debug: Show files and tsconfig
RUN echo "=== Current directory ===" && pwd
RUN echo "=== Files in /app ===" && ls -la
RUN echo "=== Contents of tsconfig.json ===" && cat tsconfig.json
RUN echo "=== Files in src/ ===" && ls -la src/
RUN echo "=== Node version ===" && node --version
RUN echo "=== TypeScript version ===" && npx tsc --version

# Build using npm script
RUN npm run build

# Verify build output
RUN ls -la dist/

# Production image
FROM node:20-alpine

WORKDIR /app

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Verify files copied
RUN ls -la dist/

# Expose port
EXPOSE 8080

# Start with explicit node command
CMD ["node", "--trace-warnings", "dist/index.js"]
