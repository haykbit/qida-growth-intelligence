import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppLayout } from "./components/layout";
import { DataQualityPage } from "./pages/data-quality";
import { ExperimentDetailPage, ExperimentsPage } from "./pages/experiments";
import { FunnelPage } from "./pages/funnel";
import { JourneyDetailPage, JourneysPage } from "./pages/journeys";
import { LandingsPage } from "./pages/landings";
import { NotFoundPage } from "./pages/not-found";
import { OpportunitiesPage, OpportunityDetailPage } from "./pages/opportunities";
import { OverviewPage } from "./pages/overview";
import { PaidMediaPage } from "./pages/paid-media";
import { SeoPage } from "./pages/seo";
import { FilterProvider } from "./state/filters";
import "./styles.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false } } });
const router = createBrowserRouter([{ path: "/", element: <AppLayout />, children: [
  { index: true, element: <OverviewPage /> }, { path: "opportunities", element: <OpportunitiesPage /> }, { path: "opportunities/:municipalityId/:service", element: <OpportunityDetailPage /> }, { path: "journeys", element: <JourneysPage /> }, { path: "journeys/:opportunityId", element: <JourneyDetailPage /> }, { path: "funnel", element: <FunnelPage /> }, { path: "landings", element: <LandingsPage /> }, { path: "seo", element: <SeoPage /> }, { path: "paid-media", element: <PaidMediaPage /> }, { path: "experiments", element: <ExperimentsPage /> }, { path: "experiments/:experimentId", element: <ExperimentDetailPage /> }, { path: "data-quality", element: <DataQualityPage /> }, { path: "*", element: <NotFoundPage /> },
]}]);

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");
createRoot(root).render(<StrictMode><QueryClientProvider client={queryClient}><FilterProvider><RouterProvider router={router} /></FilterProvider></QueryClientProvider></StrictMode>);
