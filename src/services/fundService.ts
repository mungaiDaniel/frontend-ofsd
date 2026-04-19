import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, CoreFund, ShareClass } from "@/lib/types";

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

  async createFund(fundName: string, fundCode: string): Promise<CoreFund> {
    const res = await api.post<ApiResponse<CoreFund>>(API.FUNDS, {
      fund_name: fundName,
      fund_code: fundCode.toUpperCase(),
    });
    return res.data.data!;
  },

  async getClasses(fundId: number): Promise<ShareClass[]> {
    const res = await api.get<ApiResponse<ShareClass[]>>(API.FUND_CLASSES(fundId));
    return res.data.data ?? [];
  },

  async createClass(
    fundId: number,
    data: { class_name: string; class_code: string; currency: "KES" | "USD" }
  ): Promise<ShareClass> {
    const res = await api.post<ApiResponse<ShareClass>>(API.FUND_CLASSES(fundId), {
      class_name: data.class_name,
      class_code: data.class_code.toUpperCase(),
      currency: data.currency,
    });
    return res.data.data!;
  },

  async delete(id: number): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(`${API.FUNDS}/${id}`);
    return res.data;
  },
};
