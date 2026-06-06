import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";

export const router = createBrowserRouter([
    {
        path: "/auth",
        element: <AuthPage />
    },
    {
        path: "/dashboard",
        element: <DashboardPage />
    },
    {
        index: true,
        element: <Navigate to="/auth" replace />
    }
])