FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache libc6-compat

# Copy root and workspace package configs
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/consumer/package.json ./apps/consumer/

RUN npm install

# Copy application source
COPY apps/consumer ./apps/consumer

WORKDIR /app/apps/consumer

RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/consumer ./apps/consumer

WORKDIR /app/apps/consumer

EXPOSE 3001

ENV PORT=3001
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
