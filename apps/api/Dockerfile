FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies needed for native modules
RUN apk add --no-cache libc6-compat openssl

# Copy root and workspace package configs
COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/consumer/package.json ./apps/consumer/

RUN npm install

# Copy application source
COPY apps/api ./apps/api

WORKDIR /app/apps/api
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
RUN apk add --no-cache openssl

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/apps/api ./apps/api

WORKDIR /app/apps/api

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "run", "start"]
