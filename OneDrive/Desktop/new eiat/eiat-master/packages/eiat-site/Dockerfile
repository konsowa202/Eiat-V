# Dockerfile for Next.js application
FROM node:20-alpine AS base

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/eiat-site/package.json ./packages/eiat-site/
COPY packages/sanity-studio/package.json ./packages/sanity-studio/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy application code
COPY packages/eiat-site ./packages/eiat-site
COPY packages/sanity-studio ./packages/sanity-studio

# Build the application
WORKDIR /app/packages/eiat-site
RUN pnpm build

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN npm install -g pnpm

# Copy built application
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/eiat-site/.next ./.next
COPY --from=base /app/packages/eiat-site/public ./public
COPY --from=base /app/packages/eiat-site/package.json ./
COPY --from=base /app/packages/eiat-site/next.config.ts ./
COPY --from=base /app/packages/eiat-site/tsconfig.json ./

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "start"]



