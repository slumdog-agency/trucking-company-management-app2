import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fine } from "@/lib/fine";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, Trash2, Plus, Search, Check, X, Download, FileText } from "lucide-react";
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Schema } from "@/lib/db-types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { jsPDF } from "jspdf";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define available sections for permissions
const SECTIONS = [
  { id: "dashboard", name: "Dashboard" },
  { id: "drivers", name: "Drivers" },
  { id: "dispatchers", name: "Dispatchers" },
  { id: "divisions", name: "Divisions" },
  { id: "trucks", name: "Trucks" },
  { id: "trailers", name: "Trailers" },
  { id: "settings", name: "Settings" },
  { id: "users", name: "Users" }
];

// Define user groups
const USER_GROUPS = [
  "Dispatch",
  "Accounting",
  "Safety",
  "Claims",
  "Recruiting",
  "ELD",
  "Fleet"
];

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  group?: string;
}

interface UserPermission {
  userId: string;
  section: string;
  canRead: boolean;
  canWrite: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, UserPermission[]>>({});
  const [editPermissions, setEditPermissions] = useState<UserPermission[]>([]);
  const [newUser, setNewUser] = useState<{name: string, email: string, password: string, group: string}>({
    name: "",
    email: "",
    password: "",
    group: "Dispatch"
  });
  const [filters, setFilters] = useState<Array<{field: string, value: string, label: string}>>([]);
  const [filterInput, setFilterInput] = useState("");
  const [filterField, setFilterField] = useState("name");
  const [activeColumns, setActiveColumns] = useState<string[]>([
    "name", "email", "group", "createdAt", "permissions"
  ]);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const { toast } = useToast();
  const { data: session } = fine.auth.useSession();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // In a real app, you would fetch users from your auth system
      // For this demo, we'll use the session API to get the current user
      // and simulate other users
      if (session?.user) {
        const currentUser = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          createdAt: new Date().toISOString(),
          group: "Dispatch"
        };
        
        // Simulate some additional users
        const demoUsers = [
          currentUser,
          {
            id: "2",
            name: "Demo Dispatcher",
            email: "dispatcher@example.com",
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            group: "Dispatch"
          },
          {
            id: "3",
            name: "Demo Driver Manager",
            email: "manager@example.com",
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            group: "Fleet"
          },
          {
            id: "4",
            name: "Demo Accountant",
            email: "accounting@example.com",
            createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            group: "Accounting"
          },
          {
            id: "5",
            name: "Demo Safety Officer",
            email: "safety@example.com",
            createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
            group: "Safety"
          }
        ];
        
        setUsers(demoUsers);
        
        // Fetch permissions for all users
        const allPermissions: Record<string, UserPermission[]> = {};
        
        for (const user of demoUsers) {
          const userPerms = await fine.table("userPermissions").select().eq("userId", user.id);
          
          if (userPerms && userPerms.length > 0) {
            allPermissions[user.id] = userPerms;
          } else {
            // Create default permissions for this user if none exist
            const defaultPermissions = SECTIONS.map(section => ({
              userId: user.id,
              section: section.id,
              canRead: user.id === currentUser.id, // Current user gets full access by default
              canWrite: user.id === currentUser.id
            }));
            
            // Save default permissions to database
            await fine.table("userPermissions").insert(defaultPermissions);
            allPermissions[user.id] = defaultPermissions;
          }
        }
        
        setUserPermissions(allPermissions);
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

  const handleEditPermissions = (user: User) => {
    setEditingUser(user);
    setEditPermissions(userPermissions[user.id] || []);
    setIsDialogOpen(true);
  };

  const handlePermissionChange = (section: string, type: 'read' | 'write', checked: boolean) => {
    setEditPermissions(prev => 
      prev.map(perm => 
        perm.section === section 
          ? { 
              ...perm, 
              // If turning off write, also turn off read
              // If turning on read, don't change write
              // If turning off read, also turn off write
              // If turning on write, also turn on read
              canRead: type === 'write' ? (checked ? true : perm.canRead) : (type === 'read' ? checked : perm.canRead),
              canWrite: type === 'write' ? checked : (type === 'read' ? (checked ? perm.canWrite : false) : perm.canWrite)
            } 
          : perm
      )
    );
  };

  const savePermissions = async () => {
    if (!editingUser) return;
    
    try {
      // Update permissions in database
      for (const perm of editPermissions) {
        await fine.table("userPermissions")
          .update({
            canRead: perm.canRead,
            canWrite: perm.canWrite
          })
          .eq("userId", perm.userId)
          .eq("section", perm.section);
      }
      
      // Update local state
      setUserPermissions(prev => ({
        ...prev,
        [editingUser.id]: editPermissions
      }));
      
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "User permissions updated successfully.",
      });
    } catch (error) {
      console.error("Error updating permissions:", error);
      toast({
        title: "Error",
        description: "Failed to update permissions. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleNewUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupChange = (value: string) => {
    setNewUser(prev => ({
      ...prev,
      group: value
    }));
  };

  const handleAddUser = async () => {
    // In a real app, you would add the user to your auth system
    // For this demo, we'll just simulate adding a user
    try {
      const newUserId = `${users.length + 1}`;
      const newUserObj: User = {
        id: newUserId,
        name: newUser.name,
        email: newUser.email,
        createdAt: new Date().toISOString(),
        group: newUser.group
      };
      
      // Create default permissions for this user
      const defaultPermissions = SECTIONS.map(section => ({
        userId: newUserId,
        section: section.id,
        canRead: true,
        canWrite: false
      }));
      
      // Save default permissions to database
      await fine.table("userPermissions").insert(defaultPermissions);
      
      // Update local state
      setUsers([...users, newUserObj]);
      setUserPermissions(prev => ({
        ...prev,
        [newUserId]: defaultPermissions
      }));
      
      setNewUser({
        name: "",
        email: "",
        password: "",
        group: "Dispatch"
      });
      
      setIsAddUserDialogOpen(false);
      
      toast({
        title: "Success",
        description: "User added successfully.",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      toast({
        title: "Error",
        description: "Failed to add user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const addFilter = () => {
    if (!filterInput.trim()) return;
    
    const fieldLabel = {
      name: "Name",
      email: "Email",
      group: "Group"
    }[filterField] || filterField;
    
    setFilters([...filters, { 
      field: filterField, 
      value: filterInput.trim(),
      label: `${fieldLabel}: ${filterInput.trim()}`
    }]);
    setFilterInput("");
  };

  const removeFilter = (index: number) => {
    const newFilters = [...filters];
    newFilters.splice(index, 1);
    setFilters(newFilters);
  };

  const toggleColumn = (column: string) => {
    if (activeColumns.includes(column)) {
      setActiveColumns(activeColumns.filter(c => c !== column));
    } else {
      setActiveColumns([...activeColumns, column]);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filters.length === 0) {
      return searchTerm ? 
        (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
         user.group?.toLowerCase().includes(searchTerm.toLowerCase())) : true;
    }
    
    return filters.every(filter => {
      if (filter.field === 'name' && user.name) {
        return user.name.toLowerCase().includes(filter.value.toLowerCase());
      } else if (filter.field === 'email') {
        return user.email.toLowerCase().includes(filter.value.toLowerCase());
      } else if (filter.field === 'group' && user.group) {
        return user.group.toLowerCase().includes(filter.value.toLowerCase());
      }
      return false;
    });
  });

  const exportToCSV = () => {
    // Create CSV content
    const headers = activeColumns.map(column => {
      return {
        name: "Name",
        email: "Email",
        group: "Group",
        createdAt: "Created At",
        permissions: "Permissions"
      }[column] || column;
    });
    
    const rows = filteredUsers.map(user => {
      return activeColumns.map(column => {
        if (column === 'name') {
          return user.name || "";
        } else if (column === 'email') {
          return user.email;
        } else if (column === 'group') {
          return user.group || "";
        } else if (column === 'createdAt') {
          return new Date(user.createdAt).toLocaleDateString();
        } else if (column === 'permissions') {
          const perms = userPermissions[user.id];
          if (perms) {
            return perms.some(p => p.canWrite) ? "Write" : 
                   perms.some(p => p.canRead) ? "Read" : "None";
          }
          return "None";
        }
        return "";
      });
    });
    
    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `users-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text("Users Report", 14, 15);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      
      // Table headers
      const headers = activeColumns.map(column => {
        return {
          name: "Name",
          email: "Email",
          group: "Group",
          createdAt: "Created At",
          permissions: "Permissions"
        }[column] || column;
      });
      
      // Table data
      const data = filteredUsers.map(user => {
        return activeColumns.map(column => {
          if (column === 'name') {
            return user.name || "-";
          } else if (column === 'email') {
            return user.email;
          } else if (column === 'group') {
            return user.group || "-";
          } else if (column === 'createdAt') {
            return new Date(user.createdAt).toLocaleDateString();
          } else if (column === 'permissions') {
            const perms = userPermissions[user.id];
            if (perms) {
              return perms.some(p => p.canWrite) ? "Write" : 
                     perms.some(p => p.canRead) ? "Read" : "None";
            }
            return "None";
          }
          return "-";
        });
      });
      
      // Draw table
      doc.setFontSize(10);
      
      // Table settings
      const startY = 30;
      const margin = 14;
      const cellPadding = 2;
      const availableWidth = doc.internal.pageSize.getWidth() - margin * 2;
      const cellWidth = Math.min(30, availableWidth / headers.length);
      const cellHeight = 10;
      
      // Draw header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, startY, availableWidth, cellHeight, 'F');
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "bold");
      
      headers.forEach((header, i) => {
        doc.text(header, margin + i * cellWidth + cellPadding, startY + cellHeight / 2 + 1);
      });
      
      // Draw rows
      doc.setFont("helvetica", "normal");
      data.forEach((row, rowIndex) => {
        const y = startY + (rowIndex + 1) * cellHeight;
        
        // Alternate row background
        if (rowIndex % 2 === 1) {
          doc.setFillColor(248, 248, 248);
          doc.rect(margin, y, availableWidth, cellHeight, 'F');
        }
        
        // Draw cell text
        row.forEach((cell, cellIndex) => {
          const x = margin + cellIndex * cellWidth + cellPadding;
          doc.text(cell, x, y + cellHeight / 2 + 1);
        });
      });
      
      // Add summary
      const totalY = startY + (data.length + 1) * cellHeight + 10;
      doc.setFont("helvetica", "bold");
      doc.text(`Total Users: ${filteredUsers.length}`, margin, totalY);
      
      // Save PDF
      doc.save(`users-${new Date().toISOString().split('T')[0]}.pdf`);
      
      toast({
        title: "Success",
        description: "PDF exported successfully.",
      });
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      toast({
        title: "Error",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage users and their permissions
            </p>
          </div>
          <Button asChild>
            <a href="/">
              Back to Dashboard
            </a>
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="flex-1 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-1" />
                  Filter
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48">
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                      value={filterField}
                      onChange={(e) => setFilterField(e.target.value)}
                    >
                      <option value="name">Name</option>
                      <option value="email">Email</option>
                      <option value="group">Group</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Filter value..." 
                      value={filterInput}
                      onChange={(e) => setFilterInput(e.target.value)}
                      className="h-8"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addFilter();
                      }}
                    />
                    <Button size="sm" onClick={addFilter} className="h-8 px-2">Add</Button>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Popover open={isColumnMenuOpen} onOpenChange={setIsColumnMenuOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56">
                <div className="space-y-2">
                  <h4 className="font-medium mb-2">Toggle Columns</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-name" 
                        checked={activeColumns.includes('name')}
                        onCheckedChange={() => toggleColumn('name')}
                      />
                      <Label htmlFor="column-name">Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-email" 
                        checked={activeColumns.includes('email')}
                        onCheckedChange={() => toggleColumn('email')}
                      />
                      <Label htmlFor="column-email">Email</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-group" 
                        checked={activeColumns.includes('group')}
                        onCheckedChange={() => toggleColumn('group')}
                      />
                      <Label htmlFor="column-group">Group</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-createdAt" 
                        checked={activeColumns.includes('createdAt')}
                        onCheckedChange={() => toggleColumn('createdAt')}
                      />
                      <Label htmlFor="column-createdAt">Created At</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-permissions" 
                        checked={activeColumns.includes('permissions')}
                        onCheckedChange={() => toggleColumn('permissions')}
                      />
                      <Label htmlFor="column-permissions">Permissions</Label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {filters.map((filter, index) => (
              <div 
                key={index} 
                className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs"
              >
                <span>{filter.label}</span>
                <button 
                  onClick={() => removeFilter(index)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Search className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToCSV}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export to PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={newUser.name}
                      onChange={handleNewUserInputChange}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={newUser.email}
                      onChange={handleNewUserInputChange}
                      placeholder="john@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={newUser.password}
                      onChange={handleNewUserInputChange}
                      placeholder="••••••••"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="group">User Group</Label>
                    <Select 
                      value={newUser.group} 
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
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={handleAddUser}>
                      Add User
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">Loading user data...</div>
        ) : (
          <div className="border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeColumns.includes('name') && <TableHead>Name</TableHead>}
                  {activeColumns.includes('email') && <TableHead>Email</TableHead>}
                  {activeColumns.includes('group') && <TableHead>Group</TableHead>}
                  {activeColumns.includes('createdAt') && <TableHead>Created</TableHead>}
                  {activeColumns.includes('permissions') && <TableHead>Permissions</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeColumns.length + 1} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      {activeColumns.includes('name') && (
                        <TableCell className="font-medium">{user.name || "Unnamed User"}</TableCell>
                      )}
                      {activeColumns.includes('email') && <TableCell>{user.email}</TableCell>}
                      {activeColumns.includes('group') && (
                        <TableCell>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {user.group || "None"}
                          </span>
                        </TableCell>
                      )}
                      {activeColumns.includes('createdAt') && (
                        <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                      )}
                      {activeColumns.includes('permissions') && (
                        <TableCell>
                          <div className="flex gap-1">
                            {userPermissions[user.id]?.some(p => p.canWrite) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Write
                              </span>
                            ) : userPermissions[user.id]?.some(p => p.canRead) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Read
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                None
                              </span>
                            )}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => handleEditPermissions(user)}>
                          Edit Permissions
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Edit Permissions for {editingUser?.name || editingUser?.email}
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead className="text-center">Read Access</TableHead>
                  <TableHead className="text-center">Write Access</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SECTIONS.map((section) => {
                  const permission = editPermissions.find(p => p.section === section.id);
                  const canRead = permission?.canRead || false;
                  const canWrite = permission?.canWrite || false;
                  
                  return (
                    <TableRow key={section.id}>
                      <TableCell className="font-medium">{section.name}</TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={canRead}
                          onCheckedChange={(checked) => handlePermissionChange(section.id, 'read', checked)}
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Switch
                          checked={canWrite}
                          onCheckedChange={(checked) => handlePermissionChange(section.id, 'write', checked)}
                          disabled={!canRead} // Can't have write without read
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={savePermissions}>
                Save Permissions
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <footer className="border-t py-4 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Trucking Manager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}