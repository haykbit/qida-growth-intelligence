FROM node:20-alpine
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/contracts/package.json packages/contracts/package.json
RUN pnpm install --frozen-lockfile=false
COPY packages/contracts ./packages/contracts
COPY apps/web ./apps/web

EXPOSE 5173
CMD ["pnpm", "--filter", "@qida/web", "dev", "--host", "0.0.0.0"]

