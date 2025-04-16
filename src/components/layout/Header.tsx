import { Link } from "react-router-dom";
import { Truck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fine } from "@/lib/fine";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { data: session } = fine.auth.useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fine.auth.signOut();
    navigate("/");
  };

  return (
    <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-8 w-8" />
          <h1 className="text-2xl font-bold">Trucking Manager</h1>
        </div>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/" className="hover:text-primary-foreground/80 font-medium">
            Dashboard
          </Link>
          <Link to="/drivers" className="hover:text-primary-foreground/80 font-medium">
            Drivers
          </Link>
          <Link to="/dispatchers" className="hover:text-primary-foreground/80 font-medium">
            Dispatchers
          </Link>
          <Link to="/divisions" className="hover:text-primary-foreground/80 font-medium">
            Divisions
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
                Admin
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link to="/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/users">Users</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
        
        <div className="flex items-center gap-4">
          {session ? (
            <div className="flex items-center gap-4">
              <span className="hidden md:inline text-sm">
                {session.user.name || session.user.email}
              </span>
              <Button variant="secondary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
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