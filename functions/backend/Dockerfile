# Use an official Node.js runtime as a parent image
FROM node:18-slim

# Install dependencies for native modules if needed
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Create and change to the app directory.
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
COPY package*.json ./

# Install ALL dependencies (not just production)
RUN npm install

# Copy local code to the container image.
COPY . ./

# Service runs on port 8080 by default (Cloud Run sets PORT env var)
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); })"

# Run the web service on container startup with startup script
CMD [ "node", "start.js" ]
