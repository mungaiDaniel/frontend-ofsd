import api from "./api";
import type { FundSummaryResponse } from "@/lib/types";

export const fundSummaryService = {
  async getSummary(): Promise<FundSummaryResponse | null> {
    try {
      const res = await api.get<{ status: number; data: FundSummaryResponse }>("/funds/summary");
      return res.data.data;
    } catch (err) {
      console.warn("Fund summary unavailable", err);
      return null;
    }
  },
};
