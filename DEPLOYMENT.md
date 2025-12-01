# PersonalityMatch Deployment Guide

Complete deployment instructions for the PersonalityMatch hybrid application.

## Architecture Overview

**Hybrid Architecture:**
- **Frontend**: React SPA with SQL.js (browser-based database) deployed to AWS S3
- **Backend**: Node.js/Express API deployed to Docker containers
- **Database**: PostgreSQL for user profiles and matches
- **Cache**: Redis for sessions and rate limiting
- **Storage**: S3 for video uploads
- **Payments**: Stripe for $1 unlock fees
- **Real-time**: Socket.io for chat

## Prerequisites

### Required Services

1. **AWS Account**
   - S3 bucket for frontend hosting
   - (Optional) S3 bucket for video storage
   - CloudFront for CDN

2. **Database**
   - PostgreSQL 14+ instance
   - Option A: AWS RDS PostgreSQL
   - Option B: Self-hosted with Docker

3. **Google OAuth**
   - Create project at https://console.cloud.google.com/
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URIs

4. **Stripe Account**
   - Sign up at https://stripe.com/
   - Get API keys from dashboard
   - Set up webhook endpoint

5. **Email Service**
   - SMTP server for OTP emails
   - Option A: Gmail with app password
   - Option B: SendGrid, AWS SES, etc.

### Development Tools

- Node.js 18+
- Docker & Docker Compose
- AWS CLI (for S3 deployment)
- Git

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd skills-getting-started-with-github-copilot
```

### 2. Configure Environment Variables

Copy example environment file:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
- Database connection
- JWT secret (generate with `openssl rand -base64 32`)
- Google OAuth credentials
- Stripe API keys
- SMTP settings
- Encryption key (generate with `openssl rand -hex 16`)

### 3. Backend Setup

```bash
cd backend
npm install
```

Create `.env` in backend directory:
```bash
cp .env.example .env
# Edit with your values
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

## Deployment Options

## Option 1: Docker Compose (Recommended for Development/Testing)

### Quick Start

```bash
# From project root
docker-compose up -d
```

This starts:
- PostgreSQL database on port 5432
- Redis cache on port 6379
- Backend API on port 3001

### Verify Deployment

```bash
# Check services
docker-compose ps

# View logs
docker-compose logs -f backend

# Test health endpoint
curl http://localhost:3001/health
```

### Run Database Migrations

```bash
docker-compose exec backend npm run migrate
```

### Stop Services

```bash
docker-compose down

# With data cleanup
docker-compose down -v
```

## Option 2: Production Deployment

### Backend Deployment (AWS ECS/EC2)

#### Using AWS ECS (Elastic Container Service)

1. **Build and push Docker image:**

```bash
# Build image
cd backend
docker build -t personalitymatch-backend .

# Tag for ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag personalitymatch-backend:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/personalitymatch-backend:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/personalitymatch-backend:latest
```

2. **Create ECS Task Definition:**

```json
{
  "family": "personalitymatch-backend",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/personalitymatch-backend:latest",
      "memory": 1024,
      "cpu": 512,
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"},
        {"name": "PORT", "value": "3001"}
      ],
      "secrets": [
        {"name": "DB_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/personalitymatch-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

3. **Create ECS Service with ALB:**

```bash
aws ecs create-service \
  --cluster personalitymatch-cluster \
  --service-name backend-service \
  --task-definition personalitymatch-backend \
  --desired-count 2 \
  --launch-type FARGATE \
  --load-balancers targetGroupArn=<target-group-arn>,containerName=backend,containerPort=3001 \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}"
```

#### Using EC2

1. **Launch EC2 instance** (t3.medium or larger)

2. **Install Docker:**

```bash
sudo yum update -y
sudo yum install docker -y
sudo service docker start
sudo usermod -a -G docker ec2-user
```

3. **Deploy with Docker Compose:**

```bash
# Copy docker-compose.yml and .env to EC2
scp docker-compose.yml ec2-user@<ec2-ip>:~/
scp .env ec2-user@<ec2-ip>:~/

# SSH to EC2
ssh ec2-user@<ec2-ip>

# Start services
docker-compose up -d
```

4. **Setup Nginx reverse proxy:**

```nginx
server {
    listen 80;
    server_name api.personalitymatch.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.io support
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### Database Setup (AWS RDS)

1. **Create RDS PostgreSQL instance:**

```bash
aws rds create-db-instance \
  --db-instance-identifier personalitymatch-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 20 \
  --storage-type gp2 \
  --vpc-security-group-ids sg-xxx \
  --db-subnet-group-name default \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00"
```

2. **Run migrations:**

```bash
# From backend directory
DB_HOST=<rds-endpoint> npm run migrate
```

### Frontend Deployment (AWS S3 + CloudFront)

**Already implemented in frontend/deploy-s3.sh**

1. **Configure AWS CLI:**

```bash
aws configure
```

2. **Create S3 bucket:**

```bash
aws s3 mb s3://personalitymatch-frontend --region us-east-1
```

3. **Deploy frontend:**

```bash
cd frontend
./deploy-s3.sh personalitymatch-frontend
```

4. **Create CloudFront distribution:**

```bash
aws cloudfront create-distribution \
  --origin-domain-name personalitymatch-frontend.s3.amazonaws.com \
  --default-root-object index.html
```

5. **Update frontend config:**

Edit `frontend/src/config.js`:
```javascript
export const API_URL = 'https://api.personalitymatch.com';
```

Rebuild and redeploy:
```bash
npm run build
./deploy-s3.sh personalitymatch-frontend
```

### Stripe Webhook Setup

1. **Create webhook endpoint in Stripe Dashboard:**
   - URL: `https://api.personalitymatch.com/api/payments/webhook`
   - Events: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`

2. **Get webhook signing secret** and add to `.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

3. **Test webhook:**

```bash
stripe listen --forward-to localhost:3001/api/payments/webhook
```

## Monitoring & Logging

### Health Checks

- Backend: `GET https://api.personalitymatch.com/health`
- Database: Check RDS metrics in CloudWatch
- Frontend: Monitor S3/CloudFront in CloudWatch

### Logging

**Backend Logs (CloudWatch):**

```bash
# View logs
aws logs tail /ecs/personalitymatch-backend --follow
```

**Application Logs:**

The backend uses Winston for logging. Configure log level:
```bash
LOG_LEVEL=info  # debug, info, warn, error
```

### Monitoring

**CloudWatch Alarms:**

1. High error rate
2. Database connection failures
3. High API latency
4. Payment failures

## SSL/TLS Certificates

### Backend (ALB)

Request ACM certificate:
```bash
aws acm request-certificate \
  --domain-name api.personalitymatch.com \
  --validation-method DNS
```

### Frontend (CloudFront)

CloudFront automatically provides SSL for CloudFront domains.

For custom domain:
```bash
aws acm request-certificate \
  --domain-name personalitymatch.com \
  --region us-east-1 \
  --validation-method DNS
```

## Scaling

### Backend Scaling

**ECS Auto Scaling:**

```bash
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/personalitymatch-cluster/backend-service \
  --min-capacity 2 \
  --max-capacity 10

aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/personalitymatch-cluster/backend-service \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration \
  'TargetValue=70.0,PredefinedMetricSpecification={PredefinedMetricType=ECSServiceAverageCPUUtilization}'
```

### Database Scaling

**RDS Read Replicas:**

```bash
aws rds create-db-instance-read-replica \
  --db-instance-identifier personalitymatch-db-replica \
  --source-db-instance-identifier personalitymatch-db
```

## Backup & Recovery

### Database Backups

RDS automatically backs up daily. To create manual snapshot:

```bash
aws rds create-db-snapshot \
  --db-instance-identifier personalitymatch-db \
  --db-snapshot-identifier personalitymatch-snapshot-$(date +%Y%m%d)
```

### Video Uploads Backup

If using S3 for videos:
- Enable S3 versioning
- Configure S3 lifecycle policies
- Set up cross-region replication

## Cost Optimization

**Estimated Monthly Costs (1000 active users):**

- RDS db.t3.micro: $15
- ECS Fargate (2 tasks): $30
- S3 frontend: $1
- CloudFront: $5
- ALB: $20
- Stripe fees (100 transactions): $33
- **Total: ~$104/month**

**Scaling to 10,000 users:**
- Upgrade to RDS db.t3.small: $30
- Increase ECS tasks to 4: $60
- Additional bandwidth: $20
- **Total: ~$200/month**

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker-compose logs backend

# Common issues:
# - Database not accessible: Check DB_HOST and credentials
# - Missing env vars: Verify .env file
# - Port already in use: Change PORT in .env
```

### Database connection fails

```bash
# Test connection
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME>

# Check security groups allow port 5432
# Verify credentials in .env
```

### Stripe webhook not working

```bash
# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test locally
stripe listen --forward-to localhost:3001/api/payments/webhook

# Verify endpoint URL in Stripe Dashboard
```

### Video upload fails

```bash
# Check upload directory permissions
ls -la backend/uploads

# Verify MAX_VIDEO_SIZE setting
# Check FFmpeg installation: docker-compose exec backend ffmpeg -version
```

## Security Checklist

- [ ] Change all default passwords
- [ ] Use strong JWT_SECRET (32+ characters)
- [ ] Enable HTTPS/SSL for all endpoints
- [ ] Configure CORS to allow only frontend domain
- [ ] Set up WAF rules on ALB
- [ ] Enable RDS encryption at rest
- [ ] Use AWS Secrets Manager for sensitive env vars
- [ ] Set up CloudWatch alarms for suspicious activity
- [ ] Regular security updates: `docker-compose pull && docker-compose up -d`
- [ ] Implement rate limiting (already configured)
- [ ] Enable MFA for AWS account

## Support

For deployment issues:
1. Check logs: `docker-compose logs -f`
2. Verify environment variables
3. Test health endpoint
4. Review CloudWatch metrics
5. Contact development team

## License

MIT
