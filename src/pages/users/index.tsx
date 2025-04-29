import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fine } from "@/lib/fine";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, Trash2, Plus, Search, Check, X, UserX, UserCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Define user groups
const USER_GROUPS = [
  "Admin",
  "Dispatch",
  "Accounting",
  "Safety",
  "Claims",
  "Recruiting",
  "ELD",
  "Fleet"
];

// Define available sections for permissions
const PERMISSIONS = {
  dashboard: "Dashboard",
  drivers: "Drivers",
  divisions: "Divisions",
  trucks: "Trucks",
  trailers: "Trailers",
  reports: "Reports",
  settings: "Settings",
  users: "Users Management"
};

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  extension: string;
  group: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
  deactivatedAt: string | null;
  updatedAt: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  extension: string;
  group: string;
  permissions: string[];
  isActive: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    extension: "",
    group: "",
    permissions: [],
    isActive: true
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Try to fetch users
      const users = await fine.table("users").select();
      
      // If no users exist, create an initial admin user
      if (!users || users.length === 0) {
        const initialUser = {
          name: "Admin User",
          email: "admin@example.com",
          phone: "",
          extension: "",
          group: "Admin",
          permissions: ["dashboard", "users", "settings"],
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deactivatedAt: null
        };
        
        const [newUser] = await fine.table("users").insert(initialUser).select();
        if (newUser) {
          setUsers([newUser]);
          
          toast({
            title: "Initial Setup",
            description: "Created initial admin user with email: admin@example.com",
          });
        }
      } else {
        setUsers(users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGroupChange = (value: string) => {
    setFormData(prev => ({ ...prev, group: value }));
  };

  const handlePermissionToggle = (permission: string) => {
    setFormData(prev => {
      const permissions = prev.permissions || [];
      return {
        ...prev,
        permissions: permissions.includes(permission)
          ? permissions.filter(p => p !== permission)
          : [...permissions, permission]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUser) {
        // Update existing user
        await fine.table("users")
          .update({
            ...formData,
            updatedAt: new Date().toISOString()
          })
          .eq("id", editingUser.id);

        setUsers(users.map(user => 
          user.id === editingUser.id 
            ? { ...user, ...formData, updatedAt: new Date().toISOString() } 
            : user
        ));

        toast({
          title: "Success",
          description: "User updated successfully",
        });
      } else {
        // Create new user
        const newUser = await fine.table("users").insert({
          ...formData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deactivatedAt: null
        });

        if (newUser) {
          setUsers([...users, newUser]);
          toast({
            title: "Success",
            description: "User added successfully",
          });
        }
      }
      setIsAddDialogOpen(false);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        phone: "",
        extension: "",
        group: "",
        permissions: [],
        isActive: true
      });
    } catch (error) {
      console.error("Error submitting user:", error);
      toast({
        title: "Error",
        description: "Failed to save user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone,
      extension: user.extension,
      group: user.group,
      permissions: user.permissions,
      isActive: user.isActive
    });
    setIsAddDialogOpen(true);
  };

  const handleDeactivate = async (user: User) => {
    try {
      const isDeactivating = user.isActive;
      const updatedUser = {
        isActive: !user.isActive,
        deactivatedAt: isDeactivating ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString()
      };

      await fine.table("users").update(updatedUser).eq("id", user.id);
      
      setUsers(users.map(u => 
        u.id === user.id 
          ? { ...u, ...updatedUser }
          : u
      ));

      toast({
        title: "Success",
        description: `User ${isDeactivating ? "deactivated" : "activated"} successfully.`,
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.group.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground mt-2">
              Manage system users and their permissions
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Extension</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{user.extension}</TableCell>
                  <TableCell>{user.group}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeactivate(user)}
                      >
                        {user.isActive ? (
                          <UserX className="h-4 w-4 text-destructive" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? 'Edit User' : 'Add New User'}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="extension">Extension</Label>
                  <Input
                    id="extension"
                    name="extension"
                    value={formData.extension}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="group">User Group</Label>
                  <Select
                    value={formData.group}
                    onValueChange={handleGroupChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a group" />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_GROUPS.map((group) => (
                        <SelectItem key={group} value={group}>
                          {group}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {Object.entries(PERMISSIONS).map(([key, label]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox
                        id={`permission-${key}`}
                        checked={(formData.permissions || []).includes(key)}
                        onCheckedChange={() => handlePermissionToggle(key)}
                      />
                      <Label htmlFor={`permission-${key}`}>{label}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddDialogOpen(false);
                setEditingUser(null);
                setFormData({
                  name: "",
                  email: "",
                  phone: "",
                  extension: "",
                  group: "",
                  permissions: [],
                  isActive: true
                });
              }}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>
                {editingUser ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}