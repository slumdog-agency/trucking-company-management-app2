import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Schema } from "@/lib/db-types";
import { fine } from "@/lib/fine";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, Trash2, Plus, Search, ArrowUp, ArrowDown } from "lucide-react";
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

export default function RouteStatusesPage() {
  const [statuses, setStatuses] = useState<Schema["routeStatuses"][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Schema["routeStatuses"] | null>(null);
  const [formData, setFormData] = useState<Schema["routeStatuses"]>({
    name: "",
    color: "#4169E1",
    isDefault: false,
    sortOrder: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const data = await fine.table("routeStatuses").select();
      
      // Sort by sortOrder if available
      const sortedStatuses = data ? [...data].sort((a, b) => 
        (a.sortOrder || 0) - (b.sortOrder || 0)
      ) : [];
      
      setStatuses(sortedStatuses);
    } catch (error) {
      console.error("Error fetching route statuses:", error);
      toast({
        title: "Error",
        description: "Failed to load route statuses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddStatus = async () => {
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Status name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set the sort order to be the highest + 1
      const maxSortOrder = statuses.reduce((max, status) => 
        Math.max(max, status.sortOrder || 0), 0);
      
      const newStatus = {
        ...formData,
        sortOrder: maxSortOrder + 1
      };
      
      const addedStatuses = await fine.table("routeStatuses").insert(newStatus).select();
      
      if (addedStatuses && addedStatuses.length > 0) {
        setStatuses([...statuses, addedStatuses[0]]);
        setFormData({
          name: "",
          color: "#4169E1",
          isDefault: false,
          sortOrder: 0
        });
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Route status added successfully.",
        });
      }
    } catch (error) {
      console.error("Error adding route status:", error);
      toast({
        title: "Error",
        description: "Failed to add route status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async () => {
    if (!editingStatus || !editingStatus.id) return;
    
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Status name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await fine.table("routeStatuses").update(formData).eq("id", editingStatus.id);
      
      // If this is being set as default, update all other statuses to not be default
      if (formData.isDefault) {
        for (const status of statuses) {
          if (status.id !== editingStatus.id && status.isDefault) {
            await fine.table("routeStatuses").update({ isDefault: false }).eq("id", status.id!);
          }
        }
      }
      
      setStatuses(statuses.map(status => 
        status.id === editingStatus.id ? { ...status, ...formData } : 
        (formData.isDefault && status.isDefault ? { ...status, isDefault: false } : status)
      ));
      
      setEditingStatus(null);
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Route status updated successfully.",
      });
    } catch (error) {
      console.error("Error updating route status:", error);
      toast({
        title: "Error",
        description: "Failed to update route status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteStatus = async (id: number) => {
    if (!confirm("Are you sure you want to delete this route status? This may affect existing routes.")) return;

    try {
      await fine.table("routeStatuses").delete().eq("id", id);
      setStatuses(statuses.filter(status => status.id !== id));
      toast({
        title: "Success",
        description: "Route status deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting route status:", error);
      toast({
        title: "Error",
        description: "Failed to delete route status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditStatus = (status: Schema["routeStatuses"]) => {
    setEditingStatus(status);
    setFormData(status);
    setIsDialogOpen(true);
  };

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return;
    
    try {
      const currentStatus = statuses[index];
      const previousStatus = statuses[index - 1];
      
      // Swap sort orders
      const tempOrder = currentStatus.sortOrder;
      
      await fine.table("routeStatuses")
        .update({ sortOrder: previousStatus.sortOrder })
        .eq("id", currentStatus.id!);
        
      await fine.table("routeStatuses")
        .update({ sortOrder: tempOrder })
        .eq("id", previousStatus.id!);
      
      // Update local state
      const newStatuses = [...statuses];
      newStatuses[index] = { ...currentStatus, sortOrder: previousStatus.sortOrder };
      newStatuses[index - 1] = { ...previousStatus, sortOrder: tempOrder };
      
      // Re-sort the array
      setStatuses(newStatuses.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      
      toast({
        title: "Success",
        description: "Route status order updated.",
      });
    } catch (error) {
      console.error("Error updating status order:", error);
      toast({
        title: "Error",
        description: "Failed to update status order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= statuses.length - 1) return;
    
    try {
      const currentStatus = statuses[index];
      const nextStatus = statuses[index + 1];
      
      // Swap sort orders
      const tempOrder = currentStatus.sortOrder;
      
      await fine.table("routeStatuses")
        .update({ sortOrder: nextStatus.sortOrder })
        .eq("id", currentStatus.id!);
        
      await fine.table("routeStatuses")
        .update({ sortOrder: tempOrder })
        .eq("id", nextStatus.id!);
      
      // Update local state
      const newStatuses = [...statuses];
      newStatuses[index] = { ...currentStatus, sortOrder: nextStatus.sortOrder };
      newStatuses[index + 1] = { ...nextStatus, sortOrder: tempOrder };
      
      // Re-sort the array
      setStatuses(newStatuses.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
      
      toast({
        title: "Success",
        description: "Route status order updated.",
      });
    } catch (error) {
      console.error("Error updating status order:", error);
      toast({
        title: "Error",
        description: "Failed to update status order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredStatuses = statuses.filter(status => {
    return status.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Route Status Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage route statuses and their colors
            </p>
          </div>
          <Button asChild>
            <a href="/settings">
              Back to Settings
            </a>
          </Button>
        </div>
        
        <div className="flex items-center mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search statuses..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-4" onClick={() => setEditingStatus(null)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Route Status
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingStatus ? "Edit Route Status" : "Add New Route Status"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Status Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter status name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="color">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="color"
                      name="color"
                      type="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      className="w-16 h-10 p-1"
                    />
                    <Input
                      name="color"
                      value={formData.color}
                      onChange={handleInputChange}
                      placeholder="#RRGGBB"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    name="isDefault"
                    checked={formData.isDefault}
                    onChange={handleInputChange}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="isDefault">Set as default status</Label>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={editingStatus ? handleUpdateStatus : handleAddStatus}>
                    {editingStatus ? "Update Status" : "Add Status"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">Loading route status data...</div>
        ) : (
          <div className="border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStatuses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No route statuses found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStatuses.map((status, index) => (
                    <TableRow key={status.id}>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0}
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0" 
                            onClick={() => handleMoveDown(index)}
                            disabled={index === filteredStatuses.length - 1}
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <span>{status.sortOrder || index + 1}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{status.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-6 h-6 rounded-full border border-gray-300" 
                            style={{ backgroundColor: status.color }}
                          ></div>
                          <span>{status.color}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {status.isDefault ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Default
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditStatus(status)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => handleDeleteStatus(status.id!)}
                            disabled={status.isDefault}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
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