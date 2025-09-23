export async function fetchTokenMap(): Promise<Record<string, string>> {
	type Token = {
		chainId: number;
		address: string;
		symbol: string;
		decimals: number;
	};
	type TokenList = { tokens: Token[] };

	const url =
		"https://unpkg.com/@uniswap/default-token-list@latest/build/uniswap-default.tokenlist.json";

	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`Failed to fetch token list: ${res.status}`);
	}

	const data: TokenList = await res.json();
	const map: Record<string, string> = {};

	for (const t of data.tokens) {
		if (t.chainId !== 1) continue;
		const sym = t.symbol.trim().toUpperCase();
		const addr = t.address.trim();
		if (sym && addr) {
			map[sym] = addr;
		}
	}

	return map;
}
