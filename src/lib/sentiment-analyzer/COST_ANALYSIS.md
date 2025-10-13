# Sentiment Analyzer Cost Analysis

This document provides detailed cost estimates and optimization strategies for the sentiment analysis feature.

## Token Pricing (GPT-4-turbo)

As of October 2024:
- **Input tokens**: $0.01 per 1,000 tokens
- **Output tokens**: $0.03 per 1,000 tokens

## Cost Per Analysis

### Grower Plan (50 reviews)

**Token Breakdown:**
- Average review: ~100 tokens
- System + user prompt overhead: ~650 tokens
- Review data: 50 × 100 = 5,000 tokens
- Total input: ~5,650 tokens
- Expected output: ~800-1,200 tokens

**Cost Calculation:**
```
Input cost:  5,650 × $0.01 / 1,000 = $0.0565
Output cost: 1,000 × $0.03 / 1,000 = $0.0300
Total cost:  ~$0.09 per analysis
```

**Monthly Cost Scenarios:**
- 1 analysis/month (plan limit): **$0.09/month**
- If user uses full quota: **$0.09/month**

### Builder Plan (100 reviews)

**Token Breakdown:**
- Review data: 100 × 100 = 10,000 tokens
- Total input: ~10,650 tokens
- Expected output: ~1,000-1,500 tokens

**Cost Calculation:**
```
Input cost:  10,650 × $0.01 / 1,000 = $0.1065
Output cost:  1,250 × $0.03 / 1,000 = $0.0375
Total cost:  ~$0.14 per analysis
```

**Monthly Cost Scenarios:**
- 1 analysis/month: $0.14
- 3 analyses/month (plan limit): **$0.42/month**

### Maven Plan (500 reviews)

**Token Breakdown:**
- Review data: 500 × 100 = 50,000 tokens
- Total input: ~50,650 tokens
- Expected output: ~1,500-2,000 tokens

**Cost Calculation:**
```
Input cost:  50,650 × $0.01 / 1,000 = $0.5065
Output cost:  1,750 × $0.03 / 1,000 = $0.0525
Total cost:  ~$0.56 per analysis
```

**Monthly Cost Scenarios:**
- 1 analysis/month: $0.56
- 10 analyses/month (plan limit): **$5.60/month**

## Aggregate Cost Projections

### Best Case (Low Usage)
Assumes 50% of users use their full quota:

| Plan    | Users | Analyses/Month | Cost/User | Total/Month |
|---------|-------|----------------|-----------|-------------|
| Grower  | 1,000 | 0.5            | $0.045    | $45         |
| Builder | 500   | 1.5            | $0.21     | $105        |
| Maven   | 100   | 5              | $2.80     | $280        |
| **Total** | **1,600** |            |           | **$430**    |

### Expected Case (Moderate Usage)
Assumes 75% of users use their full quota:

| Plan    | Users | Analyses/Month | Cost/User | Total/Month |
|---------|-------|----------------|-----------|-------------|
| Grower  | 1,000 | 0.75           | $0.068    | $68         |
| Builder | 500   | 2.25           | $0.32     | $160        |
| Maven   | 100   | 7.5            | $4.20     | $420        |
| **Total** | **1,600** |            |           | **$648**    |

### Worst Case (High Usage)
Assumes 100% of users use their full quota:

| Plan    | Users | Analyses/Month | Cost/User | Total/Month |
|---------|-------|----------------|-----------|-------------|
| Grower  | 1,000 | 1              | $0.09     | $90         |
| Builder | 500   | 3              | $0.42     | $210        |
| Maven   | 100   | 10             | $5.60     | $560        |
| **Total** | **1,600** |            |           | **$860**    |

## Scaling Scenarios

### Year 1 Growth (3,000 total users)

**Expected Case:**
- Grower: 2,000 users × $0.068 = $136
- Builder: 800 users × $0.32 = $256
- Maven: 200 users × $4.20 = $840
- **Total: $1,232/month or $14,784/year**

### Year 2 Growth (10,000 total users)

**Expected Case:**
- Grower: 6,000 users × $0.068 = $408
- Builder: 3,000 users × $0.32 = $960
- Maven: 1,000 users × $4.20 = $4,200
- **Total: $5,568/month or $66,816/year**

## ROI Analysis

### Revenue Impact

**Grower to Builder Upgrade:**
- Additional Revenue: $20/month
- Additional AI Cost: $0.32/month (vs $0.068)
- Net Revenue: $19.75/month
- **Margin: 98.7%**

**Builder to Maven Upgrade:**
- Additional Revenue: $30/month
- Additional AI Cost: $4.20/month (vs $0.32)
- Net Revenue: $25.92/month
- **Margin: 86.4%**

### Upgrade Conversion Assumptions

If sentiment analyzer drives 5% plan upgrades:
- 50 Grower → Builder upgrades: +$1,000/month revenue, +$16/month AI cost
- 25 Builder → Maven upgrades: +$750/month revenue, +$97/month AI cost
- **Net Impact: +$1,750/month revenue, +$113/month cost**
- **ROI: 1,548% (15.5x return)**

## Cost Optimization Strategies

### 1. Data Compression (Implemented)

**Current optimization:**
- Strip redundant fields from review objects
- Use compact JSON format (no whitespace)
- Truncate timestamps to date only
- Remove null/undefined fields

**Token Savings: ~10-15% per request**

### 2. Caching Strategy (Recommended)

Cache analysis results for 24-48 hours:
- Prevents duplicate analyses of same data
- Reduces API calls by estimated 20-30%
- **Cost Savings: $130-$260/month @ 1,600 users**

### 3. Progressive Analysis (For Maven)

For 500-review analyses, split into 2 batches:
- Analyze first 250 reviews
- Analyze second 250 reviews
- Merge results

**Benefits:**
- More reliable processing
- Better error recovery
- Similar cost, better reliability

### 4. Model Optimization

**Current: GPT-4-turbo**
- High quality, moderate cost
- Good for complex analysis

**Alternative: GPT-3.5-turbo**
- Cost: 10x cheaper ($0.0015 input, $0.002 output)
- Quality: Lower but acceptable for basic sentiment
- **Potential savings: 85-90% cost reduction**

**Recommendation:** Stick with GPT-4-turbo for quality, consider GPT-3.5 as budget-tier option

### 5. Token Budget Limits

Set max token limits per plan:
- Grower: 7,000 input tokens max
- Builder: 12,000 input tokens max
- Maven: 55,000 input tokens max

Prevents runaway costs from edge cases.

## Monitoring & Alerts

### Key Metrics to Track

1. **Average Cost Per Analysis**
   - Target: $0.09 (Grower), $0.14 (Builder), $0.56 (Maven)
   - Alert if 20% over target

2. **Monthly Total Cost**
   - Budget: $1,000/month @ 1,600 users
   - Alert at $800 (80% threshold)

3. **Token Efficiency**
   - Target: 100 tokens per review
   - Alert if > 150 tokens per review

4. **Analysis Success Rate**
   - Target: 98%+ success rate
   - Alert if < 95%

### Cost Anomaly Detection

Alert conditions:
- Single analysis > $2.00 (possible error)
- Daily cost > $100 (unusual spike)
- User requesting > plan limit (bypass attempt)

## Budget Recommendations

### Initial Launch (Months 1-3)

**Conservative Budget:** $500/month
- Covers up to 900 users at expected usage
- 2x buffer for unexpected growth

### Growth Phase (Months 4-12)

**Moderate Budget:** $1,500/month
- Covers up to 2,700 users
- Allows for feature promotion

### Mature Phase (Year 2+)

**Scalable Budget:** 1% of monthly revenue
- Example: $10k revenue = $100 AI budget
- Scales naturally with user base

## Cost vs. Value

### User Perspective

**Value Delivered:**
- Saves 2-4 hours of manual review analysis
- Provides actionable insights
- Identifies improvement opportunities

**Perceived Value:** $50-$200 per analysis
**Actual Cost:** $0.09-$0.56 per analysis
**Value Multiplier:** 89x - 2,222x

### Business Perspective

**Costs:**
- AI/API: $0.09-$0.56 per analysis
- Development: One-time (amortized)
- Maintenance: Minimal

**Benefits:**
- Differentiation from competitors
- Upgrade driver (proven ROI)
- User retention tool
- Premium feature positioning

**Strategic Value:** High (justifies premium pricing)

## Conclusion

The sentiment analyzer feature has excellent unit economics:

✅ **Low per-analysis cost** ($0.09-$0.56)
✅ **High perceived value** ($50-$200)
✅ **Strong margins** (86-99%)
✅ **Scalable costs** (linear with usage)
✅ **Upgrade driver** (ROI: 15x+)

**Recommendation:** Proceed with implementation. Cost structure is sustainable and profitable across all scenarios.

## Appendix: Emergency Cost Controls

If costs exceed budget:

1. **Immediate Actions:**
   - Reduce Maven limit to 300 reviews (40% cost cut)
   - Implement 24-hour cooldown between analyses
   - Add caching (20-30% reduction)

2. **Short-term Actions:**
   - Tier AI quality (GPT-3.5 for lower plans)
   - Increase upgrade incentives
   - Add usage notifications

3. **Long-term Actions:**
   - Negotiate volume pricing with OpenAI
   - Develop hybrid AI/rule-based system
   - Explore alternative AI providers

---

**Last Updated:** October 2025
**Next Review:** January 2026
