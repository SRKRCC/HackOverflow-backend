# Build stage: Amazon Linux 2023 (same family as Lambda public image) to generate Prisma client
FROM node:20-bullseye-slim AS build
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

COPY prisma ./prisma

RUN npx prisma generate
# Copy source and configuration
COPY dist ./dist



# Production stage - same base image
# Runtime stage: Lambda official Node 20 image
FROM public.ecr.aws/lambda/nodejs:20 AS runtime
WORKDIR /var/task

# Copy production package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy generated code and runtime node_modules from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/prisma ./prisma

# Set Lambda handler
CMD ["dist/app.handler"]