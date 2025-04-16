import { useState, useEffect } from "react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DispatcherForm } from "@/components/dispatchers/DispatcherForm";

export default function DispatchersPage() {
  const [dispatchers, setDispatchers] = useState<Schema["dispatchers"][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState<Schema["dispatchers"] | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDispatchers();
  }, []);

  const fetchDispatchers = async () => {
    setLoading(true);
    try {
      const data = await fine.table("dispatchers").select();
      setDispatchers(data || []);
    } catch (error) {
      console.error("Error fetching dispatchers:", error);
      toast({
        title: "Error",
        description: "Failed to load dispatchers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDispatcher = async (dispatcher: Schema["dispatchers"]) => {
    try {
      const addedDispatchers = await fine.table("dispatchers").insert(dispatcher).select();
      if (addedDispatchers && addedDispatchers.length > 0) {
        setDispatchers([...dispatchers, addedDispatchers[0]]);
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Dispatcher added successfully.",
        });
      }
    } catch (error) {
      console.error("Error adding dispatcher:", error);
      toast({
        title: "Error",
        description: "Failed to add dispatcher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDispatcher = async (dispatcher: Schema["dispatchers"]) => {
    if (!dispatcher.id) return;
    
    try {
      await fine.table("dispatchers").update({
        firstName: dispatcher.firstName,
        lastName: dispatcher.lastName,
        email: dispatcher.email,
        phone: dispatcher.phone
      }).eq("id", dispatcher.id);
      
      setDispatchers(dispatchers.map(d => 
        d.id === dispatcher.id ? dispatcher : d
      ));
      
      setEditingDispatcher(null);
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Dispatcher updated successfully.",
      });
    } catch (error) {
      console.error("Error updating dispatcher:", error);
      toast({
        title: "Error",
        description: "Failed to update dispatcher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDispatcher = async (id: number) => {
    if (!confirm("Are you sure you want to delete this dispatcher?")) return;

    try {
      await fine.table("dispatchers").delete().eq("id", id);
      setDispatchers(dispatchers.filter(d => d.id !== id));
      toast({
        title: "Success",
        description: "Dispatcher deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting dispatcher:", error);
      toast({
        title: "Error",
        description: "Failed to delete dispatcher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditDispatcher = (dispatcher: Schema["dispatchers"]) => {
    setEditingDispatcher(dispatcher);
    setIsDialogOpen(true);
  };

  const filteredDispatchers = dispatchers.filter(dispatcher => {
    const fullName = `${dispatcher.firstName} ${dispatcher.lastName}`.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
           (dispatcher.email && dispatcher.email.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dispatcher Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all your dispatchers
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
              placeholder="Search dispatchers..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-4">
                <Plus className="h-4 w-4 mr-1" />
                Add Dispatcher
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDispatcher ? "Edit Dispatcher" : "Add New Dispatcher"}
                </DialogTitle>
              </DialogHeader>
              <DispatcherForm 
                dispatcher={editingDispatcher} 
                onSubmit={editingDispatcher ? handleUpdateDispatcher : handleAddDispatcher}
                onCancel={() => {
                  setEditingDispatcher(null);
                  setIsDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">Loading dispatcher data...</div>
        ) : (
          <div className="border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDispatchers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No dispatchers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDispatchers.map((dispatcher) => (
                    <TableRow key={dispatcher.id}>
                      <TableCell>
                        {dispatcher.firstName} {dispatcher.lastName}
                      </TableCell>
                      <TableCell>{dispatcher.email || "-"}</TableCell>
                      <TableCell>{dispatcher.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditDispatcher(dispatcher)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteDispatcher(dispatcher.id!)}>
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