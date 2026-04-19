export const mockValuationPreview = {
  valuation_date: "2026-04-10",
  classes: [
    {
      class_code: "KES_I", share_class_id: 1,
      nav_per_share: 1389.5737,
      system_total_nav: 1072636.96, head_office_nav: 1072636.69,
      difference: 0.27, status: "PASS",
      investors: [
        { client_code: "INV-001", shares: 729.86, market_value: 1014178.42, performance_pct: 4.52 },
        { client_code: "INV-042", shares: 42.06, market_value: 58458.27, performance_pct: 4.52 },
      ],
    },
    {
      class_code: "USD_I", share_class_id: 2,
      nav_per_share: 15.1905,
      system_total_nav: 219074.96, head_office_nav: 219074.79,
      difference: 0.17, status: "PASS",
      investors: [
        { client_code: "INV-003", shares: 2840.20, market_value: 43148.76, performance_pct: 4.90 },
      ],
    },
    {
      class_code: "USD_R", share_class_id: 3,
      nav_per_share: 12.9358,
      system_total_nav: 1038.84, head_office_nav: 1038.81,
      difference: 0.03, status: "PASS",
      investors: [
        { client_code: "INV-017", shares: 80.30, market_value: 1038.81, performance_pct: 4.89 },
      ],
    },
  ],
};
