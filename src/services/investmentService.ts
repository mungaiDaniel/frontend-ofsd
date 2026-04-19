import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, CreateInvestmentRequest } from "@/lib/types";

export const investmentService = {
  async create(data: CreateInvestmentRequest): Promise<ApiResponse> {
    const res = await api.post<ApiResponse>(API.INVESTMENTS, data);
    return res.data;
  },

  async getInvestorDirectory(): Promise<ApiResponse> {
    const res = await api.get<ApiResponse>(API.INVESTOR_DIRECTORY);
    return res.data;
  },

  async getInvestorOverview(clientCode: string): Promise<ApiResponse> {
    const code = encodeURIComponent(clientCode);
    const res = await api.get<ApiResponse>(`/investors/${code}/overview`);
    return res.data;
  },

  async getInvestorPortfolio(clientCode: string): Promise<ApiResponse> {
    const code = encodeURIComponent(clientCode);
    const res = await api.get<ApiResponse>(`/investors/${code}/portfolio`);
    return res.data;
  },

  async getInvestorHistory(clientCode: string): Promise<ApiResponse> {
    const code = encodeURIComponent(clientCode);
    const res = await api.get<ApiResponse>(`/investors/${code}/history`);
    return res.data;
  },

  async getInvestorStatements(clientCode: string): Promise<ApiResponse> {
    const code = encodeURIComponent(clientCode);
    // ✅ FIX: Call plural /statements endpoint which includes deposits, monthly reports, and withdrawals
    const res = await api.get<ApiResponse>(`/investors/${code}/statements`);
    return res.data;
  },

  async getInvestorEmailLogs(clientCode: string): Promise<ApiResponse> {
    const res = await api.get<ApiResponse>(API.INVESTOR_EMAIL_LOGS(clientCode));
    return res.data;
  },

  async downloadInvestorStatementPdf(clientCode: string): Promise<void> {
    const normalizedClientCode = decodeURIComponent(clientCode);
    const res = await api.get(`${API.INVESTOR_STATEMENT_PDF_CLIENT(normalizedClientCode)}`, {
      responseType: 'blob',
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `investor-statement-${normalizedClientCode}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode?.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  async getRecentNotifications(): Promise<ApiResponse> {
    const res = await api.get<ApiResponse>(API.RECENT_NOTIFICATIONS);
    return res.data;
  },

  async getNotificationFailures(notificationId: number): Promise<ApiResponse> {
    const res = await api.get<ApiResponse>(`/batches/notifications/recent/${notificationId}/failures`);
    return res.data;
  },
};
