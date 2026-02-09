import { z } from "zod";

const depositSchema = z.object({
  date: z.string().nullable(),
  description: z.string().nullable(),
  amount: z.number().nullable(),
  runningBalance: z.number().nullable(),
  category: z.enum([
    "ach_deposit",
    "wire_in",
    "mobile_deposit",
    "branch_deposit",
    "transfer_in",
    "interest",
    "refund",
    "other_deposit",
  ]).nullable(),
}).passthrough();

const withdrawalSchema = z.object({
  date: z.string().nullable(),
  description: z.string().nullable(),
  amount: z.number().nullable(),
  runningBalance: z.number().nullable(),
  category: z.enum([
    "check",
    "ach_debit",
    "wire_out",
    "debit_card",
    "atm",
    "transfer_out",
    "fee",
    "loan_payment",
    "tax_payment",
    "other_withdrawal",
  ]).nullable(),
}).passthrough();

const largeTransactionSchema = z.object({
  date: z.string().nullable(),
  amount: z.number().nullable(),
  description: z.string().nullable(),
}).passthrough();

const recurringDepositSchema = z.object({
  description: z.string().nullable(),
  frequency: z.string().nullable(),
  amount: z.number().nullable(),
}).passthrough();

const loanPaymentSchema = z.object({
  description: z.string().nullable(),
  amount: z.number().nullable(),
  frequency: z.string().nullable(),
}).passthrough();

export const bankStatementSchema = z.object({
  metadata: z.object({
    bankName: z.string().nullable(),
    accountHolder: z.string().nullable(),
    accountNumber_last4: z.string().nullable(),
    accountType: z.string().nullable(),
    statementPeriodStart: z.string().nullable(),
    statementPeriodEnd: z.string().nullable(),
    address: z.string().nullable(),
  }).passthrough(),
  summary: z.object({
    beginningBalance: z.number().nullable(),
    totalDeposits: z.number().nullable(),
    totalWithdrawals: z.number().nullable(),
    totalFees: z.number().nullable(),
    endingBalance: z.number().nullable(),
    averageDailyBalance: z.number().nullable(),
    daysInPeriod: z.number().nullable(),
  }).passthrough(),
  deposits: z.array(depositSchema).default([]),
  withdrawals: z.array(withdrawalSchema).default([]),
  flags: z.object({
    nsf_count: z.number().nullable(),
    overdraft_count: z.number().nullable(),
    overdraft_days: z.number().nullable(),
    negative_ending_balance: z.boolean().nullable(),
    large_deposits: z.array(largeTransactionSchema).default([]),
    large_withdrawals: z.array(largeTransactionSchema).default([]),
    recurring_deposits: z.array(recurringDepositSchema).default([]),
    loan_payments: z.array(loanPaymentSchema).default([]),
  }).passthrough(),
  extractionNotes: z.array(z.string()).default([]),
}).passthrough();

export type BankStatementData = z.infer<typeof bankStatementSchema>;
