export const mockTransactions = [
  { id: 1, type: "deposit", date: "2026-04-17", investor_name: "Jane Doe", internal_client_code: "INV-001", fund_name: "Axiom", class_code: "KES_I", currency: "KES", amount: 1014178.42, status: "Completed" },
  { id: 2, type: "deposit", date: "2026-04-17", investor_name: "Grace Wanjiku", internal_client_code: "INV-042", fund_name: "Axiom", class_code: "KES_I", currency: "KES", amount: 58458.27, status: "Completed" },
  { id: 3, type: "deposit", date: "2026-04-10", investor_name: "David Odhiambo", internal_client_code: "INV-003", fund_name: "Axiom", class_code: "USD_I", currency: "USD", amount: 43148.76, status: "Completed" },
  { id: 4, type: "deposit", date: "2026-04-10", investor_name: "Amina Hassan", internal_client_code: "INV-017", fund_name: "Axiom", class_code: "USD_R", currency: "USD", amount: 1038.81, status: "Completed" },
  { id: 5, type: "valuation", date: "2026-04-10", investor_name: "Jane Doe", internal_client_code: "INV-001", fund_name: "Axiom", class_code: "KES_I", currency: "KES", amount: 1014178.42, status: "Committed" },
  { id: 6, type: "valuation", date: "2026-04-10", investor_name: "David Odhiambo", internal_client_code: "INV-003", fund_name: "Axiom", class_code: "USD_I", currency: "USD", amount: 43148.76, status: "Committed" },
  { id: 7, type: "deposit", date: "2026-04-17", investor_name: "Peter Kamau", internal_client_code: "INV-028", fund_name: "Atium", class_code: "KES_I", currency: "KES", amount: 500000, status: "Completed" },
  { id: 8, type: "withdrawal", date: "2026-04-15", investor_name: "Grace Wanjiku", internal_client_code: "INV-042", fund_name: "Axiom", class_code: "KES_I", currency: "KES", amount: 25000, status: "Completed" },
  { id: 9, type: "valuation", date: "2026-04-10", investor_name: "Amina Hassan", internal_client_code: "INV-017", fund_name: "Axiom", class_code: "USD_R", currency: "USD", amount: 1038.81, status: "Committed" },
  { id: 10, type: "deposit", date: "2026-04-14", investor_name: "Jane Doe", internal_client_code: "INV-001", fund_name: "Atium", class_code: "KES_I", currency: "KES", amount: 450000, status: "Completed" },
];

export type EligibleInvestorEmailStatus = "ready" | "no_email" | "already_sent";

export const mockEligibleInvestors = [
  { id: 1,  investor_name: "Jane Doe",        internal_client_code: "INV-001", fund_name: "Axiom", class_code: "KES_I", currency: "KES" as const, investor_email: "jane@example.com",    last_statement_date: "2026-03-31", email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 2,  investor_name: "Grace Wanjiku",   internal_client_code: "INV-042", fund_name: "Axiom", class_code: "KES_I", currency: "KES" as const, investor_email: "grace@example.com",   last_statement_date: "2026-03-31", email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 3,  investor_name: "Peter Kamau",     internal_client_code: "INV-028", fund_name: "Axiom", class_code: "KES_I", currency: "KES" as const, investor_email: "peter@example.com",   last_statement_date: "2026-02-28", email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 4,  investor_name: "Fatuma Osman",    internal_client_code: "INV-019", fund_name: "Axiom", class_code: "KES_I", currency: "KES" as const, investor_email: null,                  last_statement_date: null,         email_status: "no_email" as EligibleInvestorEmailStatus },
  { id: 5,  investor_name: "Samuel Maina",    internal_client_code: "INV-007", fund_name: "Axiom", class_code: "KES_I", currency: "KES" as const, investor_email: "samuel@example.com",  last_statement_date: "2026-03-31", email_status: "already_sent" as EligibleInvestorEmailStatus },
  { id: 6,  investor_name: "David Odhiambo",  internal_client_code: "INV-003", fund_name: "Axiom", class_code: "USD_I", currency: "USD" as const, investor_email: "david@example.com",   last_statement_date: "2026-03-31", email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 7,  investor_name: "Amina Hassan",    internal_client_code: "INV-017", fund_name: "Axiom", class_code: "USD_R", currency: "USD" as const, investor_email: "amina@example.com",   last_statement_date: "2026-03-31", email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 8,  investor_name: "Chris Mutuku",    internal_client_code: "INV-055", fund_name: "Axiom", class_code: "USD_I", currency: "USD" as const, investor_email: "chris@example.com",   last_statement_date: "2026-02-28", email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 9,  investor_name: "Esther Njeri",    internal_client_code: "INV-061", fund_name: "Axiom", class_code: "KES_I", currency: "KES" as const, investor_email: "esther@example.com",  last_statement_date: null,         email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 10, investor_name: "Omar Sharif",     internal_client_code: "INV-004", fund_name: "Axiom", class_code: "USD_R", currency: "USD" as const, investor_email: null,                  last_statement_date: null,         email_status: "no_email" as EligibleInvestorEmailStatus },
  { id: 11, investor_name: "Lucy Achieng",    internal_client_code: "INV-033", fund_name: "Atium", class_code: "KES_I", currency: "KES" as const, investor_email: "lucy@example.com",    last_statement_date: "2026-03-31", email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 12, investor_name: "James Kariuki",   internal_client_code: "INV-022", fund_name: "Atium", class_code: "KES_I", currency: "KES" as const, investor_email: "james@example.com",   last_statement_date: "2026-03-31", email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 13, investor_name: "Wambui Githinji", internal_client_code: "INV-048", fund_name: "Atium", class_code: "KES_I", currency: "KES" as const, investor_email: "wambui@example.com",  last_statement_date: "2026-03-31", email_status: "already_sent" as EligibleInvestorEmailStatus },
  { id: 14, investor_name: "Hassan Ahmed",    internal_client_code: "INV-009", fund_name: "Atium", class_code: "KES_I", currency: "KES" as const, investor_email: "hassan@example.com",  last_statement_date: "2026-02-28", email_status: "ready" as EligibleInvestorEmailStatus },
  { id: 15, investor_name: "Miriam Terer",    internal_client_code: "INV-074", fund_name: "Atium", class_code: "KES_I", currency: "KES" as const, investor_email: "miriam@example.com",  last_statement_date: null,         email_status: "ready" as EligibleInvestorEmailStatus },
];

export type ReportRunStatus = "sent" | "partial" | "failed";

export const mockReportRuns = [
  { id: 1, sent_at: "2026-03-31T14:22:00+03:00", period: "2026-03", fund_name: "Axiom", class_code: "KES_I", recipient_count: 12, sent_by: "sk@horizonafrica.com", status: "sent" as ReportRunStatus },
  { id: 2, sent_at: "2026-03-31T15:01:00+03:00", period: "2026-03", fund_name: "Axiom", class_code: "USD_I", recipient_count: 4,  sent_by: "sk@horizonafrica.com", status: "partial" as ReportRunStatus },
  { id: 3, sent_at: "2026-02-28T11:47:00+03:00", period: "2026-02", fund_name: "Axiom", class_code: "KES_I", recipient_count: 11, sent_by: "sk@horizonafrica.com", status: "sent" as ReportRunStatus },
];

export const mockReportRunDetails: Record<number, object> = {
  1: {
    id: 1, period: "2026-03", generated_at: "2026-03-31T14:22:00+03:00",
    sent_by: "sk@horizonafrica.com", fund_name: "Axiom", class_code: "KES_I", currency: "KES",
    recipient_count: 12, status: "sent",
    recipients: [
      { id: 1,  investor_name: "Jane Doe",      internal_client_code: "INV-001", investor_email: "jane@example.com",    delivery: "delivered", opened: true },
      { id: 2,  investor_name: "Grace Wanjiku", internal_client_code: "INV-042", investor_email: "grace@example.com",   delivery: "delivered", opened: false },
      { id: 3,  investor_name: "Peter Kamau",   internal_client_code: "INV-028", investor_email: "peter@example.com",   delivery: "delivered", opened: true },
      { id: 9,  investor_name: "Esther Njeri",  internal_client_code: "INV-061", investor_email: "esther@example.com",  delivery: "delivered", opened: false },
      { id: 11, investor_name: "Lucy Achieng",  internal_client_code: "INV-033", investor_email: "lucy@example.com",    delivery: "delivered", opened: true },
      { id: 14, investor_name: "Hassan Ahmed",  internal_client_code: "INV-009", investor_email: "hassan@example.com",  delivery: "failed",    opened: false },
    ],
  },
  2: {
    id: 2, period: "2026-03", generated_at: "2026-03-31T15:01:00+03:00",
    sent_by: "sk@horizonafrica.com", fund_name: "Axiom", class_code: "USD_I", currency: "USD",
    recipient_count: 4, status: "partial",
    recipients: [
      { id: 6, investor_name: "David Odhiambo", internal_client_code: "INV-003", investor_email: "david@example.com", delivery: "delivered", opened: true },
      { id: 8, investor_name: "Chris Mutuku",   internal_client_code: "INV-055", investor_email: "chris@example.com", delivery: "failed",    opened: false },
    ],
  },
  3: {
    id: 3, period: "2026-02", generated_at: "2026-02-28T11:47:00+03:00",
    sent_by: "sk@horizonafrica.com", fund_name: "Axiom", class_code: "KES_I", currency: "KES",
    recipient_count: 11, status: "sent",
    recipients: [
      { id: 1, investor_name: "Jane Doe",      internal_client_code: "INV-001", investor_email: "jane@example.com",   delivery: "delivered", opened: true },
      { id: 2, investor_name: "Grace Wanjiku", internal_client_code: "INV-042", investor_email: "grace@example.com",  delivery: "delivered", opened: true },
      { id: 3, investor_name: "Peter Kamau",   internal_client_code: "INV-028", investor_email: "peter@example.com",  delivery: "delivered", opened: false },
    ],
  },
};
