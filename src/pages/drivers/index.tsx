import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Schema } from "@/lib/db-types";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, Trash2, Plus, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDrivers, updateDriver, deleteDriver, getDispatchers, addDriver } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Schema["drivers"][]>([]);
  const [dispatchers, setDispatchers] = useState<Schema["dispatchers"][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Schema["drivers"]> | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const [driversData, dispatchersData] = await Promise.all([
        getDrivers(),
        getDispatchers()
      ]);
      console.log('Fetched drivers data:', driversData);
      // Ensure we have all required fields
      const validatedData = (driversData || []).map(driver => ({
        ...driver,
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        email: driver.email || '',
        phone: driver.phone || '',
        truck: driver.truck || ''
      }));
      setDrivers(validatedData);
      setDispatchers(dispatchersData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [toast]);

  const handleEdit = (driver: Schema["drivers"]) => {
    setEditingId(driver.id || null);
    setEditForm(driver);
  };

  const handleSave = async () => {
    if (!editForm || !editingId) return;

    try {
      const updatedDriver = await updateDriver(editingId, editForm);
      setDrivers(drivers.map(d => d.id === editingId ? updatedDriver : d));
      setEditingId(null);
      setEditForm(null);
      toast({
        title: "Success",
        description: "Driver updated successfully.",
      });
    } catch (error) {
      console.error("Error updating driver:", error);
      toast({
        title: "Error",
        description: "Failed to update driver. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;

    try {
      await deleteDriver(id);
      setDrivers(drivers.filter(d => d.id !== id));
      toast({
        title: "Success",
        description: "Driver deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting driver:", error);
      toast({
        title: "Error",
        description: "Failed to delete driver. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAdd = async (data: Partial<Schema["drivers"]>) => {
    try {
      const newDriver = await addDriver(data);
      setDrivers([...drivers, newDriver]);
      setIsAddDialogOpen(false);
      toast({
        title: "Success",
        description: "Driver added successfully.",
      });
    } catch (error) {
      console.error("Error adding driver:", error);
      toast({
        title: "Error",
        description: "Failed to add driver. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => prev ? ({
      ...prev,
      [name]: value
    }) : null);
  };

  const handleDispatcherChange = (value: string) => {
    const selectedDispatcher = dispatchers.find(d => d.dispatcher_id === parseInt(value));
    
    if (selectedDispatcher) {
      setEditForm(prev => prev ? ({
        ...prev,
        dispatcher_id: selectedDispatcher.dispatcher_id,
        dispatcher: `${selectedDispatcher.first_name} ${selectedDispatcher.last_name}`
      }) : null);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    if (!searchTerm) return true;
    
    const searchFields = [
      driver.first_name,
      driver.last_name,
      driver.email,
      driver.phone,
      driver.dispatcher
    ].map(field => (field || "").toLowerCase());
    
    return searchFields.some(field => field.includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Driver Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all your drivers - edit names, percentages, and other details here
            </p>
          </div>
          <Button asChild>
            <Link to="/">
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="flex items-center mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search drivers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button className="ml-4" asChild>
            <Link to="/drivers/add">
              <Plus className="h-4 w-4 mr-1" />
              Add Driver
            </Link>
          </Button>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">Loading driver data...</div>
        ) : (
          <div className="border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Dispatcher</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No drivers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDrivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        {editingId === driver.id ? (
                          <div className="flex gap-2">
                            <Input
                              name="first_name"
                              value={editForm?.first_name}
                              onChange={handleInputChange}
                              className="w-24"
                            />
                            <Input
                              name="last_name"
                              value={editForm?.last_name}
                              onChange={handleInputChange}
                              className="w-24"
                            />
                          </div>
                        ) : (
                          `${driver.first_name} ${driver.last_name}`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === driver.id ? (
                          <Input
                            name="email"
                            value={editForm?.email}
                            onChange={handleInputChange}
                          />
                        ) : (
                          driver.email
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === driver.id ? (
                          <Input
                            name="phone"
                            value={editForm?.phone}
                            onChange={handleInputChange}
                          />
                        ) : (
                          driver.phone
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === driver.id ? (
                          <Select 
                            defaultValue={driver.dispatcher_id?.toString()} 
                            onValueChange={handleDispatcherChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a dispatcher" />
                            </SelectTrigger>
                            <SelectContent>
                              {dispatchers.map((dispatcher) => (
                                <SelectItem key={dispatcher.dispatcher_id} value={dispatcher.dispatcher_id?.toString() || ""}>
                                  {dispatcher.first_name} {dispatcher.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          driver.dispatcher
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === driver.id ? (
                          <Input
                            name="truck"
                            value={editForm?.truck}
                            onChange={handleInputChange}
                          />
                        ) : (
                          driver.truck
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === driver.id ? (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={handleSave}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => {
                              setEditingId(null);
                              setEditForm(null);
                            }}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(driver)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => driver.id && handleDelete(driver.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>
      
      <footer className="border-t py-4 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CarrierXXL. All rights reserved.
        </div>
      </footer>
    </div>
  );
}