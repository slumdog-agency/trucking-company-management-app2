import { BrowserRouter } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/providers/ThemeProvider";
import Routes from "./routes";

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <Routes />
        <Toaster />
      </ThemeProvider>
    </BrowserRouter>
  );
} 