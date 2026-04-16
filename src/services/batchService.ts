import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, Batch, CreateBatchRequest, PatchBatchRequest } from "@/lib/types";

export const batchService = {
  async getAll(): Promise<Batch[]> {
    const res = await api.get<ApiResponse<Batch[]>>(API.BATCHES);
    return res.data.data ?? [];
  },

  async getById(id: number): Promise<Batch> {
    const res = await api.get<ApiResponse<Batch>>(API.BATCH_BY_ID(id));
    return res.data.data as Batch;
  },

  async create(data: CreateBatchRequest): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(API.BATCHES, data);
    return res.data;
  },

  async patch(id: number, data: PatchBatchRequest): Promise<ApiResponse> {
    const res = await api.patch<ApiResponse>(API.BATCH_BY_ID(id), data);
    return res.data;
  },

  async toggleActive(id: number): Promise<ApiResponse> {
    const res = await api.patch<ApiResponse>(API.BATCH_TOGGLE_ACTIVE(id), {});
    return res.data;
  },

  async uploadExcel(id: number, file: File): Promise<ApiResponse> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post<ApiResponse>(API.BATCH_UPLOAD_EXCEL(id), formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data;
  },

  async getSummary(id: number): Promise<ApiResponse> {
    const res = await api.get<ApiResponse>(API.BATCH_SUMMARY(id));
    return res.data;
  },

  async delete(id: number): Promise<ApiResponse> {
    const res = await api.delete<ApiResponse>(API.BATCH_BY_ID(id));
    return res.data;
  },

  async getFunds(id: number): Promise<ApiResponse> {
    const res = await api.get<ApiResponse>(API.BATCH_FUNDS(id));
    return res.data;
  },

  async getEmailLogs(id: number): Promise<ApiResponse> {
    const res = await api.get<ApiResponse>(API.BATCH_EMAIL_LOGS(id));
    return res.data;
  },

  async getHistory(id: number): Promise<ApiResponse> {
    try {
      console.log(`[batchService] Fetching history for batch ${id}`);
      const res = await api.get<ApiResponse>(`/batches/${id}/history`);
      console.log(`[batchService] History response status:`, res.status);
      console.log(`[batchService] History response data:`, res.data);
      return res.data;
    } catch (error) {
      console.error(`[batchService] Error fetching history for batch ${id}:`, error);
      throw error;
    }
  },
};
