import { useEffect, useMemo, useState } from "react";
import {
	Box,
	Paper,
	Stack,
	TextField,
	Button,
	Typography,
	InputAdornment,
	TableContainer,
	Table,
	TableHead,
	TableRow,
	TableCell,
	TableBody,
	IconButton,
	Tooltip,
	Snackbar,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import {
	getTransactions,
	type GetTxsResponse,
	type RawTx,
} from "../service/crawler";

const isEthAddress = (v?: string) => /^0x[a-fA-F0-9]{40}$/.test(v ?? "");
const shorten = (s: string, start = 4, end = 4) =>
	s.length > start + end ? `${s.slice(0, start)}…${s.slice(-end)}` : s;

const formatDate = (timeStamp: string | number) => {
	const sec = typeof timeStamp === "string" ? Number(timeStamp) : timeStamp;
	return new Date(sec * 1000).toLocaleString("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	});
};

const formatEth = (wei: string | number) => {
	const n = typeof wei === "number" ? wei : Number(wei);
	return (n / 1e18).toFixed(6);
};

const validationSchema = Yup.object({
	address: Yup.string()
		.trim()
		.required("Address is required")
		.test(
			"is-eth",
			"Enter a valid Ethereum address (0x…40 hex chars)",
			isEthAddress
		),
	startBlock: Yup.number()
		.typeError("Block must be a number")
		.integer("Block must be an integer")
		.min(0, "Block must be ≥ 0")
		.required("Starting block is required"),
});

type FormValues = {
	address: string;
	startBlock: number | "";
};

type UiTx = {
	hash: string;
	blockNumber: number;
	timestamp: string;
	from: string;
	to: string;
	ethAmount: string;
};

const PAGE_SIZE = 10;

export default function TransactionList() {
	const initialValues: FormValues = useMemo(
		() => ({
			address: "",
			startBlock: "",
		}),
		[]
	);

	const [query, setQuery] = useState<{
		address: string;
		startBlock: number;
	} | null>(null);

	const [page, setPage] = useState(0);

	// data
	const [rows, setRows] = useState<UiTx[]>([]);
	const [total, setTotal] = useState(0);
	const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

	// ui state
	const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [errorMsg, setErrorMsg] = useState<string | null>(null);

	const handleCopy = async (text: string, label: string) => {
		try {
			await navigator.clipboard.writeText(text);
			setCopiedLabel(`${label} copied`);
		} catch {
			setCopiedLabel("Copy failed");
		}
	};

	const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
		try {
			const startBlock =
				typeof values.startBlock === "number"
					? values.startBlock
					: Number(values.startBlock);
			setQuery({ address: values.address.trim(), startBlock });
			setPage(0);
		} finally {
			setSubmitting(false);
		}
	};

	useEffect(() => {
		const fetchPage = async () => {
			if (!query) {
				setRows([]);
				setTotal(0);
				return;
			}
			setLoading(true);
			setErrorMsg(null);
			try {
				const resp: GetTxsResponse = await getTransactions(
					query.address,
					{
						startBlock: query.startBlock,
						endBlock: 99_999_999,
						page: page + 1,
						pageSize: PAGE_SIZE,
					}
				);

				const uiRows: UiTx[] = resp.items.map((t: RawTx) => ({
					hash: t.hash,
					blockNumber: t.blockNumber,
					timestamp: t.timeStamp,
					from: t.from,
					to: t.to,
					ethAmount: formatEth(t.value),
				}));

				setRows(uiRows);
				setTotal(resp.total ?? uiRows.length);
			} catch (e: any) {
				setErrorMsg(e?.message ?? "Failed to fetch transactions");
				setRows([]);
				setTotal(0);
			} finally {
				setLoading(false);
			}
		};

		fetchPage();
	}, [query, page]);

	return (
		<Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1100, mx: "auto" }}>
			<Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: 3 }}>
				<Stack spacing={3}>
					<Typography variant="h5" fontWeight={700}>
						Search Transactions
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Enter a wallet address and the starting block to list
						transactions.
					</Typography>

					<Formik
						initialValues={initialValues}
						validationSchema={validationSchema}
						onSubmit={handleSubmit}
						validateOnBlur
						validateOnChange
					>
						{({
							errors,
							touched,
							isSubmitting,
							isValid,
							values,
							setFieldValue,
						}) => (
							<Form noValidate>
								<Stack spacing={2}>
									<Stack
										direction={{ xs: "column", sm: "row" }}
										spacing={2}
										alignItems="flex-start"
									>
										<Field
											as={TextField}
											name="address"
											label="Ethereum Address"
											placeholder="0x…"
											fullWidth
											required
											value={values.address}
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>
											) => {
												setFieldValue(
													"address",
													e.target.value.trim()
												);
											}}
											error={
												touched.address &&
												Boolean(errors.address)
											}
											helperText={
												touched.address &&
												errors.address
													? errors.address
													: " "
											}
											inputProps={{ spellCheck: false }}
										/>

										<Field
											as={TextField}
											name="startBlock"
											label="Starting Block"
											placeholder="e.g. 9000000"
											required
											type="number"
											value={values.startBlock}
											onChange={(
												e: React.ChangeEvent<HTMLInputElement>
											) => {
												const raw = e.target.value;
												if (raw === "")
													return setFieldValue(
														"startBlock",
														""
													);
												const n = Math.max(
													0,
													Math.floor(Number(raw))
												);
												setFieldValue(
													"startBlock",
													Number.isNaN(n) ? "" : n
												);
											}}
											error={
												touched.startBlock &&
												Boolean(errors.startBlock)
											}
											helperText={
												touched.startBlock &&
												errors.startBlock
													? errors.startBlock
													: " "
											}
											inputProps={{
												min: 0,
												step: 1,
												inputMode: "numeric",
												pattern: "[0-9]*",
											}}
											InputProps={{
												endAdornment: (
													<InputAdornment position="end">
														block
													</InputAdornment>
												),
											}}
											sx={{
												"& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button":
													{
														WebkitAppearance:
															"none",
														margin: 0,
													},
												"& input[type=number]": {
													MozAppearance: "textfield",
												},
											}}
										/>

										<Button
											type="submit"
											variant="contained"
											size="medium"
											disableElevation
											disabled={
												isSubmitting ||
												!isValid ||
												loading
											}
											sx={{
												minWidth: {
													xs: "100%",
													sm: 140,
												},
												minHeight: "56px",
												maxHeight: "56px",
												alignSelf: "stretch",
											}}
										>
											{isSubmitting || loading
												? "Searching…"
												: "Search"}
										</Button>
									</Stack>
								</Stack>
							</Form>
						)}
					</Formik>
				</Stack>
			</Paper>

			<Paper elevation={2}>
				<TableContainer sx={{ maxHeight: 420, overflowY: "auto" }}>
					<Table size="medium" aria-label="transactions table">
						<TableHead>
							<TableRow>
								<TableCell>Transaction Hash</TableCell>
								<TableCell align="right">Block</TableCell>
								<TableCell>Date</TableCell>
								<TableCell>From</TableCell>
								<TableCell>To</TableCell>
								<TableCell align="right">
									Amount (ETH)
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{rows.map((tx) => (
								<TableRow key={tx.hash} hover>
									<TableCell
										sx={{
											maxWidth: 240,
											whiteSpace: "nowrap",
											textOverflow: "ellipsis",
											overflow: "hidden",
										}}
									>
										<Stack
											direction="row"
											alignItems="center"
											spacing={1}
										>
											<Typography
												variant="body2"
												sx={{ fontFamily: "monospace" }}
											>
												{shorten(tx.hash, 4, 4)}
											</Typography>
											<Tooltip title="Copy transaction hash">
												<IconButton
													size="small"
													onClick={() =>
														handleCopy(
															tx.hash,
															"Hash"
														)
													}
													aria-label="Copy transaction hash"
												>
													<ContentCopyIcon fontSize="inherit" />
												</IconButton>
											</Tooltip>
										</Stack>
									</TableCell>

									<TableCell align="right">
										{tx.blockNumber}
									</TableCell>
									<TableCell>
										{formatDate(tx.timestamp)}
									</TableCell>

									<TableCell>
										<Stack
											direction="row"
											alignItems="center"
											spacing={1}
										>
											<Typography
												variant="body2"
												sx={{ fontFamily: "monospace" }}
											>
												{shorten(tx.from)}
											</Typography>
											<Tooltip title="Copy sender address">
												<IconButton
													size="small"
													onClick={() =>
														handleCopy(
															tx.from,
															"Sender"
														)
													}
													aria-label="Copy sender address"
												>
													<ContentCopyIcon fontSize="inherit" />
												</IconButton>
											</Tooltip>
										</Stack>
									</TableCell>

									<TableCell>
										<Stack
											direction="row"
											alignItems="center"
											spacing={1}
										>
											<Typography
												variant="body2"
												sx={{ fontFamily: "monospace" }}
											>
												{shorten(tx.to)}
											</Typography>
											<Tooltip title="Copy receiver address">
												<IconButton
													size="small"
													onClick={() =>
														handleCopy(
															tx.to,
															"Receiver"
														)
													}
													aria-label="Copy receiver address"
												>
													<ContentCopyIcon fontSize="inherit" />
												</IconButton>
											</Tooltip>
										</Stack>
									</TableCell>

									<TableCell align="right">
										{tx.ethAmount}
									</TableCell>
								</TableRow>
							))}

							{rows.length === 0 && !loading && (
								<TableRow>
									<TableCell
										colSpan={6}
										align="center"
										sx={{ py: 6, color: "text.secondary" }}
									>
										{query
											? "No transactions to display"
											: "Enter a query to search"}
									</TableCell>
								</TableRow>
							)}
							{loading && (
								<TableRow>
									<TableCell
										colSpan={6}
										align="center"
										sx={{ py: 6, color: "text.secondary" }}
									>
										Loading…
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>

				<Stack
					direction="row"
					justifyContent="space-between"
					alignItems="center"
					sx={{ px: 2, py: 1.5 }}
				>
					<Typography variant="body2" color="text.secondary">
						Page {Math.min(page + 1, totalPages)} of {totalPages} •{" "}
						{total} total
					</Typography>
					<Stack direction="row" spacing={1}>
						<Button
							variant="outlined"
							size="small"
							disabled={page === 0 || loading || !query}
							onClick={() => setPage((p) => Math.max(0, p - 1))}
						>
							Previous
						</Button>
						<Button
							variant="outlined"
							size="small"
							disabled={
								page + 1 >= totalPages || loading || !query
							}
							onClick={() =>
								setPage((p) => Math.min(totalPages - 1, p + 1))
							}
						>
							Next
						</Button>
					</Stack>
				</Stack>
			</Paper>

			<Snackbar
				open={Boolean(copiedLabel)}
				autoHideDuration={1800}
				onClose={() => setCopiedLabel(null)}
				message={copiedLabel ?? ""}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			/>
			<Snackbar
				open={Boolean(errorMsg)}
				autoHideDuration={2600}
				onClose={() => setErrorMsg(null)}
				message={errorMsg ?? ""}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
				ContentProps={{ sx: { backgroundColor: "error.main" } }}
			/>
		</Box>
	);
}
