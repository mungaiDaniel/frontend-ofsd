import api from "./api";
import { API } from "@/lib/constants";

export interface FlowPoint {
  label: string;
  deposits: number;
  withdrawals: number;
}

export interface OverviewStats {
  total_aum: number;
  total_withdrawals?: number;
  total_profit?: number;
  total_invested?: number;
  total_investors: number;
  performance_pct: number;
  active_batches: number;
  latest_epoch_end?: string;
  max_chart_epoch?: string;
  previous_epoch_end?: string;
  flow_series?: FlowPoint[];
  flow_by_batch?: {
    labels: string[];
    batches: { batch_id: number; batch_name: string; deposits: number[] }[];
    withdrawals: number[];
  };
  alloc_data?: { name: string; value: number }[];
  aum_data?: { labels: string[]; funds: { name: string; data: number[]; growth: number[] }[] };
  /** Latest balance per batch from batch_valuations (authoritative AUM building blocks) */
  batch_contributions?: Record<
    number,
    { balance: number; profit: number; period_end: string | null }
  >;
}

export const dashboardService = {
  async getOverviewStats(): Promise<OverviewStats> {
    const res = await api.get<{ status: number; data: OverviewStats }>(API.OVERVIEW_STATS);
    return res.data.data;
  },
};
