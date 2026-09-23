import assert from "node:assert/strict";
import { decideRisk } from "./payment_risk_service.js";

const ordinary = { paymentId: "p-1", amountCents: 4200, currency: "USD", customerCountry: "US", accountAgeDays: 90 };
const newAccount = { paymentId: "p-2", amountCents: 4200, currency: "USD", customerCountry: "US", accountAgeDays: 2 };
const largePayment = { paymentId: "p-3", amountCents: 100000, currency: "USD", customerCountry: "US", accountAgeDays: 90 };

assert.equal(decideRisk(ordinary), "approve");
assert.equal(decideRisk(newAccount), "review");
assert.equal(decideRisk(largePayment), "review");
console.log("risk decision checks passed");
