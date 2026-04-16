import api from './api';

// ─────────────────────────────────────────────────────────────────────────────
// Email Service — Manual Confirmation Gate
//
// Communicates with:
//   GET  /api/v1/emails/pending         → list all Pending_Confirmation rows
//   POST /api/v1/emails/:id/confirm     → send the email, mark Confirmed
//   POST /api/v1/emails/:id/cancel      → suppress without sending
// ─────────────────────────────────────────────────────────────────────────────

export interface PendingEmail {
  id: number;
  email_type: string;
  recipient_email: string;
  recipient_name: string | null;
  subject: string;
  body: string;
  batch_name: string | null;
  fund_name: string | null;
  amount: number | null;
  initial_deposit_usd?: number | null;
  transaction_fee_usd?: number | null;
  entry_fee_percent?: number | null;
  entry_fee_usd?: number | null;
  main_balance?: number | null;
  batch_id: number | null;
  investor_id: number | null;
  created_at: string | null;
}

export const emailService = {
  /** Fetch all emails awaiting admin confirmation */
  getPending: (): Promise<{ data: { status: number; count: number; data: PendingEmail[] } }> =>
    api.get('/emails/pending'),

  /** Confirm and immediately send via SMTP */
  confirm: (id: number): Promise<{ data: { status: number; message: string } }> =>
    api.post(`/emails/${id}/confirm`),

  /** Suppress the email — mark Suppressed without sending */
  cancel: (id: number): Promise<{ data: { status: number; message: string } }> =>
    api.post(`/emails/${id}/cancel`),
};
