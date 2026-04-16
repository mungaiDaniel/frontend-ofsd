import { useEffect, useState, useCallback } from "react";
import api from "@/services/api";
import { API } from "@/lib/constants";

export interface BatchReconciliationData {
  batch_id: number;
  lines: Array<Record<string, unknown>>;
  total_closing_aum: number;
  total_profit: number;
}

export function useBatchReconciliation(batchId: number | null) {
  const [reconciliation, setReconciliation] = useState<BatchReconciliationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!batchId) {
      setReconciliation(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.get(`${API.BATCH_RECONCILIATION(batchId)}`);
      if (response?.data?.status === 200 && response.data.data) {
        setReconciliation(response.data.data as BatchReconciliationData);
      } else {
        setError(response?.data?.message || "Failed to load batch reconciliation");
        setReconciliation(null);
      }
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to load batch reconciliation");
      setReconciliation(null);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { reconciliation, loading, error, refresh };
}
