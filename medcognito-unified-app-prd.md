# MedCognito Unified Learning Platform — Product Requirements Document (PRD)

**Version:** 1.1  
**Date:** April 22, 2026  
**Status:** Draft for implementation planning  
**Owner:** MedCognito Product + Engineering  
**Related docs:** `medcognito-design-system.md`, `medcognito-style-guide.md`, `home-page-lofi-designs.md`

---

## 1. Executive Summary

MedCognito currently delivers core learning experiences across three separate products:
1. Question Bank
2. AI Flashcards (MedBuddy)
3. Mocks

This PRD defines a unified student platform that combines these into one coherent application with shared navigation, identity, progress tracking, and adaptive recommendations. The goal is to improve learner outcomes, retention, and operational efficiency while preserving current production workflows during migration.

**Top Priority Principle:** analytics must be designed in from day zero. GA4 and Microsoft Clarity instrumentation are mandatory architecture components, not post-launch add-ons.

---

## 2. Problem Statement

Students currently switch across disconnected tools and interfaces. This causes:
- Fragmented user journeys
- Repeated cognitive re-orientation
- Siloed progress data
- Reduced ability to give personalized recommendations
- Increased support and maintenance burden

A unified product is needed to deliver one learning system end-to-end.

---

## 3. Goals and Non-Goals

### 3.1 Goals
- Unify Question Bank, Flashcards, and Mocks in one application shell.
- Provide a single student login/session and profile context.
- Build a shared progress model for cross-tool analytics.
- Implement GA4 + Microsoft Clarity tracking architecture from the start (MVP blocking requirement).
- Enable adaptive workflows (e.g., weak topics → targeted questions/flashcards/mocks).
- Introduce AI-powered performance analysis and readiness scoring for MCCQE-aligned preparation.
- Preserve MedCognito brand and accessibility standards.
- Migrate incrementally with low production risk.

### 3.2 Non-Goals (v1)
- Rebuilding all AI generation logic from scratch.
- Replacing all legacy endpoints on day one.
- Building instructor/admin enterprise suite in same release.
- Introducing native mobile apps before web parity.

---

## 4. Users and Personas

### Primary Persona
- Internationally trained healthcare professionals preparing for Canadian licensure exams.
- High-stakes, time-constrained, stress-sensitive learners.

### Secondary Personas
- Course operations/admin staff maintaining content.
- Tutors/coaches reviewing learner progress.

---

## 5. Product Principles

1. **One platform, many study modes:** no fragmented app feel.
2. **Action over complexity:** always show next best learning action.
3. **Reliable under pressure:** stable states, clear error handling, predictable flows.
4. **Accessible by default:** keyboard, contrast, focus, and touch-target safety.
5. **Canadian exam relevance:** keep MCCQE/NAC alignment in content UX.

---

## 6. Scope

### 6.1 In Scope (v1)
- Unified app shell and navigation.
- Home dashboard with adaptive recommendations.
- Question Bank module integration.
- Flashcards module integration.
- Mocks module integration.
- GA4 and Microsoft Clarity event tracking baseline across all core student journeys.
- Shared auth/session + profile.
- Shared analytics/progress layer.
- AI-generated readiness insights and personalized study actions.
- Design-system aligned frontend foundation.

### 6.2 Out of Scope (v1)
- Multi-tenant institution management.
- Advanced instructor authoring UI.
- Offline-first mobile app.

---

## 7. Information Architecture

Primary routes:
- `/home`
- `/question-bank`
- `/flashcards`
- `/mocks`
- `/progress`
- `/study-plan`
- `/profile`
- `/settings`
- `/help`

Navigation behavior:
- Desktop: sidebar + top utility bar
- Mobile: bottom tab navigation + collapsible menu

---

## 8. Functional Requirements

### 8.0 Analytics-First Instrumentation (P0)
- GA4 and Microsoft Clarity must be integrated before broad student rollout.
- Define and implement a shared `trackEvent()` client abstraction used by all modules.
- Ensure consistent event naming/versioning and payload schemas across QBank, Flashcards, Mocks, and Dashboard.
- Instrument the critical journey events:
  - app_opened
  - module_opened
  - question_answered
  - mock_started / mock_submitted
  - flashcards_generated / flashcard_flipped
  - recommendation_viewed / recommendation_clicked / recommendation_completed
  - readiness_viewed
- Track attribution context on events:
  - user_id (or pseudonymous ID where required)
  - module
  - topic/domain
  - source (manual action vs recommendation)
  - timestamp + session_id
- Require event QA in release criteria (no “done” state without analytics verification).

### 8.1 Unified Home Dashboard
- Show welcome hero and core CTAs:
  - Continue Learning
  - Start Mock
  - Generate Flashcards
- Show quick stats:
  - Streak
  - Question accuracy
  - Mocks completed
  - Flashcards reviewed
- Show “Next Best Actions” based on weak areas and recency.
- Show exam blueprint progress by domain.
- Show recent activity stream.

### 8.2 Question Bank Module
- Topic filtering and search.
- Question attempt flow with 5-option MCQ support.
- Correct answer reveal + explanation.
- Bookmark/flag question.
- Session progress indicator.
- End-of-session summary and remediation CTA.

### 8.3 Flashcards Module (MedBuddy)
- Input mode: topic describe or note paste.
- Generation loading states (step timeline + skeleton cards).
- Study mode with flip interactions.
- Card navigation + counter/progress.
- Completion state with follow-up CTA.

### 8.4 Mocks Module
- Mock selection (diagnostic/timed).
- Timed test-taking interface.
- Flag-for-review behavior.
- Submit and result review.
- Domain breakdown and weak-topic export.

### 8.5 Shared Progress and Recommendations
- Unified event model across all modules.
- Cross-tool recommendation engine:
  - Wrong answers in QBank/Mocks → targeted flashcards/question sets.
- Readiness score and topic mastery summary.

### 8.6 AI Performance Analysis and MCCQE Readiness
- Generate a learner-facing **MCCQE Readiness Score** (0–100) derived from:
  - QBank accuracy (weighted by recency and difficulty)
  - Mock performance (overall and domain-level)
  - Consistency/streak and completion behavior
  - Improvement trend over trailing windows (e.g., 7, 30 days)
- Display readiness by exam blueprint domains (Medicine, Surgery, Pediatrics, Psychiatry, OB/Gyn, Preventive Medicine, Ethics/Professionalism).
- Generate AI narrative insights:
  - “What is improving”
  - “What is at risk”
  - “What to do next in 1–3 actions”
- Provide confidence bands (e.g., low/medium/high confidence) based on data sufficiency.
- Recompute readiness automatically after major events (mock submission, significant question volume, flashcard review completion).
- Track recommendation acceptance and post-recommendation uplift.

### 8.7 AI Flashcards API Integration Requirements
- Flashcards remain powered by a server-side AI API integration (no API secret exposure client-side).
- Frontend sends topic/context payload to backend proxy endpoint; backend invokes model provider.
- Support both manual topic generation and adaptive generation from weak-topic signals.
- Persist generation metadata:
  - model name/version
  - generation timestamp
  - request mode (manual vs adaptive)
  - referenced weak-topic tags
- Enforce abuse controls:
  - per-user/IP rate limits
  - request size limits
  - meaningful user-facing error messages and retry options
- Maintain event instrumentation for:
  - generation success/failure
  - latency buckets
  - student follow-through (cards reviewed after generation)

### 8.8 Auth, Profile, and Settings
- Single login/session.
- Learner profile and exam pathway preference.
- Notification and reminder preferences.

---

## 9. Non-Functional Requirements

### 9.1 Performance
- Home page interactive load target: <2.5s on standard broadband.
- Module navigation should feel near-instant with loading skeletons.

### 9.2 Reliability
- Graceful module-level fallback states when APIs fail.
- Retries and clear user-facing recovery actions.
- AI readiness and recommendations must fail gracefully to baseline analytics UI when enrichment services are unavailable.

### 9.3 Security
- No API keys exposed client-side.
- Proper CORS allowlists for production domains.
- Rate limiting for generation and high-cost endpoints.
- Minimize sensitive data in prompt context; log redaction for AI request/response traces.

### 9.4 Accessibility
- WCAG AA contrast.
- Keyboard navigability.
- Focus-visible states.
- Min 44px touch targets.
- Reduced motion support.

### 9.5 Observability
- Structured logs per module.
- Error tracking with request IDs.
- Event telemetry for adoption and outcome metrics.
- AI-specific telemetry:
  - readiness recompute frequency
  - recommendation click-through/completion
  - flashcard generation success rate and p95 latency
- Product analytics telemetry:
  - GA4 event delivery health
  - Clarity session capture coverage
  - tracking completeness for critical funnels

---

## 10. UX / Design Requirements

- Must align with `medcognito-design-system.md` and `medcognito-style-guide.md`.
- Use tokenized color/typography/spacing only.
- Maintain brand voice: professional, encouraging, modern.
- Respect home page lo-fi direction in `home-page-lofi-designs.md`.

### 10.1 Home Page UX Baseline (v1)
- Use Guided Dashboard concept as primary baseline.
- Keep first viewport action-oriented (resume learning and start practice).
- Clearly surface weak topics and next steps.

---

## 11. Data Model (High-Level)

Core entities:
- User
- Enrollment
- Topic
- Question
- QuestionAttempt
- MockAttempt
- FlashcardSet
- FlashcardReviewEvent
- Recommendation
- ProgressSnapshot

Key identity requirement:
- Stable `user_id`, `question_id`, `mock_id`, `flashcard_set_id` for cross-tool linking.

---

## 12. API Requirements (High-Level)

### 12.1 BFF Endpoints
- `GET /api/home/summary`
- `GET /api/progress/overview`
- `GET /api/recommendations`
- `GET /api/readiness/score`
- `GET /api/readiness/explain`
- `POST /api/question-attempts`
- `POST /api/mock-attempts`
- `POST /api/flashcards/generate`
- `POST /api/recommendations/feedback`
- `POST /api/analytics/events` (optional server-side relay for compliance/control)

### 12.2 Contracts
- Consistent error shape across modules.
- User context required for all protected endpoints.
- Pagination for activity and history endpoints.
- Readiness endpoints return:
  - score
  - confidence level
  - domain breakdown
  - top 3 recommended actions

---

## 13. Migration and Rollout Strategy

### Phase 1 — Foundation (Week 1)
- Finalize architecture, data schemas, and BFF contract shapes.
- Scaffold unified app shell, routing, and auth/session layer.
- Keep all legacy tools accessible during build.

### Phase 2 — Core Integrations (Weeks 2–3)
- Build home dashboard with cross-tool stats and Next Best Actions.
- Integrate Question Bank into shared auth/progress model.
- Implement GA4 + Clarity baseline event coverage (P0 gate).

### Phase 3 — AI + Mocks (Weeks 4–6)
- Integrate Flashcards AI with server-side proxy, adaptive generation, and abuse controls.
- Build readiness score v1 and recommendation engine.
- Integrate Mocks results into progress/readiness pipeline.
- Analytics polish and readiness calibration.

### Phase 4 — Hardening + Release (Weeks 7–8)
- QA pass, accessibility audit, security review.
- Performance tuning and load validation.
- Decommission redundant legacy access patterns where parity exists.
- Release readiness checklist sign-off.

---

## 14. Acceptance Criteria

### Product Acceptance
- Student can log in once and access all three tools from one app.
- Home dashboard shows real cross-tool stats and actionable recommendations.
- Student can complete at least one full end-to-end study loop:
  - practice → review weakness → generate flashcards → take mock.
- Student receives AI readiness summary with domain-level weaknesses and next-best actions after sufficient activity.
- GA4 and Clarity capture all critical journey events in production with validated schemas.

### Quality Acceptance
- Meets design system and style guide constraints.
- Passes accessibility QA checks for core journeys.
- No critical-severity security issues on launch surface.

---

## 15. Metrics and Success KPIs

### Adoption
- % of active students using unified home as primary entry point.
- Weekly active users per module.

### Learning Outcome
- Increase in question accuracy after recommendation completion.
- Improvement in mock domain scores over baseline.
- Improvement in readiness score trend after completing AI-recommended actions.

### Engagement
- Session frequency per learner/week.
- Average study actions per session.
- Recommendation acceptance rate and completion rate.

### Stability
- API success rate.
- Frontend error rate.
- Flashcard generation success rate.
- Readiness pipeline successful recomputation rate.
- Analytics pipeline reliability (GA4 + Clarity capture rate for critical events).

---

## 16. Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Legacy integration complexity | Delays and inconsistency | Use phased adapters; avoid full rewrites in v1 |
| Data mapping inconsistencies | Bad recommendations | Enforce canonical IDs and taxonomy mapping |
| Performance regressions | User frustration | Skeletons, lazy loading, route-level budgets |
| CORS/auth misconfiguration | Module outages | Pre-prod environment validation and monitors |
| Overly broad scope | Timeline risk | Strict v1 scope and milestone gates |
| AI insight hallucination / low-trust feedback | Learner distrust | Guardrail prompts, confidence gating, transparent rationale tied to performance data |
| Analytics blind spots from late instrumentation | Poor product decisions | Make GA4 + Clarity instrumentation a P0 release gate and QA checklist item |

---

## 17. Open Questions

1. Preferred auth source of truth (Teachable-linked vs standalone identity)?
2. Final readiness score formula ownership (Product vs Academic team)?
3. Required level of historical backfill for legacy attempts?
4. SLA expectations for AI generation latency under peak usage?
5. Which admin workflows must be included in v1 vs deferred?
6. What minimum activity threshold unlocks reliable readiness scoring for students?

---

## 18. Delivery Plan (8 Weeks)

- **Week 1:** architecture finalization, data schemas, shell scaffolding + auth/session foundation
- **Weeks 2–3:** home dashboard + QBank integration + GA4/Clarity critical event coverage (P0 gate)
- **Weeks 4–5:** flashcards AI integration + readiness/recommendation v1
- **Week 6:** mocks integration + readiness calibration + analytics polish
- **Weeks 7–8:** QA hardening, accessibility audit, security review, performance tuning, release readiness

---

## 19. Release Readiness Checklist

- [ ] Core routes implemented and navigable
- [ ] Auth/session integrated across all modules
- [ ] Dashboard metrics validated against source data
- [ ] GA4 + Clarity tracking plan implemented and validated for critical journeys
- [ ] Readiness score outputs validated against expected scoring scenarios
- [ ] Accessibility audit passed for critical user flows
- [ ] Security review completed (secrets, CORS, rate limits)
- [ ] Observability dashboards and alerts configured
- [ ] Rollback plan documented

---

## 20. Appendix: Referenced Internal Design Inputs

- `medcognito-design-system.md`
- `medcognito-style-guide.md`
- `home-page-lofi-designs.md`

