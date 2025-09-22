import { Container, Divider, Typography } from "@mui/material";

export default function Balance() {
	return (
		<Container
			maxWidth="md"
			sx={{
				mt: 5,
                width: "50%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
			}}
		>
			<Typography
				variant="h2"
				fontWeight={600}
				gutterBottom
				fontSize={30}
			>
				Balance
			</Typography>

			<Divider sx={{ mb: 3, width: "100%" }} />
		</Container>
	);
}
