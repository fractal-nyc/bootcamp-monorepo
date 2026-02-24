FROM oven/bun:1-alpine

WORKDIR /app

# Install dependencies first (layer caching)
COPY package.json ./
RUN bun install

# Copy application code
COPY . .

# Build the Vite frontend
RUN bun run build

# Set production mode so vite-express serves static files from dist/
ENV NODE_ENV=production

# Expose the port your Express server listens on
EXPOSE 3000

# Load tracing before the app starts
CMD ["bun", "--preload", "./src/server/tracing.ts", "src/server/main.ts"]
