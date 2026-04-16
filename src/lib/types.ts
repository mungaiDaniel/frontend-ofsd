// ============================================================================
// OFDS TypeScript Types — mirrors Flask/SQLAlchemy backend models
// ============================================================================

// ── Auth ──

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  created: string;
}

export type UserRole = "user" | "admin" | "super_admin";
export type UserStatus = "pending" | "active";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  role: UserRole;
  name?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  // role is server-controlled (defaults to user)
  role?: string;
}

// ── Batches ──

export interface Batch {
  id: number;
  batch_name: string;
  certificate_number: string | null;
  total_principal: number;
  total_capital: number;
  date_deployed: string | null;
  duration_days: number;
  active_days?: number;
  expected_close_date: string | null;
  date_closed: string | null;
  is_active: boolean;
  is_transferred: boolean;
  deployment_confirmed: boolean;
  stage: BatchStage;
  status: BatchStatus;
  transaction_cost?: number;
  transfer_transaction_cost?: number;
  transfer_entry_fee_percent?: number;
  entry_fee_percentage?: number;
  batch_type?: string; // "Carried Forward" or "Fresh Start"
  investors_count: number;
  funds: FundBreakdown[];
  created_at: string | null;
  investments?: BatchInvestor[];
  grouped_by_fund?: Record<string, BatchFundGroup>;
}

export interface BatchInvestor {
  id: number;
  investor_name: string;
  investor_email?: string;
  investor_phone?: string | null;
  internal_client_code: string;
  amount_deposited: number;
  fund_name?: string | null;
  fund_id?: number | null;
  date_deposited?: string | null;
  /** Ledger-computed fields returned by GET /batches/:id */
  opening_balance?: number;   // amount_deposited at deposit time
  main_balance?: number;      // post-transfer principal after transaction + entry fee deductions
  current_balance?: number;   // EpochLedger.end_balance for this batch's period
  withdrawals?: number;       // EpochLedger.withdrawals captured in committed epoch
  profit?: number;            // EpochLedger.profit allocated to this investor
  transaction_fee_usd?: number;
  entry_fee_usd?: number;
}

export interface BatchFundGroup {
  fund_id: number | null;
  fund_name: string;
  investor_count: number;
  total_principal: number;
  investors: BatchInvestor[];
}

export type BatchStage = 1 | 2 | 3 | 4;
export type BatchStatus = "Pending" | "Active" | "Closed";

export interface FundBreakdown {
  fund_name: string;
  total_principal: number;
  investors_count: number;
}

export interface CreateBatchRequest {
  batch_name: string;
  date_deployed?: string;
  certificate_number?: string;
  duration_days?: number;
}

export interface PatchBatchRequest {
  is_transferred?: boolean;
  is_active?: boolean;
  date_deployed?: string;
  deployment_confirmed?: boolean;
  stage?: number;
  transfer_transaction_cost?: number;
  transfer_entry_fee_percent?: number;
  entry_fee_percentage?: number;
}

// ── Investments ──

export interface Investment {
  id: number;
  investor_name: string;
  investor_email: string;
  investor_phone: string | null;
  internal_client_code: string;
  amount_deposited: number;
  date_deposited: string;
  date_transferred: string | null;
  fund_name: string | null;
  fund_id: number | null;
  batch_id: number;
  wealth_manager: string | null;
  IFA: string | null;
  contract_note: string | null;
  valuation: number | null;
  transaction_fee_usd?: number | null;
  entry_fee_usd?: number | null;
  main_balance?: number | null;
}

export interface CreateInvestmentRequest {
  batch_id: number;
  investor_name: string;
  investor_email: string;
  investor_phone?: string;
  internal_client_code: string;
  amount_deposited: number;
  date_deposited: string;
  fund_name?: string;
  wealth_manager?: string;
  IFA?: string;
  contract_note?: string;
}

// ── Funds ──

export interface FundBatchSummary {
  batch_id: number;
  batch_name: string;
  total_aum: number;
  investor_count: number;
  date_deployed: string | null;
  is_active: boolean;
}

export interface CoreFund {
  id: number;
  fund_name: string;
  is_active: boolean;
  total_aum?: number;
  investor_count?: number;
  batches?: FundBatchSummary[];
}

export interface Fund {
  id: number;
  batch_id: number;
  fund_name: string;
  certificate_number: string;
  total_capital: number;
  date_deployed: string;
  duration_days: number;
  date_closed: string | null;
  is_active: boolean;
}

// ── Performance ──

export interface Performance {
  performance_id: number;
  batch_id: number;
  fund_name: string;
  gross_profit: number;
  transaction_costs: number;
  net_profit: number;
  date_created: string | null;
}

export interface CreatePerformanceRequest {
  gross_profit: number;
  transaction_costs: number;
  date_closed?: string;
  fund_name?: string;
}

export interface ProRataDistribution {
  id: number;
  batch_id: number;
  fund_name: string;
  investment_id: number;
  internal_client_code: string;
  investor_name: string;
  days_active: number;
  weighted_capital: number;
  profit_share_percentage: number;
  profit_allocated: number;
  calculation_date: string;
}

// ── Valuation ──

export interface ValuationRun {
  id: number;
  core_fund_id: number;
  epoch_start: string;
  epoch_end: string;
  performance_rate: number;
  head_office_total: number;
  status: "Committed" | "Failed";
  created_at: string;
}

export interface CreateValuationRequest {
  fund_id: number;
  start_date: string;
  end_date: string;
  performance_rate: number;
  head_office_total: number;
}

export interface EpochLedgerEntry {
  internal_client_code: string;
  fund_name: string;
  epoch_start: string;
  epoch_end: string;
  performance_rate: number;
  start_balance: number;
  deposits: number;
  withdrawals: number;
  profit: number;
  end_balance: number;
  previous_hash: string;
  current_hash: string;
}

// ── Reports ──

export interface ReportSummary {
  id: number;
  fund_id: number;
  fund_name: string;
  epoch_start: string;
  epoch_end: string;
  performance_rate_percent: number;
  head_office_total: number;
  summary: LedgerAggregate;
  status: string;
  created_at: string;
}

export interface LedgerAggregate {
  total_opening_capital: number;
  total_deposits: number;
  total_withdrawals: number;
  total_profit_distributed: number;
  total_closing_aum: number;
  investor_count: number;
}

export interface ReportDetail {
  id: number;
  fund_id: number;
  fund_name: string;
  batch_id?: number;
  epoch_start: string;
  epoch_end: string;
  performance_rate_percent: number;
  head_office_total: number;
  summary: LedgerAggregate;
  investor_breakdown: InvestorBreakdownRow[];
  reconciliation_diff: number;
}

export interface InvestorBreakdownRow {
  internal_client_code: string;
  investor_name: string;
  investor_email?: string;
  batch_id?: number;
  start_balance: number;
  deposits: number;
  withdrawals: number;
  pro_rata_profit: number;
  end_balance: number;
}

// ── Withdrawals ──

export interface Withdrawal {
  id: number;
  client_id: string;
  fund_id: number;
  fund_name: string;
  amount: number;
  status: "Pending" | "Approved" | "Rejected" | "Processed" | "Completed";
  date_withdrawn: string;
  approved_at: string | null;
  note: string | null;
}

export interface CreateWithdrawalRequest {
  internal_client_code: string;
  fund_id: number;
  amount: number;
  status?: string;
}

// ── Audit ──

export interface AuditLogEntry {
  id: number;
  user_id: number | null;
  user_email?: string | null;
  user_name?: string | null;
  action: string;
  target_type: string | null;
  target_id: number | null;
  target_name: string | null;
  description: string | null;
  old_value: string | null;
  new_value: string | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string;
  success: boolean;
  error_message: string | null;
}

// ── API Response Wrappers ──

export interface ApiResponse<T = unknown> {
  status: number;
  message: string;
  data?: T;
  count?: number;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string>;
}

// ── Performance Excel Upload ──

export interface PerformanceExcelRow {
  date: string;
  fund_name: string;
  duration: number;
  performance_percentage: number;
}
