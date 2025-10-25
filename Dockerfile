# Stage 1 — Build dependencies and Prisma
FROM node:20-slim AS build
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy Prisma files and generate client for production
COPY prisma ./prisma
RUN npx prisma generate --no-engine

# Copy compiled code
COPY dist ./dist

# Stage 2 — Smaller runtime image
FROM public.ecr.aws/lambda/nodejs:20 AS runtime
WORKDIR /var/task

# Copy only necessary runtime files
COPY --from=build /app/package*.json ./
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma

# Set Lambda handler
CMD ["dist/app.handler"]