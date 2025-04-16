import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "./components/layout/theme-provider";
import "./index.css";

// Pages
import Index from "./pages";
import LoginForm from "./pages/login";
import SignupForm from "./pages/signup";
import Logout from "./pages/logout";
import DriversPage from "./pages/drivers";
import DriverProfilePage from "./pages/drivers/[id]";
import AddDriverPage from "./pages/drivers/add";
import DispatchersPage from "./pages/dispatchers";
import SettingsPage from "./pages/settings";
import RouteStatusesPage from "./pages/settings/route-statuses";
import TrucksPage from "./pages/trucks";
import TrailersPage from "./pages/trailers";
import DivisionsPage from "./pages/divisions";
import UsersPage from "./pages/users";

// Auth components
import { ProtectedRoute } from "./components/auth/route-components";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Index />} />
            <Route path='/login' element={<LoginForm />} />
            <Route path='/signup' element={<SignupForm />} />
            <Route path='/logout' element={<Logout />} />
            <Route path='/drivers' element={<DriversPage />} />
            <Route path='/drivers/:id' element={<DriverProfilePage />} />
            <Route path='/drivers/add' element={<AddDriverPage />} />
            <Route path='/dispatchers' element={<DispatchersPage />} />
            <Route path='/settings' element={<SettingsPage />} />
            <Route path='/settings/route-statuses' element={<RouteStatusesPage />} />
            <Route path='/trucks' element={<TrucksPage />} />
            <Route path='/trailers' element={<TrailersPage />} />
            <Route path='/divisions' element={<DivisionsPage />} />
            <Route path='/users' element={<UsersPage />} />
          </Routes>
        </BrowserRouter>
        <Sonner />
        <Toaster />
      </ThemeProvider>
    </TooltipProvider>
  </QueryClientProvider>
);