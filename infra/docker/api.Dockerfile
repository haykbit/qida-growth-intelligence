FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/analytics/package.json packages/analytics/package.json
RUN pnpm install --frozen-lockfile=false

COPY prisma ./prisma
COPY packages/contracts ./packages/contracts
COPY packages/analytics ./packages/analytics
COPY apps/api ./apps/api
RUN pnpm db:generate

EXPOSE 3000
CMD ["pnpm", "--filter", "@qida/api", "dev"]

