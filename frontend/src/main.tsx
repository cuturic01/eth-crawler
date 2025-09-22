import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@emotion/react";
import theme from "./theme.ts";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Navbar from "./components/navbar.tsx";
import { CssBaseline } from "@mui/material";
import Transactions from "./pages/transactions.tsx";
import Balance from "./pages/balance.tsx";
import { Toaster } from "react-hot-toast";

const router = createBrowserRouter([
	{
		path: "/",
		element: <Navbar />,
		children: [
			{
				path: "/transactions",
				element: <Transactions />,
			},
			{
				path: "/balance",
				element: <Balance />,
			},
		],
	},
]);

createRoot(document.getElementById("root")!).render(
	<ThemeProvider theme={theme}>
		<CssBaseline />
		<RouterProvider router={router} />
		<Toaster
			position="bottom-center"
			toastOptions={{
				success: {
					style: {
						background: theme.palette.success.main,
					},
				},
				error: {
					style: {
						background: theme.palette.error.main,
						color: "#F5F5F5",
					},
				},
			}}
		/>
	</ThemeProvider>
);
