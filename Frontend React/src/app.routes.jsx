import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyzePage from "./pages/AnalyzePage";

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
        path: "/analyze/:resumeId",
        element: <AnalyzePage />
    },
    {
        index: true,
        element: <Navigate to="/auth" replace />
    }
])