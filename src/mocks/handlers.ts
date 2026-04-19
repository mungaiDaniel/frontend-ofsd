import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { mockFunds, mockClasses, mockFundSummary } from './data/funds';
import { mockBatches, mockBatchDetail } from './data/batches';
import { mockInvestors, mockInvestorLookup, mockInvestorOverview } from './data/investors';
import { mockValuationPreview } from './data/valuations';
import { mockTransactions, mockEligibleInvestors, mockReportRuns, mockReportRunDetails } from './data/reports';
import { mockWithdrawals } from './data/withdrawals';

const DELAY = 400;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function makeResponse(data: unknown, status = 200): AxiosResponse {
  return {
    data: { status, data },
    status,
    statusText: 'OK',
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}

function matchPath(url: string, pattern: RegExp): RegExpMatchArray | null {
  return url.match(pattern);
}

export function setupMockHandlers(axiosInstance: AxiosInstance) {
  axiosInstance.interceptors.request.use(async (config) => {
    const url = config.url ?? '';
    const method = (config.method ?? 'get').toLowerCase();

    // ── Funds summary ──
    if (url.includes('/funds/summary')) {
      console.log('[MOCK] GET /api/v1/funds/summary → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockFundSummary) });
    }

    // ── Fund classes ──
    const classMatch = matchPath(url, /\/funds\/(\d+)\/classes/);
    if (classMatch && method === 'get') {
      const fundId = Number(classMatch[1]);
      console.log(`[MOCK] GET /api/v1/funds/${fundId}/classes → returning mock data`);
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockClasses[fundId] ?? []) });
    }

    // ── Funds list ──
    if (url.match(/\/funds$/) && method === 'get') {
      console.log('[MOCK] GET /api/v1/funds → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockFunds) });
    }

    // ── Batch detail ──
    const batchDetailMatch = matchPath(url, /\/batches\/(\d+)$/);
    if (batchDetailMatch && method === 'get') {
      const batchId = Number(batchDetailMatch[1]);
      console.log(`[MOCK] GET /api/v1/batches/${batchId} → returning mock data`);
      await delay(DELAY);
      const detail = mockBatchDetail[batchId] ?? mockBatches.find((b) => b.id === batchId);
      if (!detail) throw Object.assign(new Error('mock'), { __mock__: { data: { status: 404, message: 'Batch not found' }, status: 404, statusText: 'Not Found', headers: {}, config: {} as InternalAxiosRequestConfig } });
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(detail) });
    }

    // ── Batch list ──
    if (url.match(/\/batches$/) && method === 'get') {
      console.log('[MOCK] GET /api/v1/batches → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockBatches) });
    }

    // ── Investor overview ──
    const investorOverviewMatch = matchPath(url, /\/investors\/([^/]+)\/overview$/);
    if (investorOverviewMatch && method === 'get') {
      const code = investorOverviewMatch[1];
      console.log(`[MOCK] GET /api/v1/investors/${code}/overview → returning mock data`);
      await delay(DELAY);
      const found = code ? (mockInvestorOverview[code.toUpperCase()] ?? mockInvestorOverview[code]) : undefined;
      if (!found) throw Object.assign(new Error('mock'), { __mock__: { data: { status: 404, message: 'Investor not found' }, status: 404, statusText: 'Not Found', headers: {}, config: {} as InternalAxiosRequestConfig } });
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(found) });
    }

    // ── Investor lookup by code ──
    const investorCodeMatch = matchPath(url, /\/investors\/([^/]+)$/);
    if (investorCodeMatch && method === 'get') {
      const code = investorCodeMatch[1];
      console.log(`[MOCK] GET /api/v1/investors/${code} → returning mock data`);
      await delay(DELAY);
      const found = code ? (mockInvestorLookup[code.toUpperCase()] ?? mockInvestorLookup[code]) : undefined;
      if (!found) throw Object.assign(new Error('mock'), { __mock__: { data: { status: 404, message: 'Investor not found' }, status: 404, statusText: 'Not Found', headers: {}, config: {} as InternalAxiosRequestConfig } });
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(found) });
    }

    // ── Investors list ──
    if (url.match(/\/investors$/) && method === 'get') {
      console.log('[MOCK] GET /api/v1/investors → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockInvestors) });
    }

    // ── Add investor ──
    if (url.match(/\/investors$/) && method === 'post') {
      console.log('[MOCK] POST /api/v1/investors → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse({ investment_id: 99, batch_id: 1, batch_name: "AXM_KES_I_2026-04-23", fund_name: "Axiom", class_code: "KES_I", currency: "KES", deposit_amount: 1000000, batch_close_at: "2026-04-23T09:00:00+03:00" }, 201) });
    }

    // ── Add existing investor ──
    if (url.includes('/investors/existing') && method === 'post') {
      console.log('[MOCK] POST /api/v1/investors/existing → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse({ investment_id: 100, batch_id: 1, batch_name: "AXM_KES_I_2026-04-23", fund_name: "Axiom", class_code: "KES_I", currency: "KES", deposit_amount: 500000, batch_close_at: "2026-04-23T09:00:00+03:00" }, 201) });
    }

    // ── Valuation preview ──
    if (url.includes('/valuation/preview') && method === 'post') {
      console.log('[MOCK] POST /api/v1/valuation/preview → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockValuationPreview) });
    }

    // ── Valuation commit ──
    if (url.includes('/valuation/nav') && method === 'post') {
      console.log('[MOCK] POST /api/v1/valuation/nav → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockValuationPreview) });
    }

    // ── Reports: eligible investors ──
    if (url.includes('/reports/eligible-investors') && method === 'get') {
      console.log('[MOCK] GET /api/v1/reports/eligible-investors → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockEligibleInvestors) });
    }

    // ── Reports: run detail ──
    const reportRunDetailMatch = matchPath(url, /\/reports\/runs\/(\d+)$/);
    if (reportRunDetailMatch && method === 'get') {
      const runId = Number(reportRunDetailMatch[1]);
      console.log(`[MOCK] GET /api/v1/reports/runs/${runId} → returning mock data`);
      await delay(DELAY);
      const detail = mockReportRunDetails[runId];
      if (!detail) throw Object.assign(new Error('mock'), { __mock__: { data: { status: 404, message: 'Report run not found' }, status: 404, statusText: 'Not Found', headers: {}, config: {} as InternalAxiosRequestConfig } });
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(detail) });
    }

    // ── Reports: runs list ──
    if (url.includes('/reports/runs') && method === 'get') {
      console.log('[MOCK] GET /api/v1/reports/runs → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockReportRuns) });
    }

    // ── Reports: generate ──
    if (url.includes('/reports/generate') && method === 'post') {
      console.log('[MOCK] POST /api/v1/reports/generate → returning mock data');
      await delay(800);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse({ report_run_id: Date.now() % 1000 + 10 }, 201) });
    }

    // ── Reports: preview ──
    if (url.includes('/reports/preview') && method === 'get') {
      console.log('[MOCK] GET /api/v1/reports/preview → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse({ preview_url: null }) });
    }

    // ── Recent transactions ──
    if (url.includes('/transactions/recent') && method === 'get') {
      console.log('[MOCK] GET /api/v1/transactions/recent → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockTransactions) });
    }

    // ── Withdrawals ──
    if (url.match(/\/withdrawals$/) && method === 'get') {
      console.log('[MOCK] GET /api/v1/withdrawals → returning mock data');
      await delay(DELAY);
      throw Object.assign(new Error('mock'), { __mock__: makeResponse(mockWithdrawals) });
    }

    return config;
  });

  // Intercept the thrown mock errors and return them as responses
  axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.__mock__) return Promise.resolve(error.__mock__);
      return Promise.reject(error);
    }
  );
}
