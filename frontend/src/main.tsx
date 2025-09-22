import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "@emotion/react";
import theme from "./theme.ts";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Navbar from "./components/navbar.tsx";
import { CssBaseline } from "@mui/material";
import Transactions from "./pages/transactions.tsx";
import Balance from "./pages/balance.tsx";

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
	</ThemeProvider>
);
