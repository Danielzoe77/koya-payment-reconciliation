const fs = require("fs");

const latest = new Map();

const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/);

for (const line of lines) {
  if (!line.trim()) continue;

  try {
    const event = JSON.parse(line);

    if (!event || typeof event !== "object" || Array.isArray(event)) continue;
    if (!event.txn_id || !event.ts) continue;

    const timestamp = Date.parse(event.ts);
    if (!Number.isFinite(timestamp)) continue;

    const previous = latest.get(event.txn_id);

    if (!previous || timestamp >= previous.timestamp) {
      latest.set(event.txn_id, {
        ...event,
        timestamp
      });
    }
  } catch {
    continue;
  }
}

let invalid = 0;

for (const payment of latest.values()) {
  if (payment.status === "success") {
    if (!Number.isFinite(Number(payment.amount))) {
      invalid++;

      if (invalid <= 15) {
        console.log("Invalid amount:", payment.amount);
        console.log("Transaction:", payment.txn_id);
        console.log("-------------------");
      }
    }
  }
}

console.log("Total invalid successful amounts:", invalid);