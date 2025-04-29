import { Link } from "react-router-dom";
import { Truck, Users, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fine } from "@/lib/fine";
import { useNavigate } from "react-router-dom";
import { getAppSettings } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useTheme } from "@/providers/ThemeProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Initialize theme from localStorage on app load
const initializeTheme = () => {
  const settings = getAppSettings();
  const savedTheme = settings.theme || 'light';
  document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  return savedTheme;
};

export function Header() {
  const { data: session } = fine.auth.useSession();
  const navigate = useNavigate();
  const [companyName, setCompanyName] = useState("My Company");
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    // Load initial settings
    const loadSettings = () => {
      const settings = getAppSettings();
      if (settings.companyName) {
        setCompanyName(settings.companyName);
      }
    };

    loadSettings();

    // Listen for settings changes
    const handleSettingsChange = () => loadSettings();
    window.addEventListener('app-settings-changed', handleSettingsChange);

    return () => {
      window.removeEventListener('app-settings-changed', handleSettingsChange);
    };
  }, []);

  const handleLogout = async () => {
    await fine.auth.signOut();
    navigate("/");
  };

  // Show the opposite theme as the button icon (what you can switch to)
  const ThemeIcon = theme === 'light' ? Moon : Sun;
  const themeLabel = theme === 'light' ? 'Dark' : 'Light';

  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">{companyName}</h1>
            <div className="flex items-center gap-1 text-sm opacity-80">
              <span>powered by</span>
              <span>CarrierXXL</span>
            </div>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link to="/" className="hover:text-primary-foreground/80 font-medium">
            Dashboard
          </Link>
          <Link to="/drivers" className="hover:text-primary-foreground/80 font-medium">
            Drivers
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hover:text-primary-foreground/80 font-medium px-3 py-2 h-auto">
                Assets
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/trucks">Trucks</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/trailers">Trailers</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hover:text-primary-foreground/80 font-medium px-3 py-2 h-auto">
                Administration
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="flex items-center gap-2"
          >
            <ThemeIcon className="h-4 w-4" />
            <span className="hidden sm:inline">{themeLabel}</span>
          </Button>
          {session ? (
            <>
              <span className="hidden md:inline text-sm">
                {session.user.name || session.user.email}
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}