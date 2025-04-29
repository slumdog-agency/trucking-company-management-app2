import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "./components/ui/tooltip";
import { ThemeProvider } from "@/providers/ThemeProvider";
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
    <ThemeProvider>
    <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/login' element={<LoginForm />} />
            <Route path='/signup' element={<SignupForm />} />
            <Route path='/logout' element={<Logout />} />
            <Route path='/' element={<ProtectedRoute Component={Index} />} />
            <Route path='/drivers' element={<ProtectedRoute Component={DriversPage} />} />
            <Route path='/drivers/:id' element={<ProtectedRoute Component={DriverProfilePage} />} />
            <Route path='/drivers/add' element={<ProtectedRoute Component={AddDriverPage} />} />
            <Route path='/dispatchers' element={<ProtectedRoute Component={DispatchersPage} />} />
            <Route path='/settings' element={<ProtectedRoute Component={SettingsPage} />} />
            <Route path='/settings/route-statuses' element={<ProtectedRoute Component={RouteStatusesPage} />} />
            <Route path='/trucks' element={<ProtectedRoute Component={TrucksPage} />} />
            <Route path='/trailers' element={<ProtectedRoute Component={TrailersPage} />} />
            <Route path='/divisions' element={<ProtectedRoute Component={DivisionsPage} />} />
            <Route path='/users' element={<ProtectedRoute Component={UsersPage} />} />
          </Routes>
          <Sonner />
          <Toaster />
        </BrowserRouter>
      </TooltipProvider>
      </ThemeProvider>
  </QueryClientProvider>
);