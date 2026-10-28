FROM node:22.22.2-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends git openssl procps ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
CMD ["npm", "run", "test:platform"]
