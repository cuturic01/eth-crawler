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
	opts: {
		startBlock?: number;
		endBlock?: number;
		page?: number;
		pageSize?: number;
	} = {}
): Promise<GetTxsResponse> {
	const {
		startBlock = 0,
		endBlock = 99_999_999,
		page = 1,
		pageSize = 10,
	} = opts;
	const { data } = await axios.get<GetTxsResponse>(
		`http://localhost:8080/api/${address.trim()}`,
		{
			params: { startBlock, endBlock, page, pageSize },
		}
	);
	console.log("data", data);
	return data;
}

export type BalanceAtResponse = {
	address: string;
	token: string;
	dateUTC: string;
	blockAtDate: number;
	balance: string;
};


export async function getBalanceAt(
	address: string,
	dateISO: string,
	token?: string
): Promise<BalanceAtResponse> {
	const res = await axios.get<
		BalanceAtResponse | { error: string; detail?: string }
	>(`http://localhost:8080/api/balance-at/${address}`, {
		params: { date: dateISO, ...(token ? { token } : {}) },
		validateStatus: () => true,
	});

	if (res.status < 200 || res.status >= 300) {
		const msg =
			(res.data as any)?.error || res.statusText || `HTTP ${res.status}`;
		const detail = (res.data as any)?.detail;
		throw new Error(detail ? `${msg}: ${detail}` : msg);
	}

	return res.data as BalanceAtResponse;
}
