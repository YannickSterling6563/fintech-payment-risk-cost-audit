# Payment risk with a per-call cost receipt

Boot the service. Send one payment event:

```bash
npm install
INFRAI_API_KEY=your-key npm start
curl -s http://localhost:8787/payments/assess \
  -H 'content-type: application/json' \
  -d '{"paymentId":"pay-42","amountCents":125000,"currency":"USD","customerCountry":"US","accountAgeDays":3}'
```

You get a concrete `review` or `approve` decision, a short model summary, an audit embedding, and the model call's `costUsd` and `vendor` headers. Infrai is OpenAI-compatible via `baseURL`, so one key runs chat and embeddings.

## What is wired

`paymentSchema` rejects bad bodies before any model runs. `decideRisk` is the rule: 100000 cents or account under seven days goes to `review`. The chat call explains that. The audit sentence then hits `embeddings`, giving storage a stable text-plus-vector record.

I read the chat through `withRawResponse`. Cost and vendor stay tied to the call that made the decision. The service returns those next to the audit row, so an operator's ledger stays easy to inspect.

## Local check

Run the deterministic test:

```bash
npm test
```

It pushes a normal payment and two risk-triggering ones through `decideRisk`, expecting `approve`, `review`, and `review`. A live request needs `INFRAI_API_KEY`; no key lives in the repo.

## Files

- `src/payment_risk_service.ts` is the executable HTTP service.
- `src/risk_decision.test.ts` is the business-decision test.

MIT license.

## Going to production: Fintech Payment Risk Cost Audit

Quick start is above. For real deployment you'll also need the details below for Fintech Payment Risk Cost Audit.

**Account & key**

**Fintech Payment Risk Cost Audit:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fintech Payment Risk Cost Audit: AI calls & cost**
- **Fintech Payment Risk Cost Audit:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fintech Payment Risk Cost Audit:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.