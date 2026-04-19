export const mockInvestors = [
  {
    id: 1, investor_name: "Jane Doe", internal_client_code: "INV-001",
    investor_email: "jane@example.com", investor_phone: "+254700000001",
    fund_name: "Axiom", class_code: "KES_I", currency: "KES",
    shares: 729.86, market_value: 1014178.42, performance_pct: 4.52,
  },
  {
    id: 2, investor_name: "Grace Wanjiku", internal_client_code: "INV-042",
    investor_email: "grace@example.com", investor_phone: "+254700000042",
    fund_name: "Axiom", class_code: "KES_I", currency: "KES",
    shares: 42.06, market_value: 58458.27, performance_pct: 4.52,
  },
  {
    id: 3, investor_name: "David Odhiambo", internal_client_code: "INV-003",
    investor_email: "david@example.com", investor_phone: "+254700000003",
    fund_name: "Axiom", class_code: "USD_I", currency: "USD",
    shares: 2840.20, market_value: 43148.76, performance_pct: 4.90,
  },
  {
    id: 4, investor_name: "Amina Hassan", internal_client_code: "INV-017",
    investor_email: "amina@example.com", investor_phone: "+254700000017",
    fund_name: "Axiom", class_code: "USD_R", currency: "USD",
    shares: 80.30, market_value: 1038.81, performance_pct: 4.89,
  },
  {
    id: 5, investor_name: "Peter Kamau", internal_client_code: "INV-028",
    investor_email: "peter@example.com", investor_phone: "+254700000028",
    fund_name: "Atium", class_code: "KES_I", currency: "KES",
    shares: null, market_value: null, performance_pct: null,
  },
];

export const mockInvestorLookup: Record<string, any> = {
  "INV-001": { internal_client_code: "INV-001", investor_name: "Jane Doe", investor_email: "jane@example.com", investor_phone: "+254700000001" },
  "INV-042": { internal_client_code: "INV-042", investor_name: "Grace Wanjiku", investor_email: "grace@example.com", investor_phone: "+254700000042" },
  "INV-003": { internal_client_code: "INV-003", investor_name: "David Odhiambo", investor_email: "david@example.com", investor_phone: "+254700000003" },
  "INV-017": { internal_client_code: "INV-017", investor_name: "Amina Hassan", investor_email: "amina@example.com", investor_phone: "+254700000017" },
  "INV-028": { internal_client_code: "INV-028", investor_name: "Peter Kamau", investor_email: "peter@example.com", investor_phone: "+254700000028" },
};

export const mockInvestorOverview: Record<string, any> = {
  "INV-001": {
    internal_client_code: "INV-001", investor_name: "Jane Doe",
    investor_email: "jane@example.com", investor_phone: "+254700000001",
    positions: [
      { batch_id: 2, batch_name: "AXM_KES_I_2026-04-10", fund_name: "Axiom", class_code: "KES_I", currency: "KES",
        deposit_amount: 1000000, shares: 729.86, market_value: 1014178.42, performance_pct: 4.52,
        deployment_nav: 1370.65, current_nav: 1389.5737, deployment_date: "2026-04-10" },
    ],
  },
  "INV-042": {
    internal_client_code: "INV-042", investor_name: "Grace Wanjiku",
    investor_email: "grace@example.com", investor_phone: "+254700000042",
    positions: [
      { batch_id: 2, batch_name: "AXM_KES_I_2026-04-10", fund_name: "Axiom", class_code: "KES_I", currency: "KES",
        deposit_amount: 57600, shares: 42.06, market_value: 58458.27, performance_pct: 4.52,
        deployment_nav: 1370.65, current_nav: 1389.5737, deployment_date: "2026-04-10" },
    ],
  },
  "INV-003": {
    internal_client_code: "INV-003", investor_name: "David Odhiambo",
    investor_email: "david@example.com", investor_phone: "+254700000003",
    positions: [
      { batch_id: 2, batch_name: "AXM_USD_I_2026-04-10", fund_name: "Axiom", class_code: "USD_I", currency: "USD",
        deposit_amount: 41200, shares: 2840.20, market_value: 43148.76, performance_pct: 4.90,
        deployment_nav: 14.4809, current_nav: 15.1905, deployment_date: "2026-04-10" },
    ],
  },
  "INV-017": {
    internal_client_code: "INV-017", investor_name: "Amina Hassan",
    investor_email: "amina@example.com", investor_phone: "+254700000017",
    positions: [
      { batch_id: 2, batch_name: "AXM_USD_R_2026-04-10", fund_name: "Axiom", class_code: "USD_R", currency: "USD",
        deposit_amount: 1000, shares: 80.30, market_value: 1038.81, performance_pct: 4.89,
        deployment_nav: 12.4531, current_nav: 12.9358, deployment_date: "2026-04-10" },
    ],
  },
  "INV-028": {
    internal_client_code: "INV-028", investor_name: "Peter Kamau",
    investor_email: "peter@example.com", investor_phone: "+254700000028",
    positions: [
      { batch_id: 1, batch_name: "ATM_KES_I_2026-04-23", fund_name: "Atium", class_code: "KES_I", currency: "KES",
        deposit_amount: 500000, shares: null, market_value: null, performance_pct: null,
        deployment_nav: null, current_nav: null, deployment_date: null },
    ],
  },
};
