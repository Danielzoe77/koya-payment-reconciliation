
const fs = require("fs");

const latestPayments = new Map();

// Read the payment export
const lines = fs.readFileSync("payments.jsonl", "utf8").split(/\r?\n/);

for (const line of lines) {
  // Ignore empty lines
  if (!line.trim()) continue;

  let event;

  // Ignore lines that cannot be read as JSON
  try {
    event = JSON.parse(line);
  } catch {
    continue;
  }

  // Ignore events without a transaction ID
  if (!event || typeof event !== "object" || Array.isArray(event)) {
    continue;
  }

  if (
    event.txn_id === undefined ||
    event.txn_id === null ||
    String(event.txn_id).trim() === ""
  ) {
    continue;
  }

  // Every valid event has a valid UTC timestamp
  const timestamp = Date.parse(event.ts);

  // Get the previous attempt for this transaction
  const previous = latestPayments.get(event.txn_id);

  // Keep only the latest attempt
  // If timestamps are equal, the later line takes precedence.
  if (!previous || timestamp >= previous.timestamp) {
    latestPayments.set(event.txn_id, {
      status: event.status,
      amount: Number(String(event.amount).replace(/,/g, "")),
      timestamp: timestamp
    });
  }
}

// Calculate collected payments
let total = 0;
let count = 0;

for (const payment of latestPayments.values()) {
  if (payment.status === "success") {
    total += payment.amount;
    count += 1;
  }
}

// Read the expected successful payment count
const expected = parseInt(
  fs.readFileSync("expected.txt", "utf8").trim(),
  10
);

// Check the result
if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`
  );
  console.log(
    "Something in the data isn't being handled the way the README describes."
  );
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}

