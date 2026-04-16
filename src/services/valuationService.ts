import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, CreateValuationRequest, CoreFund } from "@/lib/types";

export const valuationService = {
  async createEpoch(data: CreateValuationRequest): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(API.VALUATION_EPOCH, data);
    return res.data;
  },

  async dryRun(data: CreateValuationRequest): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(API.VALUATION_DRY_RUN, data);
    return res.data;
  },

  async getActiveFunds(): Promise<CoreFund[]> {
    const res = await api.get<ApiResponse<CoreFund[]>>(API.VALUATION_FUNDS);
    return res.data.data ?? [];
  },

  async confirm(data: CreateValuationRequest | any): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(API.VALUATION_CONFIRM, data);
    return res.data;
  },
};
