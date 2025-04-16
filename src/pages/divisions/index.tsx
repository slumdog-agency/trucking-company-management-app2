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
import { Label } from "@/components/ui/label";

export default function DivisionsPage() {
  const [divisions, setDivisions] = useState<Schema["divisions"][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Schema["divisions"] | null>(null);
  const [formData, setFormData] = useState<Schema["divisions"]>({
    companyName: "",
    mc: "",
    dot: "",
    address: "",
    phoneNumber: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    setLoading(true);
    try {
      const data = await fine.table("divisions").select();
      setDivisions(data || []);
    } catch (error) {
      console.error("Error fetching divisions:", error);
      toast({
        title: "Error",
        description: "Failed to load divisions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddDivision = async () => {
    if (!formData.companyName) {
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const addedDivisions = await fine.table("divisions").insert(formData).select();
      if (addedDivisions && addedDivisions.length > 0) {
        setDivisions([...divisions, addedDivisions[0]]);
        setFormData({
          companyName: "",
          mc: "",
          dot: "",
          address: "",
          phoneNumber: ""
        });
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Division added successfully.",
        });
      }
    } catch (error) {
      console.error("Error adding division:", error);
      toast({
        title: "Error",
        description: "Failed to add division. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDivision = async () => {
    if (!editingDivision || !editingDivision.id) return;
    
    if (!formData.companyName) {
      toast({
        title: "Validation Error",
        description: "Company name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await fine.table("divisions").update(formData).eq("id", editingDivision.id);
      
      setDivisions(divisions.map(division => 
        division.id === editingDivision.id ? { ...division, ...formData } : division
      ));
      
      setEditingDivision(null);
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Division updated successfully.",
      });
    } catch (error) {
      console.error("Error updating division:", error);
      toast({
        title: "Error",
        description: "Failed to update division. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteDivision = async (id: number) => {
    if (!confirm("Are you sure you want to delete this division?")) return;

    try {
      await fine.table("divisions").delete().eq("id", id);
      setDivisions(divisions.filter(division => division.id !== id));
      toast({
        title: "Success",
        description: "Division deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting division:", error);
      toast({
        title: "Error",
        description: "Failed to delete division. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditDivision = (division: Schema["divisions"]) => {
    setEditingDivision(division);
    setFormData(division);
    setIsDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingDivision(null);
    setFormData({
      companyName: "",
      mc: "",
      dot: "",
      address: "",
      phoneNumber: ""
    });
    setIsDialogOpen(true);
  };

  const filteredDivisions = divisions.filter(division => {
    const searchString = `${division.companyName} ${division.mc || ''} ${division.dot || ''}`.toLowerCase();
    return searchString.includes(searchTerm.toLowerCase());
  });

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Division Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all your divisions for booking loads
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
              placeholder="Search divisions..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="ml-4" onClick={handleAddNewClick}>
                <Plus className="h-4 w-4 mr-1" />
                Add Division
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingDivision ? "Edit Division" : "Add New Division"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder="Enter company name"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mc">MC Number</Label>
                    <Input
                      id="mc"
                      name="mc"
                      value={formData.mc || ""}
                      onChange={handleInputChange}
                      placeholder="MC123456"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dot">DOT Number</Label>
                    <Input
                      id="dot"
                      name="dot"
                      value={formData.dot || ""}
                      onChange={handleInputChange}
                      placeholder="12345678"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={formData.address || ""}
                    onChange={handleInputChange}
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber || ""}
                    onChange={handleInputChange}
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={editingDivision ? handleUpdateDivision : handleAddDivision}>
                    {editingDivision ? "Update Division" : "Add Division"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">Loading division data...</div>
        ) : (
          <div className="border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company Name</TableHead>
                  <TableHead>MC Number</TableHead>
                  <TableHead>DOT Number</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDivisions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      No divisions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDivisions.map((division) => (
                    <TableRow key={division.id}>
                      <TableCell className="font-medium">{division.companyName}</TableCell>
                      <TableCell>{division.mc || "-"}</TableCell>
                      <TableCell>{division.dot || "-"}</TableCell>
                      <TableCell>{division.address || "-"}</TableCell>
                      <TableCell>{division.phoneNumber || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditDivision(division)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteDivision(division.id!)}>
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