# PersonalityMatch Frontend 💚

A React-based dating personality matching application that runs entirely in the browser using SQLite (SQL.js).

## 🌟 Features

- **Big Five Personality Assessment**: IPIP-50 questionnaire (50 items, ~7-10 minutes)
- **Browser-Based Database**: SQLite running entirely in the browser via SQL.js
- **Personality Profiling**: Comprehensive Big Five (OCEAN) trait analysis
- **Intelligent Matching**: Research-based compatibility algorithm
- **Privacy-First**: All data stored locally, no external servers
- **S3-Ready**: Optimized for deployment to AWS S3 static hosting

## 🚀 Quick Start

### Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:5173
```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## ☁️ Deploy to AWS S3

### Quick Deploy

```bash
chmod +x deploy-s3.sh
./deploy-s3.sh your-bucket-name
```

### Manual Setup

1. **Create S3 bucket**:
   ```bash
   aws s3 mb s3://your-bucket-name
   ```

2. **Enable static website hosting**:
   ```bash
   aws s3 website s3://your-bucket-name --index-document index.html --error-document index.html
   ```

3. **Set public read policy** - Create `bucket-policy.json`:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [{
       "Effect": "Allow",
       "Principal": "*",
       "Action": "s3:GetObject",
       "Resource": "arn:aws:s3:::your-bucket-name/*"
     }]
   }
   ```

4. **Apply policy**:
   ```bash
   aws s3api put-bucket-policy --bucket your-bucket-name --policy file://bucket-policy.json
   ```

Your app: `http://your-bucket-name.s3-website-[region].amazonaws.com`

## 🏗️ Project Structure

```
src/
├── pages/           # Main page components
│   ├── Welcome.jsx  # Landing page
│   ├── Consent.jsx  # Consent & intake flow
│   ├── Questionnaire.jsx  # IPIP-50 assessment
│   ├── Results.jsx  # Personality profile
│   └── Matches.jsx  # Match recommendations
├── utils/
│   ├── database.js  # SQLite/SQL.js operations
│   └── matching.js  # Matching algorithm
├── data/
│   └── ipip50.js    # IPIP-50 questionnaire
└── App.jsx          # Main app + routing
```

## 🗄️ Database (SQL.js)

- **Engine**: SQLite in WebAssembly
- **Storage**: IndexedDB (persistent)
- **Size**: < 1MB per user
- **Privacy**: All local, no servers

## 🧠 Big Five Traits

- **O**penness: Imagination, curiosity
- **C**onscientiousness: Organization, responsibility  
- **E**xtraversion: Sociability, energy
- **A**greeableness: Compassion, cooperation
- **N**euroticism: Emotional sensitivity

## 🎯 Matching Algorithm

Uses **Mahalanobis distance** for uncertainty-aware similarity:

```javascript
similarity = exp(-0.5 * (t_A - t_B)^T * Σ^(-1) * (t_A - t_B))
final_score = 0.7*similarity + 0.2*complementarity
```

**Trait weights**:
- Conscientiousness: 1.2 (predicts relationship satisfaction)
- Agreeableness: 1.2 (predicts conflict resolution)
- Neuroticism: 0.8 (complementarity may help)

## 📖 Research Foundation

1. **Goldberg (1992)** - IPIP Big Five markers
2. **Finkel et al. (2012)** - Personality matching limitations
3. **Horwitz et al. (2023)** - Partner correlations

See `../research/behavior-analysis-dating-system/` for full specification.

## ⚠️ Limitations

- **Demo only**: Uses simulated candidate pool
- **Not validated**: Matching algorithm not empirically tested
- **One factor**: Personality alone doesn't predict relationship success
- **Self-report bias**: Social desirability effects

## 🔒 Privacy

- All data local to browser
- No external servers
- User can delete anytime
- IndexedDB storage

## 📊 Performance

- **Bundle**: ~800 KB gzipped
- **SQL.js**: ~500 KB (lazy loaded)
- **App code**: ~100 KB

## 🛠️ Tech Stack

- React 18 + Vite
- SQL.js (SQLite WASM)
- React Router
- localforage (IndexedDB)

## 📝 License

MIT - See parent repository

---

For complete algorithmic specification:  
`../research/behavior-analysis-dating-system/`
