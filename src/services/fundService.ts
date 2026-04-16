import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, CoreFund } from "@/lib/types";

export const fundService = {
  async getAll(): Promise<CoreFund[]> {
    const res = await api.get<ApiResponse<CoreFund[]>>(API.FUNDS);
    return res.data.data ?? [];
  },

  async getById(id: number): Promise<CoreFund | null> {
    const res = await api.get<ApiResponse<CoreFund>>(`${API.FUNDS}/${id}`);
    return res.data.data ?? null;
  },

  async create(fundName: string): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(API.FUNDS, { fund_name: fundName });
    return res.data;
  },

  async delete(id: number): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`${API.FUNDS}/${id}`);
    return res.data;
  },
};
