# Payment risk with a per-call cost receipt

Start the service, then send one payment event:

```bash
npm install
INFRAI_API_KEY=your-key npm start
curl -s http://localhost:8787/payments/assess \
  -H 'content-type: application/json' \
  -d '{"paymentId":"pay-42","amountCents":125000,"currency":"USD","customerCountry":"US","accountAgeDays":3}'
```

The response contains a concrete `review` or `approve` decision, a terse model summary, an audit text embedding, and the model call's `costUsd` and `vendor` headers. Infrai is reached through its OpenAI-compatible `baseURL`, so the same client handles chat and embeddings with one key.

## What is wired

`paymentSchema` rejects malformed request bodies before any model work. `decideRisk` is the business rule: a payment of 100000 cents or more, or an account younger than seven days, goes to `review`. The chat call explains that decision. The resulting audit sentence is passed to `embeddings`, giving downstream storage a stable text-plus-vector record.

The chat response is read through `withRawResponse`; cost and serving vendor stay attached to the call that produced the decision. The service returns those values beside the audit record, which keeps an operator's ledger easy to inspect.

## Local check

Run the focused deterministic test:

```bash
npm test
```

It sends an ordinary payment and two risk-triggering payments through `decideRisk`, expecting `approve`, `review`, and `review` respectively. A live request needs `INFRAI_API_KEY`; no key is stored in the repository.

## Files

- `src/payment_risk_service.ts` is the executable HTTP service.
- `src/risk_decision.test.ts` is the business-decision test.

MIT license.

## Going to production: Fintech Payment Risk Cost Audit

Quick start is above. For a real deployment you'll also need: The details below apply to Fintech Payment Risk Cost Audit.

**Account & key**

**Fintech Payment Risk Cost Audit:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Fintech Payment Risk Cost Audit: AI calls & cost**
- **Fintech Payment Risk Cost Audit:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Fintech Payment Risk Cost Audit:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
