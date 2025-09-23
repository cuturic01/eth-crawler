import {
	AppBar,
	Box,
	Button,
	Toolbar,
	Typography,
} from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";
import {
	History,
    Balance,
} from "@mui/icons-material";
export default function Navbar() {
	const navigate = useNavigate();

	const navItems = [
		{ label: "Transactions", icon: <History />, path: "/transactions" },
		{ label: "Balance", icon: <Balance />, path: "/balance" },
	];

	return (
		<Box
			sx={{
				height: "100%",
				width: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<AppBar position="relative" sx={{ flex: "0 1 auto" }}>
				<Toolbar
					sx={{
						minHeight: "64px",
						px: 2,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					<Box
						onClick={() => navigate("/transactions")}
						sx={{
							display: "flex",
							alignItems: "center",
							cursor: "pointer",
							gap: 1,
							flex: "1 1 0%",
						}}
					>
						<img
							src="/ethereum.png"
							alt="Ethereum Logo"
							style={{
								height: 40,
								width: "auto",
							}}
						/>
						<Typography variant="h1" sx={{ color: "#F5F5F5", fontSize: "26px" }}>
							Eth crawler
						</Typography>
					</Box>

					<Box
						sx={{
							display: { xs: "none", md: "flex" },
							gap: 3,
							justifyContent: "center",
							alignItems: "center",
							flex: "1 1 0%",
						}}
					>
						{navItems.map((item) => (
							<Button
								key={item.label}
								startIcon={item.icon}
								onClick={() => navigate(item.path)}
								sx={{
									color: "#F5F5F5",
									textTransform: "capitalize",
								}}
							>
								{item.label}
							</Button>
						))}
					</Box>

					<Box
						sx={{
							display: "flex",
							justifyContent: "flex-end",
							alignItems: "center",
							flex: "1 1 0%",
						}}
					>
					</Box>
				</Toolbar>
			</AppBar>

			<div id="detail" style={{ flex: "1 1 auto", width: "100%" }}>
				<Outlet />
			</div>
		</Box>
	);
}
