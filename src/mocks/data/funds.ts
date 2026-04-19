export const mockFunds = [
  { id: 1, fund_name: "Axiom", fund_code: "AXM", is_active: true },
  { id: 2, fund_name: "Atium", fund_code: "ATM", is_active: true },
  { id: 3, fund_name: "Nova Reserve", fund_code: "NVR", is_active: true },
];

export const mockClasses: Record<number, any[]> = {
  1: [
    {
      id: 1, core_fund_id: 1,
      class_name: "Class I Participating Shares",
      class_code: "KES_I", currency: "KES", is_active: true,
    },
    {
      id: 2, core_fund_id: 1,
      class_name: "Class I Participating Shares",
      class_code: "USD_I", currency: "USD", is_active: true,
    },
    {
      id: 3, core_fund_id: 1,
      class_name: "Class R Restricted Shares",
      class_code: "USD_R", currency: "USD", is_active: true,
    },
  ],
  2: [
    { id: 4, core_fund_id: 2, class_name: "Class I Participating Shares", class_code: "KES_I", currency: "KES", is_active: true },
    { id: 5, core_fund_id: 2, class_name: "Class I Participating Shares", class_code: "USD_I", currency: "USD", is_active: true },
  ],
  3: [],
};

const KES_I_HISTORY = [
  { date: "2025-11-10", nav: 1000.0000 },
  { date: "2025-12-10", nav: 1056.8200 },
  { date: "2026-01-10", nav: 1143.2900 },
  { date: "2026-02-10", nav: 1198.7500 },
  { date: "2026-03-10", nav: 1329.4779 },
  { date: "2026-04-10", nav: 1389.5737 },
];

const USD_I_HISTORY = [
  { date: "2025-11-10", nav: 10.0000 },
  { date: "2025-12-10", nav: 10.9231 },
  { date: "2026-01-10", nav: 11.8734 },
  { date: "2026-02-10", nav: 12.6891 },
  { date: "2026-03-10", nav: 14.4809 },
  { date: "2026-04-10", nav: 15.1905 },
];

const USD_R_HISTORY = [
  { date: "2025-11-10", nav: 8.5000 },
  { date: "2025-12-10", nav: 9.1234 },
  { date: "2026-01-10", nav: 10.2341 },
  { date: "2026-02-10", nav: 11.3421 },
  { date: "2026-03-10", nav: 12.3327 },
  { date: "2026-04-10", nav: 12.9358 },
];

export const mockFundSummary = {
  as_of_date: "2026-04-10",
  funds: [
    {
      id: 1, fund_name: "Axiom", fund_code: "AXM", is_active: true,
      classes: [
        {
          id: 1, class_name: "Class I Participating Shares",
          class_code: "KES_I", currency: "KES", is_active: true,
          total_shares: 771.92, prev_nav: 1329.4779, current_nav: 1389.5737,
          total_nav: 1072636.69, performance_pct: 4.52, valuation_date: "2026-04-10",
          nav_history: KES_I_HISTORY,
        },
        {
          id: 2, class_name: "Class I Participating Shares",
          class_code: "USD_I", currency: "USD", is_active: true,
          total_shares: 14421.80, prev_nav: 14.4809, current_nav: 15.1905,
          total_nav: 219074.79, performance_pct: 4.90, valuation_date: "2026-04-10",
          nav_history: USD_I_HISTORY,
        },
        {
          id: 3, class_name: "Class R Restricted Shares",
          class_code: "USD_R", currency: "USD", is_active: true,
          total_shares: 80.30, prev_nav: 12.3327, current_nav: 12.9358,
          total_nav: 1038.81, performance_pct: 4.89, valuation_date: "2026-04-10",
          nav_history: USD_R_HISTORY,
        },
      ],
      totals_by_currency: { KES: 1072636.69, USD: 220113.60 },
      weighted_performance_pct: 4.77,
    },
    {
      id: 2, fund_name: "Atium", fund_code: "ATM", is_active: true,
      classes: [
        {
          id: 4, class_name: "Class I Participating Shares",
          class_code: "KES_I", currency: "KES", is_active: true,
          total_shares: null, prev_nav: null, current_nav: null,
          total_nav: null, performance_pct: null, valuation_date: null,
        },
        {
          id: 5, class_name: "Class I Participating Shares",
          class_code: "USD_I", currency: "USD", is_active: true,
          total_shares: null, prev_nav: null, current_nav: null,
          total_nav: null, performance_pct: null, valuation_date: null,
        },
      ],
      totals_by_currency: {},
      weighted_performance_pct: null,
    },
    {
      id: 3, fund_name: "Nova Reserve", fund_code: "NVR", is_active: true,
      classes: [],
      totals_by_currency: {},
      weighted_performance_pct: null,
    },
  ],
};
