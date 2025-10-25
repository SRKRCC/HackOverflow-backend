# AWS Lambda Deployment Guide

## Prerequisites Checklist

### AWS Setup
- AWS Account with root access
- IAM User created with deployment permissions
- Access Key ID and Secret Access Key generated
- Region set to `ap-south-1` (Mumbai)

### Database Setup
- PostgreSQL database accessible from the internet
- Database URL with SSL support
- Connection tested and working

### GitHub Setup
- Repository pushed to GitHub
- GitHub Secrets configured

---

## Deployment

### 1: AWS IAM Configuration

1.a. **Login to AWS Console** → IAM → Users → Create User
   ```
   Username: hackoverflow
   Access Type: Programmatic access
   ```

2. **Create Custom Policy** → Policies → Create Policy
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "cloudformation:*",
           "lambda:*",
           "apigateway:*",
           "iam:*",
           "logs:*",
           "s3:*"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

3. **Attach Policy to User**
4. **Generate Access Keys** → Save securely

### Step 2: GitHub Secrets Configuration

Go to **GitHub Repository** → Settings → Secrets and Variables → Actions

Add these secrets:
```
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

and our all remaining .env secrets
```

### Step 3: Local Testing

```bash
npm install

# Test serverless locally
npm run dev:serverless

# Build for production
npm run build
```

### Step 4: Deploy to AWS

```bash
# Deploy via GitHub Actions (push to master branch)
git add .
git commit -m "Deploy to AWS Lambda"
git push origin master

# Or deploy manually
npm run deploy:prod
```

---

## API Gateway Endpoints

After deployment, we'll get URLs like:
```
https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod/api/auth/login
https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod/api/teams
https://xxxxxxxxxx.execute-api.ap-south-1.amazonaws.com/prod/api/tasks
```

---

## Configuration Files

### serverless.yml
- Stage: `prod`
- Region: `ap-south-1`
- Runtime: `nodejs18.x`

### lambda.ts
- Express app wrapped with `serverless-http`
- CORS configured for production
- Health check endpoint

---

## Monitoring & Logs

```bash
# View function logs
npm run logs

# Get deployment info
npx serverless info --stage prod

# Remove deployment (cleanup)
npm run remove
```

---

## CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Installs dependencies
2. Generates Prisma client
3. Configures AWS credentials
4. Deploys to Lambda
5. Runs database migrations
6. Provides deployment info
