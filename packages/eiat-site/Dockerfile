# Dockerfile for the Eiat landing site (Next.js) - runs on Hostinger VPS
FROM node:20-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/eiat-site/package.json ./packages/eiat-site/

RUN pnpm install --frozen-lockfile --filter eiat...

COPY packages/eiat-site ./packages/eiat-site

WORKDIR /app/packages/eiat-site
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/eiat-site/.next ./.next
COPY --from=base /app/packages/eiat-site/public ./public
COPY --from=base /app/packages/eiat-site/package.json ./
COPY --from=base /app/packages/eiat-site/next.config.ts ./
COPY --from=base /app/packages/eiat-site/tsconfig.json ./

EXPOSE 3000

CMD ["pnpm", "start"]
