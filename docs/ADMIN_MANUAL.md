# PersonalityMatch - Administrator Manual

**For:** System Administrators, DevOps, Site Reliability Engineers

**Version:** 1.0
**Date:** December 2024

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Deployment & Hosting](#2-deployment--hosting)
3. [Monitoring & Maintenance](#3-monitoring--maintenance)
4. [Troubleshooting](#4-troubleshooting)
5. [Security](#5-security)
6. [Backup & Recovery](#6-backup--recovery)
7. [Scaling](#7-scaling)
8. [Updates & Upgrades](#8-updates--upgrades)

---

## 1. System Overview

### 1.1 Architecture Summary

PersonalityMatch is a **static web application** with a unique architecture:

**Key Characteristics:**
- **Frontend-Only:** No backend servers
- **Client-Side Database:** SQLite in WebAssembly (SQL.js)
- **Local Storage:** Browser IndexedDB
- **Static Hosting:** AWS S3, Netlify, Vercel, or any CDN

**Technology Stack:**
- React 18 + Vite
- SQL.js (SQLite WASM)
- React Router DOM
- localforage (IndexedDB wrapper)

### 1.2 System Components

```
┌─────────────────────────────────────────┐
│         User's Browser                   │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │     React Application            │  │
│  │  - UI Components                 │  │
│  │  - Routing                       │  │
│  │  - State Management              │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │     SQL.js (SQLite WASM)         │  │
│  │  - In-memory database            │  │
│  │  - Full SQL support              │  │
│  └──────────────────────────────────┘  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │     IndexedDB (localforage)      │  │
│  │  - Persistent storage            │  │
│  │  - Database serialization        │  │
│  └──────────────────────────────────┘  │
└─────────────────────────────────────────┘

         ↕ HTTPS (initial load only)

┌─────────────────────────────────────────┐
│         Static File Host (S3/CDN)        │
│  - index.html                           │
│  - JavaScript bundles                   │
│  - CSS files                            │
│  - Assets                               │
└─────────────────────────────────────────┘
```

---

## 2. Deployment & Hosting

### 2.1 Prerequisites

**Requirements:**
- AWS CLI installed and configured
- S3 bucket with static website hosting enabled
- (Optional) CloudFront distribution for HTTPS/CDN

**Node.js Environment (for build):**
- Node.js 18+ 
- npm 9+

### 2.2 Initial Setup

#### Step 1: Clone Repository

```bash
git clone https://github.com/your-org/personality-match.git
cd personality-match/frontend
```

#### Step 2: Install Dependencies

```bash
npm install
```

#### Step 3: Build for Production

```bash
npm run build
```

Output: `dist/` directory with optimized static files

#### Step 4: Create S3 Bucket

```bash
# Replace 'your-bucket-name' with actual name
aws s3 mb s3://your-bucket-name --region us-east-1
```

#### Step 5: Enable Static Website Hosting

```bash
aws s3 website s3://your-bucket-name \
  --index-document index.html \
  --error-document index.html
```

**Why `error-document index.html`?**
Enables client-side routing (SPA) — all 404s redirect to index.html.

#### Step 6: Set Bucket Policy

Create `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

Apply:

```bash
aws s3api put-bucket-policy \
  --bucket your-bucket-name \
  --policy file://bucket-policy.json
```

#### Step 7: Deploy

```bash
chmod +x deploy-s3.sh
./deploy-s3.sh your-bucket-name
```

**Website URL:**
```
http://your-bucket-name.s3-website-us-east-1.amazonaws.com
```

### 2.3 Automated Deployment Script

The included `deploy-s3.sh` script automates:

1. **Build** - `npm run build`
2. **Sync** - Upload to S3 with `--delete` flag
3. **Set Content Types** - HTML, JS, CSS
4. **Cache Control** - Long cache for assets, no cache for HTML

**Script Location:** `frontend/deploy-s3.sh`

**Usage:**
```bash
./deploy-s3.sh your-bucket-name
```

### 2.4 CloudFront Setup (Recommended for Production)

#### Why CloudFront?

- **HTTPS:** SSL/TLS encryption
- **Global CDN:** Low latency worldwide
- **Caching:** Faster loads, lower S3 costs
- **Custom Domain:** yourdomain.com

#### Setup Steps:

1. **Create Distribution:**
   ```bash
   aws cloudfront create-distribution \
     --origin-domain-name your-bucket-name.s3-website-us-east-1.amazonaws.com \
     --default-root-object index.html
   ```

2. **Configure Error Pages:**
   - 404 → /index.html (200) — for SPA routing
   - 403 → /index.html (200)

3. **Request SSL Certificate (ACM):**
   ```bash
   aws acm request-certificate \
     --domain-name yourdomain.com \
     --validation-method DNS
   ```

4. **Point Domain:**
   - Create CNAME: `yourdomain.com` → `d123abc.cloudfront.net`
   - Or use Route 53 A record with alias

### 2.5 Alternative Hosting Options

**Netlify:**
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**GitHub Pages:**
```bash
npm run build
gh-pages -d dist
```

---

## 3. Monitoring & Maintenance

### 3.1 What to Monitor

**Since there's no backend:**
- ✅ Static file availability (uptime)
- ✅ CDN cache hit rate
- ✅ Client-side errors (via optional logging)
- ❌ No server metrics (CPU, memory, etc.)
- ❌ No database queries (all client-side)
- ❌ No API response times

### 3.2 Monitoring Setup

#### CloudWatch (S3 Metrics)

**Key Metrics:**
- `NumberOfObjects` - Files in bucket
- `BucketSizeBytes` - Total storage
- `AllRequests` - Request count
- `4xxErrors` - Client errors
- `5xxErrors` - Server errors (rare for S3)

**Alarms:**
```bash
aws cloudwatch put-metric-alarm \
  --alarm-name s3-high-errors \
  --metric-name 4xxErrors \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --period 300
```

#### Uptime Monitoring

**Options:**
- **Pingdom** - Check homepage every 1 minute
- **UptimeRobot** - Free tier: 5-minute intervals
- **StatusCake** - Free plan available
- **AWS CloudWatch Synthetics** - Canary scripts

**What to Monitor:**
- Homepage loads (200 status)
- SQL.js loads from CDN
- IndexedDB available

#### Client-Side Error Logging (Optional)

**Sentry Integration:**

```javascript
// In main.jsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://your-sentry-dsn",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 0.1,
});
```

**Tracks:**
- JavaScript errors
- Unhandled promise rejections
- SQL.js initialization failures

### 3.3 Log Analysis

**S3 Access Logs:**

Enable:
```bash
aws s3api put-bucket-logging \
  --bucket your-bucket-name \
  --bucket-logging-status file://logging.json
```

`logging.json`:
```json
{
  "LoggingEnabled": {
    "TargetBucket": "your-logs-bucket",
    "TargetPrefix": "s3-access-logs/"
  }
}
```

**Analyze with Athena:**
```sql
SELECT 
  request_uri, 
  status_code, 
  COUNT(*) as requests
FROM s3_access_logs
WHERE status_code >= 400
GROUP BY request_uri, status_code
ORDER BY requests DESC;
```

### 3.4 Performance Monitoring

**Web Vitals:**
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1

**Tools:**
- Google Lighthouse (Chrome DevTools)
- PageSpeed Insights
- WebPageTest

**Monthly Check:**
```bash
# Run Lighthouse CLI
npm install -g lighthouse
lighthouse https://yourdomain.com --output html --output-path report.html
```

---

## 4. Troubleshooting

### 4.1 Common Issues

#### Issue: "Site not loading"

**Check:**
1. S3 bucket public read policy
2. Static website hosting enabled
3. DNS/CloudFront configuration
4. CORS if loading from subdomain

**Debug:**
```bash
# Test S3 website endpoint directly
curl -I http://your-bucket-name.s3-website-us-east-1.amazonaws.com

# Should return 200 OK
```

---

#### Issue: "SQL.js fails to load"

**Causes:**
- CDN unreachable
- CORS policy blocking
- Adblocker interference

**Fix:**
1. **Host SQL.js locally:**
   ```bash
   # Copy SQL.js WASM to public/
   cp node_modules/sql.js/dist/sql-wasm.wasm public/
   ```

2. **Update database.js:**
   ```javascript
   SQL = await initSqlJs({
     locateFile: file => `/sql-wasm.wasm`  // Local path
   });
   ```

3. **Redeploy:**
   ```bash
   npm run build && ./deploy-s3.sh your-bucket-name
   ```

---

#### Issue: "Routing doesn't work (404 on refresh)"

**Cause:**
SPA routing not configured — S3 returns 404 for `/matches` path.

**Fix:**
Ensure error document is set to `index.html`:

```bash
aws s3 website s3://your-bucket-name \
  --index-document index.html \
  --error-document index.html
```

For CloudFront, configure custom error response:
- 404 → /index.html (200 status)

---

#### Issue: "Browser shows old version"

**Cause:**
Browser cache or CloudFront cache not invalidated.

**Fix:**

1. **Clear CloudFront cache:**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E123ABCDEFG \
     --paths "/*"
   ```

2. **Force refresh:** Ctrl+Shift+R (Cmd+Shift+R on Mac)

3. **Check cache headers:**
   ```bash
   curl -I https://yourdomain.com/assets/index-abc123.js
   # Should show Cache-Control: max-age=31536000
   ```

---

### 4.2 Debugging Tools

**Browser Developer Tools:**

1. **Console:** Check for JavaScript errors
2. **Network:** Verify file loading (200 status codes)
3. **Application → IndexedDB:** Check database storage
4. **Application → Storage:** View data size

**Testing SQL.js:**

```javascript
// In browser console
initSqlJs({ locateFile: file => `https://sql.js.org/dist/${file}` })
  .then(SQL => {
    console.log('SQL.js loaded successfully');
    const db = new SQL.Database();
    console.log('Database created');
  })
  .catch(err => console.error('SQL.js failed:', err));
```

---

## 5. Security

### 5.1 Security Architecture

**Threat Model:**

Since all processing is client-side:
- ✅ No server vulnerabilities
- ✅ No database injection attacks
- ✅ No session hijacking
- ⚠️ Client-side code tampering possible
- ⚠️ Browser vulnerabilities affect users

### 5.2 Security Measures

#### Content Security Policy (CSP)

Add to S3 metadata or CloudFront headers:

```
Content-Security-Policy: 
  default-src 'self'; 
  script-src 'self' https://sql.js.org; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data:; 
  connect-src 'self';
```

Apply via S3:
```bash
aws s3 cp dist/index.html s3://your-bucket-name/index.html \
  --metadata-directive REPLACE \
  --content-type "text/html" \
  --cache-control "max-age=0" \
  --metadata '{"Content-Security-Policy":"default-src 'self'"}'
```

#### Subresource Integrity (SRI)

For external scripts (SQL.js):

```html
<script 
  src="https://sql.js.org/dist/sql-wasm.js" 
  integrity="sha384-ABC123..." 
  crossorigin="anonymous">
</script>
```

#### HTTPS Only

**Force HTTPS in CloudFront:**
```json
{
  "ViewerProtocolPolicy": "redirect-to-https"
}
```

#### Bucket Permissions

**Principle of Least Privilege:**
- Public: Read-only access to objects
- Admin: Restricted to CI/CD service account

**Audit Regularly:**
```bash
aws s3api get-bucket-acl --bucket your-bucket-name
aws s3api get-bucket-policy --bucket your-bucket-name
```

### 5.3 Incident Response

**If Compromised:**

1. **Immediate Actions:**
   - Take site offline (disable CloudFront distribution)
   - Review S3 access logs
   - Check for unauthorized changes

2. **Investigation:**
   - Review AWS CloudTrail logs
   - Check IAM user activity
   - Verify file checksums

3. **Remediation:**
   - Rotate AWS credentials
   - Update MFA requirements
   - Redeploy known-good version
   - Notify users if data affected

4. **Prevention:**
   - Enable MFA on all accounts
   - Use IAM roles, not keys
   - Implement branch protection on Git repo

---

## 6. Backup & Recovery

### 6.1 What to Back Up

**Critical Assets:**
- Source code (Git repository)
- Build configuration (package.json, vite.config.js)
- Deployment scripts

**S3 Bucket (Nice-to-Have):**
- Compiled static files (reproducible from source)

### 6.2 Backup Strategy

**Git Repository:**
- **Primary:** GitHub/GitLab (already backed up)
- **Secondary:** Local clone on admin machine
- **Tertiary:** ZIP archive on separate storage

**S3 Versioning:**

Enable:
```bash
aws s3api put-bucket-versioning \
  --bucket your-bucket-name \
  --versioning-configuration Status=Enabled
```

Allows rollback to previous versions.

### 6.3 Disaster Recovery

**Scenario: S3 Bucket Deleted**

**Recovery:**
1. Recreate bucket
2. Rebuild from source:
   ```bash
   git clone <repo>
   cd frontend
   npm install
   npm run build
   ./deploy-s3.sh your-bucket-name
   ```
3. Reconfigure DNS/CloudFront

**RTO (Recovery Time Objective):** < 30 minutes
**RPO (Recovery Point Objective):** Latest Git commit

**Scenario: Source Code Lost**

**Prevention:**
- Use GitHub/GitLab (automatic backups)
- Multiple contributors with local clones
- Weekly ZIP backups to separate storage

---

## 7. Scaling

### 7.1 Scalability Characteristics

**Automatic Scaling:**
- S3 scales automatically to any request volume
- CloudFront handles millions of requests/second
- Client-side processing scales with users' devices

**No Traditional Scaling Needed:**
- ❌ No server capacity planning
- ❌ No load balancing configuration
- ❌ No database connection pooling
- ✅ Pay only for bandwidth

### 7.2 Cost Scaling

**S3 Pricing (Example):**
- Storage: $0.023/GB/month
- Requests: $0.0004 per 1,000 GET requests
- Data Transfer: $0.09/GB out

**Estimated Costs:**

| Users | Storage | Requests/Month | Data Transfer | Monthly Cost |
|-------|---------|----------------|---------------|--------------|
| 1,000 | 1GB | 100K | 10GB | ~$2 |
| 10,000 | 1GB | 1M | 100GB | ~$10 |
| 100,000 | 1GB | 10M | 1TB | ~$100 |
| 1M | 1GB | 100M | 10TB | ~$1,000 |

**Note:** CloudFront reduces costs by caching at edge locations.

### 7.3 Performance at Scale

**Bottlenecks:**
1. **CDN Cache Miss Rate** - Mitigate with longer TTL
2. **SQL.js WASM Download** - ~500KB, one-time per user
3. **User Device Performance** - Client-side processing

**Optimization:**
- Use CloudFront with long cache times
- Compress assets (Gzip/Brotli)
- Code splitting (already implemented)
- Service Worker for offline support (future)

---

## 8. Updates & Upgrades

### 8.1 Deployment Process

**Pre-Deployment Checklist:**
- [ ] All tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] Manual testing in staging
- [ ] Changelog updated
- [ ] Version bumped in package.json

**Deployment Steps:**

1. **Build:**
   ```bash
   npm run build
   ```

2. **Test Build Locally:**
   ```bash
   npm run preview
   # Open http://localhost:4173
   ```

3. **Deploy:**
   ```bash
   ./deploy-s3.sh your-bucket-name
   ```

4. **Invalidate CloudFront Cache:**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E123ABCDEFG \
     --paths "/*"
   ```

5. **Verify:**
   - Check homepage loads
   - Complete questionnaire
   - View matches
   - Check browser console for errors

### 8.2 Rollback Procedure

**If deployment breaks:**

1. **Immediate:** Disable CloudFront distribution (stops traffic)

2. **Restore Previous Version:**
   - If S3 versioning enabled:
     ```bash
     aws s3api list-object-versions \
       --bucket your-bucket-name \
       --prefix index.html
     
     # Copy previous version
     aws s3api copy-object \
       --bucket your-bucket-name \
       --copy-source your-bucket-name/index.html?versionId=ABC123 \
       --key index.html
     ```
   - Or rebuild from previous Git commit:
     ```bash
     git checkout <previous-commit>
     npm run build
     ./deploy-s3.sh your-bucket-name
     ```

3. **Invalidate Cache:**
   ```bash
   aws cloudfront create-invalidation \
     --distribution-id E123ABCDEFG \
     --paths "/*"
   ```

4. **Re-enable CloudFront**

### 8.3 Dependency Updates

**Monthly Maintenance:**

```bash
# Check outdated packages
npm outdated

# Update non-breaking
npm update

# Test
npm test
npm run build
npm run preview

# If all OK, commit and deploy
```

**Major Version Upgrades:**
- Read changelogs carefully (React, Vite, etc.)
- Test in staging first
- Have rollback plan

### 8.4 Database Schema Changes

**Since DB is client-side:**

**Migration Strategy:**
1. Update `database.js` schema
2. Increment `DB_VERSION` constant
3. Add migration logic:
   ```javascript
   if (existingVersion < newVersion) {
     runMigration(existingVersion, newVersion);
   }
   ```
4. Deploy
5. Users' databases upgrade on next visit

**Example Migration:**
```javascript
function migrateV1toV2(db) {
  db.run('ALTER TABLE users ADD COLUMN locale TEXT DEFAULT "en-US"');
}
```

---

## 9. Operational Procedures

### 9.1 Daily Tasks

- ✅ Check uptime monitor (automated alerts)
- ✅ Review error logs (if Sentry enabled)
- ✅ Monitor S3 costs (CloudWatch dashboard)

**Time:** 5 minutes/day

### 9.2 Weekly Tasks

- Check S3 access logs for anomalies
- Review performance metrics (Lighthouse score)
- Update status page (if applicable)

**Time:** 15 minutes/week

### 9.3 Monthly Tasks

- Dependency updates (`npm outdated`)
- Security audit (`npm audit`)
- Cost analysis and optimization
- Backup verification (restore test)

**Time:** 1 hour/month

### 9.4 Quarterly Tasks

- Disaster recovery drill (full restore from backup)
- Architecture review (scale, cost, security)
- Update documentation
- Performance benchmarking

**Time:** 2 hours/quarter

---

## 10. Contact & Escalation

### 10.1 Support Contacts

**Tier 1 (Admin Team):**
- On-call rotation
- Handles: Deployment, monitoring, basic issues

**Tier 2 (Development Team):**
- Handles: Code bugs, feature requests, complex issues
- Escalate: After 30 minutes of troubleshooting

**Tier 3 (External):**
- AWS Support (if paid plan)
- CDN provider support

### 10.2 Escalation Matrix

| Issue | Response Time | Escalation |
|-------|---------------|------------|
| Site down | Immediate | Tier 1 → Tier 2 after 15 min |
| Performance degraded | < 1 hour | Tier 1 → Tier 2 after 1 hour |
| Security incident | Immediate | Tier 1 + Tier 2 + Management |
| Bug report | < 1 business day | Tier 2 |
| Feature request | < 1 week | Tier 2 → Product |

---

## Appendix A: Command Reference

### Deployment

```bash
# Build and deploy
npm run build && ./deploy-s3.sh your-bucket-name

# Deploy only (no build)
aws s3 sync dist/ s3://your-bucket-name/ --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E123ABC \
  --paths "/*"
```

### Monitoring

```bash
# S3 bucket size
aws s3 ls s3://your-bucket-name --recursive --summarize

# Recent S3 access logs
aws s3 cp s3://logs-bucket/s3-access-logs/ . --recursive

# CloudWatch metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/S3 \
  --metric-name NumberOfObjects \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 86400 \
  --statistics Average
```

### Backup

```bash
# Enable S3 versioning
aws s3api put-bucket-versioning \
  --bucket your-bucket-name \
  --versioning-configuration Status=Enabled

# List versions
aws s3api list-object-versions \
  --bucket your-bucket-name
```

---

## Appendix B: Checklists

### Pre-Deployment Checklist

- [ ] Code reviewed and approved
- [ ] Tests passing
- [ ] Build succeeds
- [ ] Tested in staging
- [ ] Changelog updated
- [ ] Team notified
- [ ] Rollback plan ready

### Post-Deployment Checklist

- [ ] Homepage loads (200 OK)
- [ ] SQL.js initializes
- [ ] Questionnaire completes
- [ ] Matches display
- [ ] No console errors
- [ ] CloudFront cache invalidated
- [ ] Monitoring shows no alerts

---

**Document Version:** 1.0
**Last Updated:** December 2024
**Next Review:** Q2 2025

For technical questions: devops@personalitymatch.example.com
