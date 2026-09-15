"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createReceipt,
  getReceipt,
  getReceipts,
  type GetReceiptsParams,
  type ReceiptCreate,
} from "@/features/receipts/api";

export const receiptsQueryKey = [
  "receipts",
];

export function useReceipts(
  params: GetReceiptsParams = {},
  enabled = true,
) {
  return useQuery({
    queryKey: [
      ...receiptsQueryKey,
      params,
    ],
    queryFn: () =>
      getReceipts(params),
    enabled,
    staleTime:
      5 * 60 * 1000,
    retry: 1,
  });
}

export function useReceipt(
  receiptId?: string,
  enabled = true,
) {
  return useQuery({
    queryKey: [
      "receipt",
      receiptId,
    ],
    queryFn: () =>
      getReceipt(
        receiptId as string,
      ),
    enabled:
      Boolean(receiptId) &&
      enabled,
    staleTime:
      5 * 60 * 1000,
    retry: 1,
  });
}

export function useCreateReceipt() {
  const queryClient =
    useQueryClient();

  return useMutation({
    mutationFn: ({
      templeId,
      data,
    }: {
      templeId: string;
      data: ReceiptCreate;
    }) =>
      createReceipt(
        templeId,
        data,
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey:
          receiptsQueryKey,
      });
    },
  });
}
