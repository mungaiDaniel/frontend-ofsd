import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, Withdrawal, CreateWithdrawalRequest } from "@/lib/types";

export const withdrawalService = {
  async getAll(status?: string): Promise<Withdrawal[]> {
    const url = status ? `${API.WITHDRAWALS}?status=${status}` : API.WITHDRAWALS;
    const res = await api.get<ApiResponse<Withdrawal[]>>(url);
    return res.data.data ?? [];
  },

  async create(data: CreateWithdrawalRequest): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(API.WITHDRAWALS, data);
    return res.data;
  },

  async uploadExcel(file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ApiResponse>(API.WITHDRAWALS_UPLOAD, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async approve(withdrawalId: number): Promise<ApiResponse> {
    const res = await api.patch<ApiResponse>(`${API.WITHDRAWALS}/${withdrawalId}`, { status: "Approved" });
    return res.data;
  },

  async reject(withdrawalId: number, note?: string): Promise<ApiResponse> {
    const res = await api.patch<ApiResponse>(`${API.WITHDRAWALS}/${withdrawalId}`, { status: "Rejected", note });
    return res.data;
  },
};
