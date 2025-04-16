import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Schema } from "@/lib/db-types";
import { fine } from "@/lib/fine";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, Trash2, Plus, Search } from "lucide-react";
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

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Schema["drivers"][]>([]);
  const [dispatchers, setDispatchers] = useState<Schema["dispatchers"][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Schema["drivers"] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch drivers
        const driversData = await fine.table("drivers").select();
        
        // Sort drivers by count
        const sortedDrivers = driversData ? [...driversData].sort((a, b) => a.count - b.count) : [];
        setDrivers(sortedDrivers);
        
        // Fetch dispatchers
        const dispatchersData = await fine.table("dispatchers").select();
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

    fetchData();
  }, [toast]);

  const handleEdit = (driver: Schema["drivers"]) => {
    setEditingId(driver.id || null);
    setEditForm({ ...driver });
  };

  const handleSave = async () => {
    if (!editForm || !editingId) return;

    try {
      await fine.table("drivers").update(editForm).eq("id", editingId);
      setDrivers(drivers.map(driver => 
        driver.id === editingId ? { ...driver, ...editForm } : driver
      ));
      toast({
        title: "Success",
        description: "Driver updated successfully.",
      });
      setEditingId(null);
      setEditForm(null);
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
      await fine.table("drivers").delete().eq("id", id);
      
      // Get remaining drivers
      const remainingDrivers = drivers.filter(driver => driver.id !== id);
      
      // Update counts to be sequential
      const updatedDrivers = await Promise.all(
        remainingDrivers.map(async (driver, index) => {
          const newCount = index + 1;
          if (driver.count !== newCount) {
            await fine.table("drivers").update({ count: newCount }).eq("id", driver.id!);
            return { ...driver, count: newCount };
          }
          return driver;
        })
      );
      
      setDrivers(updatedDrivers);
      
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editForm) return;
    
    const { name, value } = e.target;
    setEditForm({
      ...editForm,
      [name]: name === 'percentage' ? parseFloat(value) : value
    });
  };

  const handleDispatcherChange = (value: string) => {
    if (!editForm) return;
    
    const selectedDispatcher = dispatchers.find(d => d.id === parseInt(value));
    
    if (selectedDispatcher) {
      setEditForm({
        ...editForm,
        dispatcherId: selectedDispatcher.id,
        dispatcher: `${selectedDispatcher.firstName} ${selectedDispatcher.lastName}`
      });
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    const fullName = `${driver.firstName} ${driver.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           driver.dispatcher.toLowerCase().includes(searchTerm.toLowerCase()) ||
           (driver.truck && driver.truck.toLowerCase().includes(searchTerm.toLowerCase())) ||
           (driver.trailer && driver.trailer.toLowerCase().includes(searchTerm.toLowerCase()));
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
            <a href="/">
              Back to Dashboard
            </a>
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
                  <TableHead className="w-16">#</TableHead>
                  <TableHead className="w-24">Percentage</TableHead>
                  <TableHead>Driver Name</TableHead>
                  <TableHead>Dispatcher</TableHead>
                  <TableHead>Truck</TableHead>
                  <TableHead>Trailer</TableHead>
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
                        {driver.count}
                      </TableCell>
                      <TableCell>
                        {editingId === driver.id ? (
                          <Input
                            type="number"
                            name="percentage"
                            value={editForm?.percentage}
                            onChange={handleInputChange}
                            className="h-8 w-20"
                          />
                        ) : (
                          `${driver.percentage}%`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === driver.id ? (
                          <div className="flex gap-1">
                            <Input
                              name="firstName"
                              value={editForm?.firstName}
                              onChange={handleInputChange}
                              className="h-8"
                            />
                            <Input
                              name="lastName"
                              value={editForm?.lastName}
                              onChange={handleInputChange}
                              className="h-8"
                            />
                          </div>
                        ) : (
                          `${driver.firstName} ${driver.lastName}`
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === driver.id ? (
                          <Select 
                            defaultValue={driver.dispatcherId?.toString()} 
                            onValueChange={handleDispatcherChange}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder="Select a dispatcher" />
                            </SelectTrigger>
                            <SelectContent>
                              {dispatchers.map((dispatcher) => (
                                <SelectItem key={dispatcher.id} value={dispatcher.id?.toString() || ""}>
                                  {dispatcher.firstName} {dispatcher.lastName}
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
                            value={editForm?.truck || ""}
                            onChange={handleInputChange}
                            className="h-8"
                            placeholder="Truck #"
                          />
                        ) : (
                          driver.truck || "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {editingId === driver.id ? (
                          <Input
                            name="trailer"
                            value={editForm?.trailer || ""}
                            onChange={handleInputChange}
                            className="h-8"
                            placeholder="Trailer #"
                          />
                        ) : (
                          driver.trailer || "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {editingId === driver.id ? (
                          <Button size="sm" variant="ghost" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                          </Button>
                        ) : (
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEdit(driver)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(driver.id!)}>
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
          &copy; {new Date().getFullYear()} Trucking Manager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}