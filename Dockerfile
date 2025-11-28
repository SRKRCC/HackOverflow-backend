# Lambda base image
FROM public.ecr.aws/lambda/nodejs:20 AS build
WORKDIR /var/task

# Install OpenSSL 1.0 (required for Prisma on Amazon Linux 2)
RUN yum install -y openssl openssl-devel && yum clean all

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

# Install OpenSSL runtime
RUN yum install -y openssl && yum clean all

# Copy only production dependencies and generated files
COPY --from=build /var/task/package*.json ./
COPY --from=build /var/task/dist ./dist
COPY --from=build /var/task/node_modules ./node_modules
COPY --from=build /var/task/prisma ./prisma

# Set Lambda handler
CMD ["dist/app.handler"]