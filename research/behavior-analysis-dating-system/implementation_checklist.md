# Dating Personality Matching System - Implementation Checklist

A compact, copy-pasteable engineering checklist for building a Big Five-based multimodal dating matching system.

---

## 📋 **1. INTAKE & CONSENT**

```python
# Present informed consent for all modalities
present_informed_consent(modalities=[photo, video, text, phone])

# Record granular consent flags
record_consent_flags(user_id)

# Age verification with liveness check
require_age_verification()

# Generate privacy-preserving ID
user_id = UUIDv4()
store_consent_record()
```

**Key Points:**
- Explicit checkbox per modality
- 30-day media retention default (opt-in for longer)
- Liveness selfie for age verification

---

## 📝 **2. QUESTIONNAIRE ADMINISTRATION**

```python
# Deliver validated Big Five instrument
deliver_IPIP(form="IPIP-50" or "IPIP-120")

# Optional modules
route_optional_modules([
    attachment_ECR,
    preferences,
    politics,
    demographics
])

# Fraud controls
insert_attention_checks(n=3)
flag_if_failed >= 2

# Save progress
save_partial_progress(every=5_items)
allow_resume(window_days=7)
```

**Fraud Detection:**
- Response time monitoring (< 200ms = flag)
- Device fingerprinting
- Geo-consistency checks

---

## 🖼️ **3. PREPROCESSING - FACE IMAGES**

```python
# Detection & filtering
detect_face(conf_thresh=0.9)
pose_limits = {yaw: 30°, roll: 30°, pitch: 15°}

# Alignment & quality
align_eyes()
resize(224, 224)
compute_quality_score()
keep_top_k(k=6)
```

**⚠️ Research Anchor:**
- **Static-face predictive signal is modest**
- Meta-analytic kernel **r ≈ 0.14**
- Study examples show r up to **≈0.28 for Neuroticism**
- ICC across photos high (**~0.80-0.88**)
- **Apply strong shrinkage to facial predictions**

---

## 🎥 **4. PREPROCESSING - VIDEO/FER**

```python
# Sample & extract
sample_fps = 10
per_frame_AU_or_FER()

# Summarize time-series
summarize(mean, sd, burst_rate)
spectral_entropy()
autocorrelation(lags=[1, 5, 10])
```

**Requirements:**
- Minimum 20s usable face time
- Action Unit (AU) or Facial Expression Recognition (FER) probabilities

---

## 📱 **5. PREPROCESSING - SMARTPHONE SENSORS**

```python
# Aggregate daily over 30 days
aggregate_daily(days=30):
    - calls, contacts
    - mobility_radius
    - home_pct
    - app_use_entropy
    - nocturnal_activity

# Derived features
compute_rolling(window=7d)
weekday_vs_weekend_ratio()
```

**✅ Research Anchor:**
- **Smartphone sensing anchors:**
- Median **r ≈ 0.37** (domain)
- Median **r ≈ 0.40** (facets)
- 30-day study, n=624
- **Strongest single modality for personality prediction**

---

## 📄 **6. PREPROCESSING - TEXT**

```python
# Clean & tokenize
clean_text(remove_pii=True)

# Transformer embed
BERT_base_encoder() -> CLS_vector

# Lexicon & topics
lexicon_counts(LIWC_like)
LDA_topics(n=50)

# Dimensionality reduction
PCA_to_128d()
```

---

## 🧪 **7. NORMALIZATION & LEAKAGE CONTROL**

```python
# Robust scaling
normalize_features(method="robust", params={median, IQR})

# Remove correlated with PII
remove_leakage(corr_thresh=0.95)

# Time-split validation
use_only_pre_signup_features()
```

---

## 🤖 **8. SUPERVISED LEARNING (PER-MODALITY)**

### **Face Images**
```python
model = ResNet50_encoder + MLP([512, 128])
loss = MSE
lr = 1e-4
wd = 1e-4
batch = 32
```

### **Video/FER**
```python
model = CNN_frame_encoder + BiLSTM(256) + Attention -> FC
```

### **Text**
```python
model = finetune_BERT(base) -> FC(256 -> 64)
```

### **Sensors (Smartphone)**
```python
model = LightGBM(
    num_trees=500,
    lr=0.01,
    max_depth=6
)
```

**Training Protocol:**
- **Nested CV:** outer=5 (stratify by gender, locale), inner=3
- **Holdout:** 15%
- **Early stopping:** patience=5 on val_Pearson_r
- **Checkpoint best model**

---

## 🎯 **9. UNCERTAINTY ESTIMATION**

```python
# Method 1: Deep Ensembles
deep_ensembles(K=5)

# Method 2: MC Dropout
MC_dropout(p=0.2, T=30)

# Output per modality
compute: mean_x_m, var_sigma_m^2
floor_sigma = 0.1
```

---

## 🔀 **10. MULTIMODAL FUSION**

### **Inverse Variance Weighting**
```python
w_m = (1/sigma_m^2) / sum(1/sigma_j^2)
fused_score = sum(w_m * x_m)
fused_var = 1 / sum(1/sigma_m^2)
```

### **Stacking Meta-Learner (Optional)**
```python
train_meta(
    features=[x_m, sigma_m, quality_m, flag_m]
) -> LightGBM
```

**Prefer inverse-variance by default** to avoid overfitting.

---

## 📊 **11. CALIBRATION TO PRIOR**

```python
# Bayesian shrinkage
lambda = fused_var / (fused_var + tau^2)
final = lambda * fused + (1 - lambda) * mu_pop
```

### **Set `tau²` per modality validity:**

| Modality | Expected r | Prior Variance (τ²) | Rationale |
|----------|-----------|---------------------|-----------|
| **Face** | 0.14-0.28 | **2.0** (high) | Low signal → strong shrinkage |
| **Sensors** | 0.37 | **0.5** (low) | High signal → less shrinkage |
| **Text** | — | **0.8** | Moderate |
| **Video/FER** | — | **1.0** | Moderate |

### **Post-hoc Calibration**
```python
isotonic_calibration_per_trait(validation_set)
clip_zscores(range=[-3, 3])
```

---

## 💑 **12. MATCH SCORING & RANKING**

### **Similarity Score**
```python
# Represent users by traits & covariances
t_A, t_B
S_A, S_B (diagonal)

# Mahalanobis distance (uncertainty-aware)
effective_distance = (t_A - t_B)^T * inv(S_A + S_B + S_pop) * (t_A - t_B)
similarity = exp(-0.5 * effective_distance)
```

### **Final Score**
```python
final_score =
    alpha * similarity +
    beta * complementarity -
    gamma * hard_penalties

# Defaults
alpha = 0.7
beta = 0.2
gamma = 1.0
```

### **Hard Filters**
```python
apply_explicit_prefs(
    age_range,
    distance_max_km,
    smoking_pref
)
```

### **Candidate Generation Pipeline**

1. **Hard filters** → limit to N=1000
2. **LSH** on trait vectors → coarse similarity buckets
3. **Compute final scores** for top K=200
4. **Rerank** with business rules (recency, premium)
5. **Diversify** with MMR (lambda=0.7)

```python
# MMR = Maximal Marginal Relevance
select_next = lambda * score - (1-lambda) * max_sim_with_selected
```

---

## 📈 **13. EVALUATION**

### **Offline Metrics**
```python
# Per-trait
Pearson_r
RMSE_on_z_scores
MAE
ICC_multi_image

# Calibration
reliability_diagrams()
isotonic_regression_error()
```

### **Online Metrics**
```python
# Engagement
reply_rate_48h
mutual_message_rate
meetup_conversion (self-report)

# Long-term
relationship_3mo_status
```

### **Couples Analysis**
```python
# Regression
outcome ~ similarity_score +
          covariates(age, distance, attractiveness_proxy)
```

### **A/B Testing**
```python
randomize_algorithms()
pre_register_metrics()
stopping_rules()
```

---

## ⚖️ **14. BIAS & FAIRNESS**

### **Audit Suite (Periodic)**
```python
# Slice-wise performance
compute_r_and_calibration_by(
    gender,
    race,
    locale
)

# Intersectional heatmap
intersectional_analysis()

# Disparate impact
match_offer_rate_by_group()
```

### **Mitigations**
```python
# 1. Reweigh training samples
reweight_training()

# 2. Adversarial debiasing
adversarial_debiasing_on_embeddings()

# 3. Post-hoc per-group calibration
per_group_isotonic_calibration()

# 4. Human review
human_review_for_failures()
```

**⚠️ Caution:**
- Facial-personality pipelines have **documented intersectional disparities**
- Do **not infer protected attributes** for targeting
- Apply fairness-aware constraints

---

## 🔒 **15. PRIVACY & SECURITY**

```python
# Storage
store_PII_encrypted(AES-256)
media_retention_default = 30_days (unless opt-in)

# Transport
TLS1.3_in_transit
HSM_for_key_management

# Optional: Differential Privacy
DP_SGD(noise=1.0, clip=1.0)
# for sensitive model training

# User Controls
provide_endpoints:
    - export (GDPR)
    - delete
    - opt_out_of_model_use
```

---

## 🚀 **16. MLOPS & DEPLOYMENT**

### **Infrastructure Stack**
```yaml
ML Frameworks:
  - PyTorch (deep learning)
  - HuggingFace Transformers (NLP)
  - LightGBM (gradient boosting)
  - OpenCV/dlib/mediapipe (vision)

Pipelines:
  - Airflow/Prefect (orchestration)
  - Feast (feature store)

Model Registry:
  - MLflow

Containers:
  - Docker/K8s

Monitoring:
  - Prometheus + Grafana
  - EvidentlyAI (drift detection)
```

### **CI/CD Pipeline**
```python
steps = [
    unit_tests_preprocessing,
    integration_tests_models,
    fairness_test_gate,
    performance_benchmark,
    staging_deployment,
    canary_rollout
]
```

### **Canary Rollout**
```python
Phase 1: 1% -> monitor 7 days
Phase 2: 10% -> monitor 7 days
Phase 3: 100%

# Rollback if metrics unhealthy
```

### **Monitoring & Drift**
```python
monitor:
    feature_drift (KL_threshold)
    label_drift
    calibration_drift

retrain_when:
    drift > threshold
```

### **Retraining Cadence**
```python
full_retrain: quarterly
incremental_finetune: monthly
trigger: new_labels > threshold
```

---

## 🛡️ **17. GUARDRAILS (OPERATIONAL)**

```python
# Logging
log_all_predictions_and_uncertainties()

# Auditing
enable_human_audit_paths()

# Transparency
enforce_transparency_in_terms()
allow_DSAR_workflow()

# Conservative defaults
default_to_conservative_weights_for_low_signal_modalities(face)
rely_more_on_high_signal_sources(sensors, text)
```

---

## 📚 **CITATIONS & NUMERIC ANCHORS**

### **Facial Images**
- **Meta-analytic kernel:** r ≈ **0.14**
- **Specific studies:** r up to **~0.28** for Neuroticism
- **ICC across photos:** **~0.80-0.88** (high reliability)
- **⚠️ Caution:** Documented intersectional bias, privacy concerns, limited accuracy

### **Smartphone Sensing**
- **Median correlation:** r ≈ **0.37** (domain), **0.40** (facets)
- **Study:** 30-day monitoring, n=624
- **✅ Strongest modality** for behavior-based personality prediction

### **Implementation Priority**
1. **Start with:** Questionnaire + Smartphone sensors + LightGBM
2. **Add:** Text/social media (if available)
3. **Treat with caution:** Face-based predictions (low signal, high bias risk)
4. **Default:** Conservative fusion weights favoring high-signal modalities

---

## ✅ **QUICK START CHECKLIST**

- [ ] Set up consent wizard with granular opt-ins
- [ ] Implement IPIP-50/120 questionnaire with attention checks
- [ ] Build preprocessing pipelines for each modality
- [ ] Train per-modality models with nested CV
- [ ] Implement uncertainty estimation (ensembles or MC dropout)
- [ ] Build inverse-variance fusion
- [ ] Calibrate to priors based on modality validity
- [ ] Implement matching algorithm with hard filters + MMR
- [ ] Set up fairness audit suite
- [ ] Deploy with canary rollout
- [ ] Monitor drift and retrain quarterly

---

**🔗 For detailed algorithmic pseudocode, see:** `detailed_algorithm_specification.py`

**📖 For research foundations and citations, see:** `README.md`
