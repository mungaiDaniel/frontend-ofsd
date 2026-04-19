import type { BatchStage, UserRole } from "./types";

// ── Roles ──

export const ROLES = {
  USER: "user" as UserRole,
  ADMIN: "admin" as UserRole,
  SUPER_ADMIN: "super_admin" as UserRole,
} as const;

// ── Batch Stages ──

export const STAGE_LABELS: Record<BatchStage, string> = {
  1: "Deposited",
  2: "Transferred",
  3: "Deployed",
  4: "Active",
};

export const STAGE_DESCRIPTIONS: Record<BatchStage, string> = {
  1: "Investments deposited into batch",
  2: "Funds transferred to custodian",
  3: "Deployment confirmed with date",
  4: "Batch is actively trading",
};

// ── Routes ──

export const ROUTES = {
  // Landing
  LANDING: "/",

  // Auth
  LOGIN: "/login",
  REGISTER: "/register",

  // Dashboard
  OVERVIEW: "/overview",

  // Batches
  BATCHES: "/batches",
  BATCH_CREATE: "/batches/new",
  BATCH_DETAIL: (id: number | string) => `/batches/${id}`,
  BATCH_PERFORMANCE: (id: number | string) => `/batches/${id}/performance`,

  // Funds
  FUNDS: "/funds",
  FUND_MANAGE: "/funds/manage",
  FUND_DETAIL: (id: number | string) => `/funds/${id}`,

  // Valuations
  VALUATIONS: "/valuations",
  VALUATION_CREATE: "/valuations/new",

  // Reports
  REPORTS: "/reports",
  REPORT_DETAIL: (id: number | string) => `/reports/${id}`,
  PORTFOLIO: "/reports/portfolio",

  // Withdrawals
  WITHDRAWALS: "/withdrawals",

  // Users
  USERS: "/users",
  INVESTORS: "/investors",
  INVESTOR_ADD: "/investors/add",
  INVESTOR_OVERVIEW: (clientCode: string) => `/investors/${encodeURIComponent(clientCode)}`,
  INVESTOR_STATEMENT: (clientCode: string) => `/investors/${encodeURIComponent(clientCode)}/statement`,

  // Super Admin
  AUDIT_LOG: "/audit-log",

  // Settings
  SETTINGS: "/settings",

  // Easter egg
  CREDITS: "/credits",
} as const;

// ── API Paths ──

export const API = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/users",
  USERS: "/users",
  USER_BY_ID: (id: number) => `/users/${id}`,
  APPROVE_USER: (id: number) => `/users/${id}/approve`,
  SET_USER_ROLE: (id: number) => `/users/${id}/role`,
  SET_USER_STATUS: (id: number) => `/users/${id}/status`,
  RESET_USER_PASSWORD: (id: number) => `/users/${id}/reset-password`,
  EMPLOYEES: "/employees",

  // Batches
  BATCHES: "/batches",
  BATCH_BY_ID: (id: number) => `/batches/${id}`,
  BATCH_SUMMARY: (id: number) => `/batches/${id}/summary`,
  BATCH_FUNDS: (id: number) => `/batches/${id}/funds`,
  BATCH_UPLOAD_EXCEL: (id: number) => `/batches/${id}/upload-excel`,
  BATCH_TOGGLE_ACTIVE: (id: number) => `/batches/${id}/toggle-active`,
  BATCH_EMAIL_LOGS: (id: number) => `/batches/${id}/email-logs`,

  // Investments
  INVESTMENTS: "/investments",
  INVESTORS_NEW: "/investors",
  INVESTORS_EXISTING: "/investors/existing",
  INVESTOR_LOOKUP: (code: string) => `/investors/${encodeURIComponent(code)}`,
  INVESTOR_DIRECTORY: "/investors",
  INVESTOR_EMAIL_LOGS: (clientCode: string) => `/investors/${encodeURIComponent(clientCode)}/email-logs`,

  // Withdrawals
  WITHDRAWALS: "/withdrawals",
  WITHDRAWALS_UPLOAD: "/withdrawals/upload",

  // Funds
  FUNDS: "/funds",
  FUNDS_SUMMARY: "/funds/summary",
  FUND_CLASSES: (id: number) => `/funds/${id}/classes`,

  // Performance
  BATCH_PERFORMANCE: (batchId: number) => `/batches/${batchId}/performance`,
  BATCH_PRO_RATA: (batchId: number) => `/batches/${batchId}/calculate-pro-rata`,
  PERFORMANCE_UPLOAD_EXCEL: "/performance/upload-excel",

  // Valuation (old epoch-based — kept for backward compat)
  VALUATION_EPOCH: "/valuation/epoch",
  VALUATION_CONFIRM: "/valuation/confirm",
  VALUATION_DRY_RUN: "/valuation/dry-run",
  VALUATION_FUNDS: "/valuation/funds",

  // Valuation (new NAV-per-share system)
  VALUATION_NAV: "/valuation/nav",
  VALUATION_PREVIEW: "/valuation/preview",

  // Reports
  REPORTS: "/reports",
  REPORT_BY_ID: (id: number) => `/reports/${id}`,
  REPORT_PDF: (id: number) => `/reports/${id}/pdf`,
  INVESTOR_STATEMENT: (batchId: number, email: string) => `/reports/investor-statement/${batchId}/${encodeURIComponent(email)}`,
  INVESTOR_STATEMENT_PDF: (email: string) => `/reports/investor/${email}/pdf`,
  INVESTOR_STATEMENT_PDF_CLIENT: (clientCode: string) => `/investors/${encodeURIComponent(clientCode)}/statement/pdf`,
  INVESTOR_WITHDRAWAL_PDF: (clientCode: string, withdrawalId: number) => `/investors/${encodeURIComponent(clientCode)}/withdrawals/${withdrawalId}/pdf`,
  INVESTOR_DEPOSIT_PDF: (clientCode: string, batchId: number) => `/investors/${encodeURIComponent(clientCode)}/deposits/${batchId}/pdf`,
  VERIFY_HASH_CHAIN: (investorCode: string, fundName: string) => `/reports/verify-hash-chain/${investorCode}/${fundName}`,
  PORTFOLIO: "/reports/portfolio",
  PORTFOLIO_MULTI_BATCH: "/reports/portfolio/multi-batch",
  BATCH_SUMMARY_EXCEL: (id: number) => `/reports/batch/${id}/summary-excel`,
  BATCH_RECONCILIATION: (id: number) => `/reports/batch/${id}/reconciliation`,

  // Reports v2 — Generate & Send (new — to be confirmed with Daniel)
  REPORTS_ELIGIBLE_INVESTORS: "/reports/eligible-investors",
  REPORTS_GENERATE: "/reports/generate",
  REPORTS_RUNS: "/reports/runs",
  REPORTS_RUN_BY_ID: (id: number) => `/reports/runs/${id}`,
  REPORTS_PREVIEW: "/reports/preview",

  // Overview statistics
  OVERVIEW_STATS: "/stats/overview",

  // Transactions
  TRANSACTIONS_RECENT: "/transactions/recent",

  // Audit (backend dependency — endpoint may not exist yet)
  AUDIT_LOGS: "/audit-logs",
  AUDIT_LOGS_EXPORT: "/audit-logs/export",
  RECENT_NOTIFICATIONS: "/batches/notifications/recent",
} as const;

// ── Chart Colors (mapped to fund identity) ──

export const FUND_COLORS: Record<string, string> = {
  axiom: "#3B6FD4",
  atium: "#3DBB78",
  default: "#D4940B",
};

export const IDLE_TIMEOUT_MS = 10 * 60 * 1000;

export const CHART_COLORS = {
  deposit: "#3DBB78",
  withdrawal: "#D44B4B",
  grid: "#1E293B",
  label: "#94A3B8",
  tooltipBg: "#0B1228",
  tooltipBorder: "#1E293B",
} as const;
