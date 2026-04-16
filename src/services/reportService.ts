import api from "./api";
import { API } from "@/lib/constants";
import type { ApiResponse, ReportSummary, ReportDetail } from "@/lib/types";

export const reportService = {
  async getAll(fundId?: number): Promise<ReportSummary[]> {
    const url = fundId ? `${API.REPORTS}?fund_id=${fundId}` : API.REPORTS;
    const res = await api.get<ApiResponse<ReportSummary[]>>(url);
    return res.data.data ?? [];
  },

  async getById(id: number): Promise<ReportDetail> {
    const res = await api.get<ApiResponse<ReportDetail>>(API.REPORT_BY_ID(id));
    return res.data.data as ReportDetail;
  },

  async getPortfolio(asOf?: string): Promise<ApiResponse> {
    const url = asOf ? `${API.PORTFOLIO}?as_of=${asOf}` : API.PORTFOLIO;
    const res = await api.get<ApiResponse>(url);
    return res.data;
  },

  /** Downloads report PDF with proper authorization */
  async downloadPdf(id: number): Promise<void> {
    try {
      const res = await api.get(`${API.REPORT_PDF(id)}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
      throw error;
    }
  },

  /** Downloads investor statement PDF with proper authorization */
  async downloadInvestorStatement(email: string, batchId: number, valuationRunId?: number): Promise<void> {
    try {
      const query = new URLSearchParams();
      query.append('batch_id', String(batchId));
      if (valuationRunId) query.append('valuation_run_id', String(valuationRunId));
      const res = await api.get(`${API.INVESTOR_STATEMENT_PDF(email)}?${query.toString()}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `investor-statement-${email}-${batchId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download investor statement:', error);
      throw error;
    }
  },

  async downloadInvestorStatementByClientCode(
    clientCode: string,
    asOf?: string,
    options?: { periodOnly?: boolean }
  ): Promise<void> {
    try {
      const normalizedClientCode = decodeURIComponent(clientCode);
      const query = new URLSearchParams();
      if (asOf) query.set("as_of", asOf);
      if (options?.periodOnly) query.set("period_only", "1");
      const queryString = query.toString();
      const url = queryString
        ? `${API.INVESTOR_STATEMENT_PDF_CLIENT(normalizedClientCode)}?${queryString}`
        : API.INVESTOR_STATEMENT_PDF_CLIENT(normalizedClientCode);
      
      const res = await api.get(url, {
        responseType: 'blob'
      });
      const urlBlob = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', `investor-statement-${normalizedClientCode}${asOf ? '-' + asOf.split('T')[0] : ''}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error('Failed to download investor statement by client code:', error);
      throw error;
    }
  },

  async downloadWithdrawalReceipt(clientCode: string, withdrawalId: number): Promise<void> {
    try {
      const normalizedClientCode = decodeURIComponent(clientCode);
      const url = API.INVESTOR_WITHDRAWAL_PDF(normalizedClientCode, withdrawalId);
      const res = await api.get(url, {
        responseType: 'blob'
      });
      const urlBlob = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', `withdrawal-${withdrawalId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error('Failed to download withdrawal receipt:', error);
      throw error;
    }
  },

  async downloadDepositReceipt(clientCode: string, batchId: number): Promise<void> {
    try {
      const normalizedClientCode = decodeURIComponent(clientCode);
      const url = API.INVESTOR_DEPOSIT_PDF(normalizedClientCode, batchId);
      const res = await api.get(url, {
        responseType: 'blob'
      });
      const urlBlob = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = urlBlob;
      link.setAttribute('download', `deposit-${batchId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    } catch (error) {
      console.error('Failed to download deposit receipt:', error);
      throw error;
    }
  },

  async getInvestorStatement(batchId: number, email: string, valuationRunId?: number): Promise<any> {
    const query = new URLSearchParams();
    if (valuationRunId) query.append('valuation_run_id', String(valuationRunId));
    const url = `${API.INVESTOR_STATEMENT(batchId, email)}?${query.toString()}`;
    const res = await api.get<ApiResponse>(url);
    return res.data.data;
  },

  /** Verify hash chain integrity */
  async verifyHashChain(investorCode: string, fundName: string): Promise<ApiResponse> {
    const res = await api.get<ApiResponse>(API.VERIFY_HASH_CHAIN(investorCode, fundName));
    return res.data;
  },

  /** Downloads batch summary Excel with Authorization headers via Axios */
  async downloadBatchSummary(batchId: number): Promise<void> {
    try {
      const res = await api.get(`${API.BATCH_SUMMARY_EXCEL(batchId)}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `batch-${batchId}-summary.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download batch summary:', error);
      throw error;
    }
  },
};
