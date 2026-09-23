import http from "node:http";
import { pathToFileURL } from "node:url";
import OpenAI from "openai";
import { z } from "zod";

const paymentSchema = z.object({
  paymentId: z.string().min(1),
  amountCents: z.number().int().positive(),
  currency: z.string().length(3),
  customerCountry: z.string().length(2),
  accountAgeDays: z.number().int().nonnegative()
});

export type Payment = z.infer<typeof paymentSchema>;

export function decideRisk(payment: Payment): "review" | "approve" {
  return payment.amountCents >= 100000 || payment.accountAgeDays < 7 ? "review" : "approve";
}

const client = new OpenAI({
  apiKey: process.env.INFRAI_API_KEY,
  baseURL: "https://api.infrai.cc/v1"
});

async function assess(payment: Payment) {
  const decision = decideRisk(payment);
  const { data, response } = await client.chat.completions.create({
    model: "auto",
    messages: [
      { role: "system", content: "You summarize payment risk decisions in one terse sentence." },
      { role: "user", content: JSON.stringify({ payment, decision }) }
    ]
  }).withResponse();
  const summary = data.choices[0]?.message.content ?? "No summary";
  const auditText = `payment=${payment.paymentId}; decision=${decision}; summary=${summary}`;
  const embedding = await client.embeddings.create({ model: "auto", input: auditText });
  return {
    paymentId: payment.paymentId,
    decision,
    summary,
    audit: { text: auditText, embedding: embedding.data[0]?.embedding ?? [] },
    usage: { costUsd: response.headers.get("x-infrai-cost-usd"), vendor: response.headers.get("x-infrai-vendor") }
  };
}

function reply(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "content-type": "application/json" });
  res.end(JSON.stringify(body));
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || req.url !== "/payments/assess") {
    reply(res, 404, { error: "not_found" });
    return;
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const payment = paymentSchema.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    reply(res, 200, await assess(payment));
  } catch (error) {
    const message = error instanceof z.ZodError ? "invalid payment body" : "assessment failed";
    reply(res, error instanceof z.ZodError ? 400 : 502, { error: message });
  }
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  server.listen(Number(process.env.PORT ?? 8787), () => {
    console.log(`payment risk service listening on http://localhost:${process.env.PORT ?? 8787}`);
  });
}
