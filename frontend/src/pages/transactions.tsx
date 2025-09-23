import { Container, Divider, Typography } from "@mui/material";
import TransactionList from "../components/transaction-list";

export default function Transactions() {
	return (
		<Container
			sx={{
				mt: 5,
                width: "50%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
			}}
		>
			<Typography variant="h2" fontWeight={600} gutterBottom fontSize={30}>
				Transactions
			</Typography>

			<Divider sx={{ mb: 3, width: "100%"}} />

            <TransactionList/>
		</Container>
	);
}
