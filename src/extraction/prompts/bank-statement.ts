// Bank Statement Extraction Prompt
// This is the PRIMARY extraction method for bank statements. Textract extracts
// raw text and tables, then Claude structures the data into our schema.
// Bank statements have no standardized line numbering like IRS forms,
// so AI-driven structuring does the heavy lifting here.

export const BANK_STATEMENT_PROMPT = `You are a financial data extraction specialist. Extract ALL financial data from this bank statement.

Return a JSON object with this EXACT structure. Use null for any field you cannot find or read. Use numbers only (no dollar signs, commas, or text). Negative numbers should use a minus sign (e.g., -5000).

{
  "metadata": {
    "bankName": null,
    "accountHolder": null,
    "accountNumber_last4": null,
    "accountType": null,
    "statementPeriodStart": null,
    "statementPeriodEnd": null,
    "address": null
  },
  "summary": {
    "beginningBalance": null,
    "totalDeposits": null,
    "totalWithdrawals": null,
    "totalFees": null,
    "endingBalance": null,
    "averageDailyBalance": null,
    "daysInPeriod": null
  },
  "deposits": [
    {
      "date": "2023-01-15",
      "description": "ACH Deposit - COMPANY NAME",
      "amount": null,
      "runningBalance": null,
      "category": "ach_deposit"
    }
  ],
  "withdrawals": [
    {
      "date": "2023-01-16",
      "description": "Check #1234",
      "amount": null,
      "runningBalance": null,
      "category": "check"
    }
  ],
  "flags": {
    "nsf_count": 0,
    "overdraft_count": 0,
    "overdraft_days": 0,
    "negative_ending_balance": false,
    "large_deposits": [],
    "large_withdrawals": [],
    "recurring_deposits": [],
    "loan_payments": []
  },
  "extractionNotes": []
}

TRANSACTION CATEGORIZATION:
For each deposit, categorize as one of:
- "ach_deposit": ACH/electronic deposit (payroll, transfers in)
- "wire_in": Wire transfer received
- "mobile_deposit": Mobile check deposit
- "branch_deposit": In-branch/ATM cash or check deposit
- "transfer_in": Transfer from another account at same bank
- "interest": Interest earned
- "refund": Refund or reversal
- "other_deposit": Anything that doesn't fit above

For each withdrawal, categorize as one of:
- "check": Check payment (include check number in description)
- "ach_debit": ACH/electronic debit (auto-pay, recurring)
- "wire_out": Wire transfer sent
- "debit_card": Debit card/POS transaction
- "atm": ATM withdrawal
- "transfer_out": Transfer to another account at same bank
- "fee": Bank fee (monthly service, overdraft, NSF, etc.)
- "loan_payment": Loan or line of credit payment
- "tax_payment": IRS or state tax payment
- "other_withdrawal": Anything that doesn't fit above

FLAGS DETAIL:
- "nsf_count": Count of NSF (non-sufficient funds) / bounced transactions
- "overdraft_count": Number of times account went into overdraft
- "overdraft_days": Total days in overdraft during the statement period
- "negative_ending_balance": true if ending balance is negative
- "large_deposits": Array of deposits >= $10,000 (include date, amount, description) — these may trigger CTR reporting
- "large_withdrawals": Array of withdrawals >= $10,000 (include date, amount, description)
- "recurring_deposits": Array of identified recurring deposit patterns (include description, frequency like "weekly"/"biweekly"/"monthly", average amount)
- "loan_payments": Array of identified loan payments (include description, amount, frequency)

CRITICAL RULES:
1. Extract EVERY transaction on the statement. Do not skip any.
2. Dates must be in ISO format: YYYY-MM-DD.
3. All amounts must be positive numbers. The deposits vs. withdrawals arrays indicate direction.
4. If the statement spans multiple pages, ensure you capture ALL pages.
5. Verify: beginningBalance + totalDeposits - totalWithdrawals - totalFees should equal endingBalance. If it doesn't, note the discrepancy in extractionNotes.
6. NEVER guess or estimate. If you can't read a transaction, include it with null amount and add a note in extractionNotes.
7. Running balance is the balance AFTER the transaction. Include if shown on the statement.
8. For checks, always include the check number if visible.
9. NSF fees and overdraft fees are important signals — flag them explicitly.
10. Look for patterns: regular payroll deposits, recurring payments, unusual activity.`;

export const BANK_STATEMENT_VERSION = "bank-v1";
