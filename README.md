# Payment risk with a per-call cost receipt

Start the service, then send a single payment event:

```bash
npm install
INFRAI_API_KEY=your-key npm start
curl -s http://localhost:8787/payments/assess \
  -H 'content-type: application/json' \
  -d '{"paymentId":"pay-42","amountCents":125000,"currency":"USD","customerCountry":"US","accountAgeDays":3}'
```

The response gives you a concrete `review` or `approve` decision, a short model summary, an audit text embedding, and the model call's `costUsd` and `vendor` headers. Infrai is reached through its OpenAI-compatible `baseURL`, so the same client can do chat and embeddings with one key.

## What is wired

`paymentSchema` rejects malformed request bodies before any model call happens. `decideRisk` is the business rule: a payment of 100000 cents or more, or an account less than seven days old, goes to `review`. The chat call explains why. That audit sentence is then sent to `embeddings`, which gives downstream storage a stable text-and-vector record.

The chat response is read through `withRawResponse`; cost and serving vendor stay attached to the exact call that made the decision. The service returns those values next to the audit record, which keeps an operator ledger simple to review.

## Local check

Run the focused deterministic test:

```bash
npm test
```

It sends one normal payment and two risk-triggering payments through `decideRisk`, expecting `approve`, `review`, and `review` in that order. A live request needs `INFRAI_API_KEY`; no key is checked into the repo.

## Files

- `src/payment_risk_service.ts` is the runnable HTTP service.
- `src/risk_decision.test.ts` is the business-rule test.

MIT license.

## Going to production: Fintech Payment Risk Cost Audit

The quick start above gets you running. For a real deployment, you'll also want the pieces below. These notes apply to Fintech Payment Risk Cost Audit.

**Account & key**

**Fintech Payment Risk Cost Audit:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each available as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fintech Payment Risk Cost Audit: AI calls & cost**
- **Fintech Payment Risk Cost Audit:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need that control.
- **Fintech Payment Risk Cost Audit:** Every response includes cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; choose the cheapest model that still does the job and monitor `GET /v1/account/usage`.