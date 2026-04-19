import api from "./api";
import { API } from "@/lib/constants";
import type {
  ApiResponse,
  InvestorLookup,
  AddNewInvestorRequest,
  AddExistingInvestorRequest,
  AddInvestorResponse,
} from "@/lib/types";

export const investorService = {
  async lookup(clientCode: string): Promise<InvestorLookup | null> {
    try {
      const res = await api.get<ApiResponse<InvestorLookup>>(
        API.INVESTOR_LOOKUP(clientCode)
      );
      return res.data.data ?? null;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },

  async addNew(data: AddNewInvestorRequest): Promise<AddInvestorResponse> {
    const res = await api.post<ApiResponse<AddInvestorResponse>>(
      API.INVESTORS_NEW,
      data
    );
    return res.data.data!;
  },

  async addExisting(data: AddExistingInvestorRequest): Promise<AddInvestorResponse> {
    const res = await api.post<ApiResponse<AddInvestorResponse>>(
      API.INVESTORS_EXISTING,
      data
    );
    return res.data.data!;
  },
};
