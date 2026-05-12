import { Output, ToolLoopAgent } from "ai";
import { z } from "zod";

import { type AnomalyResult, anomalySchema } from "./anomaly";
import { transactions } from "./data";

export async function findAnomalies(): Promise<AnomalyResult> {
  const agent = new ToolLoopAgent({
    model: "anthropic/claude-haiku-4.5",
    output: Output.object({
      schema: anomalySchema,
    }),
    instructions: `You are a transaction anomaly detection agent. Analyze transaction data and identify anomalies.

Use the getTransactions tool to retrieve transaction data, then analyze it for anomalies.

Look for:
- Unusually large amounts (significantly higher than typical transactions)
- Duplicate transactions (same merchant, amount, and date)
- Suspicious merchant names (ALL CAPS, crypto-related, urgency language)
- Round number wire transfers
- Statistical outliers`,
    tools: {
      getTransactions: {
        description:
          "Fetch all financial transactions from the database. Call this tool first to get transaction data before analyzing for anomalies.",
        inputSchema: z.object({}),
        execute: () => {
          console.log("[agent] fetched transactions");

          return transactions;
        },
      },
    },
    onFinish: async () => {
      console.log("[agent] completed");
    },
  });

  console.log("[agent] starting simple anomaly detection");

  const { output } = await agent.generate({
    prompt: "Retrieve the transactions and analyze them for anomalies.",
  });

  return output;
}
