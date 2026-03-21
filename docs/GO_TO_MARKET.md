# CulturePass — Go-To-Market & Infrastructure Scaling Plan

> Date: March 2026 | Version: 1.0
> Audience: Founder, co-founders, investors, technical leads

---

## 1. What Is CulturePass?

CulturePass is a **B2B2C cultural lifestyle marketplace** for diaspora communities in AU, NZ, UAE, UK, and CA.

It solves a real gap: diaspora communities are vibrant and active, but their events, businesses, and gathering spaces are scattered across social media, WhatsApp groups, and niche websites. CulturePass unifies them in one beautifully designed, cross-platform experience.

**Three audiences, one platform:**

| Who | What They Get |
|-----|---------------|
| Community Members | Discover events, buy tickets, join communities, earn perks |
| Event Organisers & Artists | Publish events, sell tickets, reach a targeted cultural audience |
| Cultural Businesses & Venues | Directory listing, community reviews, foot traffic |

**Revenue streams:**
- CulturePass+ subscriptions ($9.99/month or $89.99/year AUD)
- Ticket booking fees (% per transaction via Stripe)
- Promoted event listings (organiser tier upgrades)
- Business directory premium listings

---

## 2. Current Status — What Is Built (March 2026)

### App Completion: ~85%

The core product is functionally complete across all three platforms (iOS, Android, Web).

#### What Is Done

| Feature | Status |
|---------|--------|
| Onboarding (login, signup, location, interests, communities) | Done |
| Discover tab — event rails, hero carousel, spotlight, indigenous section | Done |
| Events page — filter bar (category, date, price) | Done |
| Explore — 2-column category grid | Done |
| Event detail + ticket purchase (Stripe) | Done |
| Event creation wizard — 9 steps (basics, image, location, datetime, entry type, tickets, team, culture, review) | Done |
| Calendar — month grid, event dots, civic reminders | Done |
| Communities tab | Done |
| Perks + redemption | Done |
| Business / Venue / Organisation directory | Done |
| Profile + membership tiers (Free → VIP) | Done |
| QR ticket scanner | Done |
| Push notifications (FCM) | Done |
| Admin dashboard (users, audit logs, notifications) | Done |
| Organiser dashboard | Done |
| Web desktop layout — sidebar, responsive grid | Done |
| Firebase Auth (email + Google + Apple Sign-In) | Done |
| Stripe subscription checkout + webhook | Done |
| Council/LGA as location-proximity service | Done |
| Design token system — brand, component, gradient tokens | Done |
| Dark/light mode (dark default on native, light on web) | Done |
| Sentry error monitoring (wired, not fully configured) | Partial |
| Geolocation geoHash queries (stored, not queried) | Partial |
| Algolia full-text search | Planned |
| Firebase DataConnect / GraphQL | Exploratory |

#### Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile + Web App | Expo 55 + React Native 0.83 + Expo Router 5 + Reanimated 4 |
| State Management | TanStack React Query + Context API |
| Backend API | Firebase Cloud Functions (Express, 150+ routes, 6500+ lines) |
| Database | Firestore (NoSQL) |
| Auth | Firebase Authentication |
| Storage | Firebase Storage |
| Payments | Stripe (subscriptions + one-off tickets) |
| Web Hosting | Firebase Hosting |
| Notifications | Firebase Cloud Messaging (FCM) |
| Analytics | PostHog + Firebase Analytics |
| Error Monitoring | Sentry |
| CI/CD | EAS Build (Expo) |

---

## 3. What Needs To Happen Before Public Launch

### Priority 1 — Must-Have Before Going Live

These are launch blockers. Nothing ships without these.

| Item | Owner | Effort |
|------|-------|--------|
| Set all EAS secrets (Firebase config, Stripe keys, Google Maps, Sentry DSN) | Founder / DevOps | 1 day |
| Create demo account for App Review (demo@culturepass.com.au) | Founder | 1 hour |
| Host Privacy Policy at `culturepass.com.au/privacy` | Founder | 1 day |
| Host Terms of Service at `culturepass.com.au/terms` | Founder | 1 day |
| Complete `npm run typecheck` — zero errors | Dev | 1–2 days |
| Complete `npm run lint` — zero errors | Dev | 1 day |
| Complete `npx expo export --platform web` — clean build | Dev | 1 day |
| Bump `app.json` version to 1.0.0 + iOS buildNumber + Android versionCode | Dev | 30 min |
| Configure Stripe production keys in Cloud Functions environment | Dev | 2 hours |
| Switch Stripe from test mode to live mode | Founder | 1 day |
| Configure Firebase production project (separate from dev) | Dev | 1 day |
| Fully configure Sentry DSN for error reporting | Dev | 2 hours |
| App Store Connect setup (name, screenshots, age rating, capabilities) | Founder | 1–2 days |
| Google Play Console setup (listing, data safety form, content rating) | Founder | 1–2 days |
| App screenshots at correct resolutions (iOS 1320×2868, Android 1080×2400) | Design/Founder | 1–2 days |
| TestFlight internal testing pass | QA/Founder | 2–3 days |
| Firebase production security rules audit | Dev | 1 day |

**Estimated time to App Store ready: 2–3 weeks with focused effort.**

### Priority 2 — Launch Quality (Week 1–4 Post-Launch)

| Item | Notes |
|------|-------|
| Geolocation geoHash queries | Users get nearby events by GPS, not just city |
| Algolia full-text search | Full-text across events, businesses, communities |
| Council LGA auto-select from GPS on onboarding | Friction-free first run |
| Playwright E2E smoke tests | Catch checkout + event creation regressions |
| Sentry performance traces | Monitor API latency, screen render times |
| CI pipeline (lint + typecheck + export on every PR) | Prevent regression at merge time |

### Priority 3 — Growth Features (Month 1–3 Post-Launch)

| Item | Notes |
|------|-------|
| Organiser analytics dashboard | Event attendance, revenue charts |
| In-app community messaging / direct chat | Drive retention |
| First Nations Spotlight editorial program | Curated cultural content |
| Multi-city event listings (NZ, UAE, UK, CA) | Market expansion |
| Affiliate/referral program | Growth loop for community leaders |
| Social sharing cards (Open Graph) | Viral event sharing |

---

## 4. Go-To-Market Strategy

### Phase 1 — Seed Communities (Months 1–2)

- **Target**: 5–10 established diaspora community organisations in Sydney and Melbourne
- **Approach**: White-glove onboarding for their first events and communities
- **Goal**: 50 published events, 500 registered users, proof of engagement
- **Channels**: WhatsApp community leaders, cultural associations, multicultural councils

### Phase 2 — Launch Campaign (Month 3)

- **App Store launch** — iOS + Android simultaneously
- **PR push** — multicultural media (SBS, Mosaik, cultural community newspapers)
- **Influencer seeding** — diaspora content creators on TikTok and Instagram
- **Event listings drive** — partner with 3–5 cultural festivals for exclusive ticketing
- **Goal**: 5,000 registered users, 10 organiser accounts, 200 events published

### Phase 3 — Monetisation (Month 4–6)

- Activate CulturePass+ subscriptions — email campaigns to active users
- Launch promoted event listings for organisers
- Onboard first 20 business directory premium listings
- Introduce ticket booking fees (2–3% per transaction)
- **Goal**: $5K–$10K MRR, 1,000 CulturePass+ subscribers

### Phase 4 — Regional Expansion (Month 6–12)

- Launch NZ (Auckland, Wellington)
- Launch UAE (Dubai) — large South Asian and Arab diaspora
- Launch UK (London)
- Partner with multicultural councils and civic organisations in each market
- **Goal**: 50K registered users across 5 markets

---

## 5. Infrastructure — Current State and Scale Limits

### Firebase (Current)

Firebase works well for early-stage applications. The current architecture runs:
- **Firestore**: NoSQL document store for all app data
- **Cloud Functions**: Express API (all business logic)
- **Firebase Auth**: Identity management
- **Firebase Storage**: Media uploads
- **Firebase Hosting**: Web deployment

**Strengths of current Firebase setup:**
- Zero-ops — no servers to manage
- Real-time capabilities built in
- Fast development iteration
- Scales automatically to moderate traffic

**Limitations that will bite at scale (>50K users, >10K concurrent):**

| Issue | Impact |
|-------|--------|
| Firestore cold starts on Cloud Functions | 500ms–2s latency spikes under low traffic |
| Firestore query limitations (no full-text, no complex joins) | Forces workarounds; Algolia needed for search |
| Cloud Functions cost model | Gets expensive fast at high invocation volume |
| Firestore pricing at scale | Read/write costs compound with large datasets |
| Vendor lock-in | Firebase-specific APIs make migration harder over time |
| Limited analytics / BI capability | Hard to run business queries on Firestore data |
| No native job queue | Background jobs need third-party solutions |
| Single-region default | Latency for UAE/UK/CA users unless multi-region configured |

---

## 6. Infrastructure Migration Options

### Option A — Supabase (Recommended for Year 1–2)

**What it is**: Open-source Firebase alternative. PostgreSQL + Auth + Storage + Realtime + Edge Functions.

**Why consider it:**
- PostgreSQL — full relational queries, joins, full-text search (no Algolia needed for basic search)
- Supabase Auth is a drop-in for Firebase Auth patterns
- Row-level security (RLS) replaces Firestore rules — more powerful and portable
- Self-hostable — can move to your own infrastructure later
- Much lower cost at scale than Firebase for read-heavy workloads
- Built-in vector embeddings (pgvector) — future AI/recommendation features
- Dashboard with SQL editor — easy business intelligence queries

**Migration complexity**: Medium
- Firebase Auth → Supabase Auth (token strategy changes, user migration needed)
- Firestore → PostgreSQL (schema design work, data migration scripts)
- Cloud Functions → Supabase Edge Functions + Node.js API server
- Firebase Storage → Supabase Storage (S3-compatible)
- Firebase Hosting → Vercel or Supabase hosting

**Estimated migration timeline**: 8–12 weeks with 2 engineers

**Cost estimate (10K MAU)**:
- Firebase: ~$200–$500/month (Firestore reads + Functions + Storage)
- Supabase Pro: $25/month base + compute — 80%+ cheaper at same scale

---

### Option B — AWS (Recommended for Year 2–3, Enterprise Scale)

**What it is**: Full cloud infrastructure. Most enterprises run on AWS.

**Architecture for CulturePass on AWS:**

| Firebase Service | AWS Equivalent |
|-----------------|----------------|
| Firestore | Amazon DynamoDB (NoSQL) or Amazon RDS Aurora PostgreSQL |
| Cloud Functions | AWS Lambda + API Gateway or ECS Fargate (containerised) |
| Firebase Auth | Amazon Cognito |
| Firebase Storage | Amazon S3 + CloudFront CDN |
| Firebase Hosting | AWS Amplify Hosting or S3 + CloudFront |
| FCM (Push) | Amazon SNS + APNS/FCM bridge |
| Firestore Realtime | AWS AppSync (GraphQL subscriptions) or API Gateway WebSockets |

**Why AWS for scale:**
- Multi-region active-active (critical for AU + UAE + UK + CA markets)
- CloudFront CDN for image delivery (faster load times globally)
- Aurora Serverless v2 — scales from zero, pay per query
- SQS / SES / SNS — native job queues and notification infrastructure
- RDS PostgreSQL — full-text search, complex queries, joins
- AWS WAF + Shield — production-grade DDoS protection
- Enterprise compliance (SOC 2, ISO 27001, GDPR, Australian Privacy Act)

**Migration complexity**: High
- Complete re-architecture of auth, storage, and backend
- Requires DevOps expertise (IAM, VPC, security groups)
- Significant infrastructure-as-code work (Terraform / CDK)

**Estimated migration timeline**: 3–6 months with 3 engineers + DevOps

**Cost estimate (50K MAU, multi-region):**
- Firebase: $2,000–$8,000/month
- AWS: $800–$2,500/month (60–70% cheaper at scale with right architecture)

---

### Option C — Oracle Cloud Infrastructure (OCI)

**What it is**: Oracle's enterprise cloud. Strong on database performance and generous free tier.

**Why consider OCI:**
- Oracle Autonomous Database — self-tuning, self-patching, no DBA needed
- OCI Free Tier is the most generous in cloud (4 OCPUs ARM instances, 24GB RAM, 200GB storage — always free)
- Strong compliance posture for government/enterprise clients (if CulturePass targets councils)
- Object Storage (S3-compatible) + CDN included
- OCI Functions (serverless) compatible with existing Express patterns

**Why OCI is less ideal for CulturePass:**
- Smaller developer ecosystem than AWS/GCP
- Less tooling for mobile/app-specific services (no native FCM equivalent)
- Fewer community resources and integrations
- Not the default choice for startups

**Best use case for OCI:** If CulturePass wins government or large council contracts that require Oracle ecosystem compatibility.

---

### Option D — Hybrid Architecture (Best of All Worlds)

**Recommended for CulturePass Year 2:**

Keep Firebase for what it does well, migrate the rest:

| Layer | Platform | Why |
|-------|----------|-----|
| Auth | Firebase Auth | Keep — no migration needed, works across native |
| Push Notifications | Firebase FCM | Keep — best-in-class for mobile push |
| Primary Database | Supabase PostgreSQL | Full-text search, joins, BI queries |
| File Storage | AWS S3 + CloudFront | CDN delivery, cheaper at scale |
| API Server | AWS Lambda / ECS | Containerised, scales independently |
| Search | Algolia | Purpose-built for cultural marketplace faceted search |
| Web Hosting | Vercel | Better DX, edge CDN, zero-config Next.js if web is split |
| Background Jobs | AWS SQS + Lambda | Ticket emails, notification batch sends |
| Analytics | PostHog (self-hosted on AWS) | Full event tracking with no data residency concerns |

---

## 7. Recommended Migration Roadmap

### Year 1 (Launch → 10K users): Stay on Firebase, add Algolia

**Cost**: ~$300–$600/month all-in
**Action**: Don't migrate yet. Ship the product. Validate the market.

Improvements within Firebase that defer migration:
- Add Firestore composite indexes for `[city, date, status]` queries
- Implement geohash proximity queries
- Add Algolia for search (index events + businesses + communities)
- Enable Firebase multi-region for global data residency
- Set up CloudFront or Fastly in front of Firebase Storage for image CDN

### Year 1.5 (10K–50K users): Migrate to Supabase

**Cost**: ~$100–$400/month
**Migration**: Firestore → PostgreSQL, keep Firebase Auth + FCM

Key steps:
1. Design PostgreSQL schema from Firestore data model
2. Write migration scripts (Firestore export → PostgreSQL import)
3. Rewrite `functions/src/services/firestore.ts` → Supabase client
4. Swap API endpoints gradually (feature-flag rollout)
5. Keep Firebase Auth — Supabase supports JWTs from external auth providers
6. Run parallel writes (Firebase + Supabase) for 4-week validation period
7. Cut over — Firebase read deprecated, Supabase becomes primary

### Year 2+ (50K–500K users): AWS for scale

**Cost**: $1,500–$5,000/month
**Architecture**: Microservices on ECS Fargate, Aurora PostgreSQL, S3 + CloudFront, SQS

Key steps:
1. Containerise the Express API (`functions/src/app.ts` → Docker)
2. Stand up Aurora PostgreSQL Serverless v2 (migrate from Supabase)
3. Configure VPC, private subnets, NAT gateway
4. Set up CI/CD with GitHub Actions → AWS CodeDeploy
5. Multi-region: `ap-southeast-2` (AU/NZ), `me-south-1` (UAE), `eu-west-2` (UK), `ca-central-1` (CA)
6. CloudFront CDN for all media assets
7. AWS WAF for DDoS protection

---

## 8. Cost Comparison Summary

| Stage | Users | Firebase | Supabase | AWS |
|-------|-------|----------|----------|-----|
| Launch | 0–5K | $0–$50/mo | $25/mo | ~$200/mo |
| Early growth | 5K–20K | $150–$400/mo | $50–$150/mo | $300–$800/mo |
| Scale | 20K–100K | $600–$2,500/mo | $150–$600/mo | $600–$2,000/mo |
| Enterprise | 100K–500K | $2,500–$15K/mo | $500–$2K/mo | $1,500–$8K/mo |

**Bottom line**: Firebase is fine to launch. At 20K MAU it starts becoming expensive relative to alternatives. Supabase gives an 80% cost reduction with better SQL capabilities. AWS is the right call at 100K+ MAU when you need multi-region, compliance, and enterprise SLAs.

---

## 9. Legal & Compliance Checklist

Before going live in Australia, you need:

| Item | Status |
|------|--------|
| Privacy Policy (Australian Privacy Act 1988 compliant) | Needed |
| Terms of Service | Needed |
| Community Guidelines | Needed |
| Cookie / Tracking policy (for web) | Needed |
| Stripe merchant account (AU) — verified bank account | Needed |
| ACN or ABN registered for the business entity | Needed |
| Firebase / Google Data Processing Agreement signed | Check in Firebase Console |
| Data residency — Firestore region set to `australia-southeast1` | Check Firebase project |
| WCAG 2.1 AA accessibility audit | Recommended |
| Acknowledgement of Country on location screens | Done in app |

---

## 10. Launch Checklist (Summary)

### Week 1–2
- [ ] Set all EAS secrets
- [ ] Firebase production project configured
- [ ] Stripe live mode enabled
- [ ] Privacy Policy + ToS live on website
- [ ] `typecheck` + `lint` pass with zero errors
- [ ] App Store Connect account setup complete

### Week 3
- [ ] TestFlight internal build distributed
- [ ] Screenshot capture at correct resolutions
- [ ] Demo account created for App Review
- [ ] Android Play Console listing complete

### Week 4
- [ ] Production iOS build submitted for App Review
- [ ] Android build submitted
- [ ] Web deployed to Firebase Hosting (production URL)
- [ ] Monitoring alerts configured (Sentry + Firebase Crashlytics)

### Post-Launch (Month 1)
- [ ] Onboard 5–10 seed community organisers
- [ ] Geolocation geoHash proximity queries deployed
- [ ] Algolia search integration
- [ ] CI pipeline (lint + typecheck + export gates)
- [ ] Analytics dashboards live (PostHog + Firebase Analytics)

---

## 11. Investor-Ready Metrics to Track From Day 1

| Metric | Why It Matters |
|--------|---------------|
| DAU / MAU ratio | Measures habit formation — target >20% |
| Tickets purchased per MAU | Core transaction volume |
| Organiser-to-user ratio | Supply health of marketplace |
| CulturePass+ conversion rate | Subscription monetisation |
| D1 / D7 / D30 retention | Product-market fit signal |
| Gross Merchandise Value (GMV) | Total $ processed (tickets + subscriptions) |
| Take rate | % of GMV CulturePass earns |
| LTV / CAC ratio | Unit economics — target >3:1 |

---

## 12. Key Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Firebase cost spike at scale | Medium | Plan Supabase migration at 10K MAU |
| App Store rejection | Low | Follow all Apple guidelines; demo account ready |
| Low organiser supply at launch | High | White-glove onboard 10 organisers before launch |
| Community backlash on First Nations content | Low | Consult with Indigenous Advisory before editorial program |
| Stripe chargeback fraud on ticket sales | Medium | Enable Stripe Radar, require user identity verification |
| Data breach / privacy incident | Low | Firestore rules audit, HTTPS only, token-based auth |
| Competitor reaction (Eventbrite, Humanitix) | Medium | CulturePass is niche (diaspora-specific) — not a direct competitor to horizontal ticketing platforms |

---

*Last updated: March 2026*
*Prepared by: CulturePass Engineering & Product*
