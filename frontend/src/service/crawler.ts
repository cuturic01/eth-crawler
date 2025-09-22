import axios from "axios";

export type RawTx = {
  hash: string;
  blockNumber: number;
  timeStamp: string;
  from: string;
  to: string;
  value: string;           
};

export type GetTxsResponse = {
  items: RawTx[];
  page: number;
  pageSize: number;
  total: number;
  cached?: boolean;
};

export async function getTransactions(
  address: string,
  opts: { startBlock?: number; endBlock?: number; page?: number; pageSize?: number } = {}
): Promise<GetTxsResponse> {
  const { startBlock = 0, endBlock = 99_999_999, page = 1, pageSize = 10 } = opts;
  const { data } = await axios.get<GetTxsResponse>(`http://localhost:8080/api/${address.trim()}`, {
    params: { startBlock, endBlock, page, pageSize },
  });
  console.log("data", data);
  return data;
}
