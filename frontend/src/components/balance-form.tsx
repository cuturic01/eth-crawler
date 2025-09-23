import { useEffect, useState } from "react";
import {
	Box,
	Paper,
	Stack,
	TextField,
	Button,
	Typography,
	Autocomplete,
	Alert,
	Chip,
	Divider,
} from "@mui/material";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { fetchTokenMap } from "../service/eth";
import { formatEther } from "ethers";
import { getBalanceAt } from "../service/crawler";

const isEthAddress = (v?: string) => /^0x[a-fA-F0-9]{40}$/.test(v ?? "");

const validationSchema = Yup.object({
	address: Yup.string()
		.trim()
		.required("Address is required")
		.test(
			"is-eth",
			"Enter a valid Ethereum address (0x…40 hex chars)",
			isEthAddress
		),
	date: Yup.date()
		.typeError("Invalid date")
		.required("Date is required")
		.max(new Date(), "Date cannot be in the future"),
	symbol: Yup.string().trim().required("Token symbol is required"),
});

type FormValues = {
	address: string;
	date: string;
	symbol: string;
};

export default function BalanceForm() {
	const [tokenMap, setTokenMap] = useState<Record<string, string>>({});
	const [symbols, setSymbols] = useState<string[]>([]);
	const [result, setResult] = useState<{
		token: string;
		address: string;
		dateUTC: string;
		blockAtDate: number;
		balanceDisplay: string;
		contractAddress?: string;
	} | null>(null);
	const [error, setError] = useState<string | null>(null);
	const today = new Date().toISOString().split("T")[0];

	useEffect(() => {
		(async () => {
			try {
				const m = await fetchTokenMap();
				const withEth = { ETH: "0x", ...m };
				setTokenMap(withEth);
				setSymbols(Object.keys(withEth).sort());
			} catch (e) {
				console.error("Failed to load token list:", e);
			}
		})();
	}, []);

	const initialValues: FormValues = {
		address: "",
		date: "",
		symbol: "",
	};

	const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
		setError(null);
		setResult(null);
		try {
			const sym = (values.symbol || "").trim().toUpperCase();
			const addr = values.address.trim();
			const dateISO = values.date;

			if (sym === "ETH") {
				const resp = await getBalanceAt(addr, dateISO);
				const balanceDisplay = formatEther(resp.balance);
				setResult({
					token: "ETH",
					address: resp.address,
					dateUTC: resp.dateUTC,
					blockAtDate: resp.blockAtDate,
					balanceDisplay,
					contractAddress: "-",
				});
			} else {
				const resp = await getBalanceAt(addr, dateISO, tokenMap[sym]);
				console.log(resp);
				setResult({
					token: sym,
					address: resp.address,
					dateUTC: resp.dateUTC,
					blockAtDate: resp.blockAtDate,
					balanceDisplay: parseFloat(resp.balance).toFixed(6),
					contractAddress: tokenMap[sym],
				});
			}
		} catch (e: any) {
			setError(e?.message ?? "Failed to fetch balance");
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Box sx={{ p: { xs: 2, sm: 3 }, width: "60%", mx: "auto" }}>
			<Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
				<Typography variant="h5" fontWeight={700} mb={2}>
					Query Balance
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
						values,
						setFieldValue,
					}) => (
						<Form noValidate>
							<Stack spacing={2}>
								<Field
									as={TextField}
									name="address"
									label="Ethereum Address"
									placeholder="0x…"
									fullWidth
									required
									error={
										touched.address &&
										Boolean(errors.address)
									}
									helperText={
										touched.address && errors.address
											? errors.address
											: " "
									}
									inputProps={{ spellCheck: false }}
								/>

								<Field
									as={TextField}
									name="date"
									label="Date"
									type="date"
									fullWidth
									required
									InputLabelProps={{ shrink: true }}
									inputProps={{ max: today }}
									error={touched.date && Boolean(errors.date)}
									helperText={
										touched.date && errors.date
											? errors.date
											: " "
									}
								/>

								<Autocomplete
									freeSolo
									options={[
										"ETH",
										...symbols.filter((s) => s !== "ETH"),
									]}
									value={values.symbol}
									onInputChange={(_, newVal) =>
										setFieldValue(
											"symbol",
											(newVal || "").toUpperCase()
										)
									}
									onChange={(_, newVal) =>
										setFieldValue(
											"symbol",
											(
												(newVal as string) || ""
											).toUpperCase()
										)
									}
									renderInput={(params) => (
										<TextField
											{...params}
											name="symbol"
											label="Token Symbol"
											placeholder="e.g. ETH, USDC, DAI…"
											required
											error={
												touched.symbol &&
												Boolean(errors.symbol)
											}
											helperText={
												touched.symbol && errors.symbol
													? errors.symbol
													: " "
											}
										/>
									)}
								/>

								<Button
									type="submit"
									variant="contained"
									disableElevation
									disabled={isSubmitting}
									sx={{ minHeight: "48px" }}
								>
									{isSubmitting
										? "Submitting…"
										: "Check Balance"}
								</Button>

								{error && (
									<Alert severity="error">{error}</Alert>
								)}
								{result && (
									<Paper
										variant="outlined"
										sx={{
											p: 2.5,
											borderRadius: 2,
											borderColor: (t) =>
												t.palette.divider,
											bgcolor: (t) =>
												t.palette.mode === "dark"
													? "background.paper"
													: "background.default",
										}}
									>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												mb: 1,
											}}
										>
											<Typography
												variant="subtitle1"
												fontWeight={600}
											>
												Result
											</Typography>
											<Chip
												size="small"
												label={result.token ?? "—"}
												sx={{ fontWeight: 600 }}
											/>
										</Box>

										<Divider sx={{ mb: 1.5 }} />

										<Stack spacing={1.0}>
											<Box>
												<Typography
													variant="caption"
													color="text.secondary"
												>
													Contract
												</Typography>
												<Typography
													variant="body2"
													sx={{
														fontFamily:
															"ui-monospace, SFMono-Regular, Menlo, monospace",
														wordBreak: "break-all",
													}}
												>
													{result.contractAddress ??
														"(native)"}
												</Typography>
											</Box>

											<Box>
												<Typography
													variant="caption"
													color="text.secondary"
												>
													Address
												</Typography>
												<Typography
													variant="body2"
													sx={{
														fontFamily:
															"ui-monospace, SFMono-Regular, Menlo, monospace",
														wordBreak: "break-all",
													}}
												>
													{result.address}
												</Typography>
											</Box>

											<Box
												sx={{ display: "flex", gap: 3 }}
											>
												<Box>
													<Typography
														variant="caption"
														color="text.secondary"
													>
														Date (UTC)
													</Typography>
													<Typography variant="body2">
														{result.dateUTC}
													</Typography>
												</Box>
												<Box>
													<Typography
														variant="caption"
														color="text.secondary"
													>
														Block @ Date
													</Typography>
													<Typography
														variant="body2"
														sx={{
															fontFamily:
																"ui-monospace, SFMono-Regular, Menlo, monospace",
														}}
													>
														{result.blockAtDate}
													</Typography>
												</Box>
											</Box>
										</Stack>

										<Box
											sx={{
												mt: 1.75,
												p: 1.25,
												borderRadius: 1.5,
												bgcolor: (t) =>
													t.palette.mode === "dark"
														? "rgba(255,255,255,0.04)"
														: "rgba(0,0,0,0.03)",
												display: "flex",
												alignItems: "baseline",
												justifyContent: "space-between",
												gap: 1,
											}}
										>
											<Typography
												variant="caption"
												color="text.secondary"
											>
												Balance
											</Typography>
											<Typography
												variant="h6"
												sx={{
													fontVariantNumeric:
														"tabular-nums",
												}}
											>
												{result.balanceDisplay}{" "}
												{result.token === "ETH"
													? "ETH"
													: result.token}
											</Typography>
										</Box>
									</Paper>
								)}
							</Stack>
						</Form>
					)}
				</Formik>
			</Paper>
		</Box>
	);
}
