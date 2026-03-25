FROM node:22-slim AS deps
WORKDIR /workspace

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

FROM deps AS generate
WORKDIR /workspace
ENV DATABASE_URL_CORE=postgresql://app:app@localhost:5432/app?schema=core
ENV DATABASE_URL_PRODUCTS=postgresql://app:app@localhost:5432/app?schema=products

COPY libs/core/src/providers/prisma/schema.prisma libs/core/src/providers/prisma/schema.prisma
COPY libs/products/src/infrastructure/prisma/schema.prisma libs/products/src/infrastructure/prisma/schema.prisma

RUN npx prisma generate --schema libs/core/src/providers/prisma/schema.prisma \
  && npx prisma generate --schema libs/products/src/infrastructure/prisma/schema.prisma

FROM deps AS build
WORKDIR /workspace

COPY . .
COPY --from=generate /workspace/libs/core/src/providers/prisma/generated /workspace/libs/core/src/providers/prisma/generated
COPY --from=generate /workspace/libs/products/src/infrastructure/prisma/generated /workspace/libs/products/src/infrastructure/prisma/generated

RUN npx nx build app-console --configuration=production

FROM node:22-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

COPY --from=build /workspace/dist/apps/app-console/package.json ./package.json
COPY --from=build /workspace/dist/apps/app-console/package-lock.json ./package-lock.json

RUN npm ci --omit=dev \
  && npm cache clean --force

COPY --from=build /workspace/dist/apps/app-console/main.js ./main.js
COPY --from=build /workspace/apps/app-console/config ./apps/app-console/config
COPY --from=generate /workspace/libs/core/src/providers/prisma/generated/prisma ./libs/core/src/providers/prisma/generated/prisma
COPY --from=generate /workspace/libs/products/src/infrastructure/prisma/generated/prisma ./libs/products/src/infrastructure/prisma/generated/prisma

RUN mkdir -p /app/logs/app-console \
  && chown -R node:node /app

USER node

CMD ["node", "main.js"]
