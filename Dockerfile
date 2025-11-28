# Lambda base image (Amazon Linux 2 based)
FROM public.ecr.aws/lambda/nodejs:20 AS build
WORKDIR /var/task

# Install OpenSSL and development tools
RUN (yum update -y && yum install -y openssl openssl-devel && yum clean all) || \
    (apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*)

# Copy package files
COPY package*.json ./

# Install all dependencies
RUN npm ci && npm cache clean --force

# Copy Prisma schema and config
COPY prisma ./prisma

# Generate Prisma client with correct binary for Lambda
RUN npx prisma generate

# Copy TypeScript compiled code
COPY dist ./dist

# Production stage - same base image
FROM public.ecr.aws/lambda/nodejs:20 AS runtime
WORKDIR /var/task

# Install OpenSSL for runtime
RUN (yum update -y && yum install -y openssl && yum clean all) || \
    (apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*)

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy built application and generated files from build stage
COPY --from=build /var/task/dist ./dist
COPY --from=build /var/task/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /var/task/src/generated ./src/generated
COPY --from=build /var/task/prisma ./prisma

# Set Lambda handler
CMD ["dist/app.handler"]