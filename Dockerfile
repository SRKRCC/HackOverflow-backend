# Build stage: Amazon Linux 2023 (same family as Lambda public image) to generate Prisma client
FROM amazonlinux:2023 AS build
WORKDIR /app

# Install DNF tools, OpenSSL and Node.js 20
RUN microdnf update -y && \
    microdnf install -y openssl openssl-devel curl tar gzip && \
    curl -fsSL https://rpm.nodesource.com/setup_20.x | bash - && \
    microdnf install -y nodejs && microdnf clean all

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Copy source and configuration
COPY tsconfig.json ./
COPY src ./src
COPY prisma ./prisma

# Build TypeScript and generate Prisma client with correct binary for Amazon Linux 2023
RUN npx tsc && npx prisma generate

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
COPY --from=build /app/src/generated ./src/generated
COPY --from=build /app/prisma ./prisma

# Set Lambda handler
CMD ["dist/app.handler"]