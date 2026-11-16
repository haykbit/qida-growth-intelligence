import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@qida/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, createHashRouter, Navigate, RouterProvider } from "react-router-dom";
import { AppLayout } from "./components/layout";
import { DataSchemaPage } from "./pages/data-schema";
import { LandingDemoPage } from "./pages/landing-demo";
import { LandingObservatoryPage, LandingRecordPage } from "./pages/landing-observatory";
import { MeasurementCenterPage } from "./pages/measurement-center";
import { NotFoundPage } from "./pages/not-found";
import { OpportunitiesPage, OpportunityDetailPage } from "./pages/opportunities";
import { PlanningPage } from "./pages/planning";
import { FilterProvider } from "./state/filters";
import "./styles.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });
const routes = [
  { path: "/", element: <AppLayout />, children: [
    { index: true, element: <LandingObservatoryPage /> },
    { path: "landing", element: <LandingRecordPage /> },
    { path: "measurement", element: <MeasurementCenterPage /> },
    { path: "planning", element: <PlanningPage /> },
    { path: "data-model", element: <DataSchemaPage /> },
    { path: "plays", element: <Navigate replace to="/" /> },
    { path: "plays/:municipalityId/:service", element: <Navigate replace to="/" /> },
    { path: "opportunities", element: <OpportunitiesPage /> },
    { path: "opportunities/:municipalityId/:service", element: <OpportunityDetailPage /> },
    { path: "landings", element: <Navigate replace to="/" /> },
    { path: "learning", element: <Navigate replace to="/measurement" /> },
    { path: "*", element: <NotFoundPage /> },
  ] },
  { path: "/demo/:municipalityId/:service", element: <LandingDemoPage /> },
];
const router = import.meta.env.VITE_STATIC_DEMO === "true" ? createHashRouter(routes) : createBrowserRouter(routes);

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(<StrictMode><QueryClientProvider client={queryClient}><TooltipProvider delayDuration={250}><FilterProvider><RouterProvider router={router} /></FilterProvider></TooltipProvider></QueryClientProvider></StrictMode>);
