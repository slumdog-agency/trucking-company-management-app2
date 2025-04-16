import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Schema } from "@/lib/db-types";
import { fine } from "@/lib/fine";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, Trash2, Plus, Search, Download, FileText } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Schema["trucks"][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Schema["trucks"] | null>(null);
  const [newTruck, setNewTruck] = useState<Schema["trucks"]>({
    number: "",
    category: "Semi",
    make: "",
    model: "",
    year: undefined,
    vin: "",
    licensePlate: ""
  });
  const [filters, setFilters] = useState<Array<{field: string, value: string, label: string}>>([]);
  const [filterInput, setFilterInput] = useState("");
  const [filterField, setFilterField] = useState("number");
  const [activeColumns, setActiveColumns] = useState<string[]>([
    "number", "category", "make", "model", "year", "vin", "licensePlate"
  ]);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrucks();
  }, []);

  const fetchTrucks = async () => {
    setLoading(true);
    try {
      const data = await fine.table("trucks").select();
      setTrucks(data || []);
    } catch (error) {
      console.error("Error fetching trucks:", error);
      toast({
        title: "Error",
        description: "Failed to load trucks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = name === 'year' ? (value ? parseInt(value) : undefined) : value;
    
    if (editingTruck) {
      setEditingTruck(prev => ({
        ...prev!,
        [name]: parsedValue
      }));
    } else {
      setNewTruck(prev => ({
        ...prev,
        [name]: parsedValue
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (editingTruck) {
      setEditingTruck(prev => ({
        ...prev!,
        [name]: value
      }));
    } else {
      setNewTruck(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddTruck = async () => {
    if (!newTruck.number) {
      toast({
        title: "Validation Error",
        description: "Truck number is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const addedTrucks = await fine.table("trucks").insert(newTruck).select();
      if (addedTrucks && addedTrucks.length > 0) {
        setTrucks([...trucks, addedTrucks[0]]);
        setNewTruck({
          number: "",
          category: "Semi",
          make: "",
          model: "",
          year: undefined,
          vin: "",
          licensePlate: ""
        });
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Truck added successfully.",
        });
      }
    } catch (error) {
      console.error("Error adding truck:", error);
      toast({
        title: "Error",
        description: "Failed to add truck. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTruck = async () => {
    if (!editingTruck || !editingTruck.id) return;
    
    if (!editingTruck.number) {
      toast({
        title: "Validation Error",
        description: "Truck number is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await fine.table("trucks").update({
        number: editingTruck.number,
        category: editingTruck.category,
        make: editingTruck.make,
        model: editingTruck.model,
        year: editingTruck.year,
        vin: editingTruck.vin,
        licensePlate: editingTruck.licensePlate
      }).eq("id", editingTruck.id);
      
      setTrucks(trucks.map(truck => 
        truck.id === editingTruck.id ? editingTruck : truck
      ));
      
      setEditingTruck(null);
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Truck updated successfully.",
      });
    } catch (error) {
      console.error("Error updating truck:", error);
      toast({
        title: "Error",
        description: "Failed to update truck. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTruck = async (id: number) => {
    if (!confirm("Are you sure you want to delete this truck?")) return;

    try {
      await fine.table("trucks").delete().eq("id", id);
      setTrucks(trucks.filter(truck => truck.id !== id));
      toast({
        title: "Success",
        description: "Truck deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting truck:", error);
      toast({
        title: "Error",
        description: "Failed to delete truck. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTruck = (truck: Schema["trucks"]) => {
    setEditingTruck(truck);
    setIsDialogOpen(true);
  };

  const addFilter = () => {
    if (!filterInput.trim()) return;
    
    const fieldLabel = {
      number: "Number",
      category: "Category",
      make: "Make",
      model: "Model",
      year: "Year",
      vin: "VIN",
      licensePlate: "License Plate"
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

  const filteredTrucks = trucks.filter(truck => {
    if (filters.length === 0) {
      return searchTerm ? 
        Object.values(truck).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        ) : true;
    }
    
    return filters.every(filter => {
      const value = String(truck[filter.field as keyof Schema["trucks"]] || "").toLowerCase();
      return value.includes(filter.value.toLowerCase());
    });
  });

  const exportToCSV = () => {
    // Create CSV content
    const headers = activeColumns.map(column => {
      return {
        number: "Number",
        category: "Category",
        make: "Make",
        model: "Model",
        year: "Year",
        vin: "VIN",
        licensePlate: "License Plate"
      }[column] || column;
    });
    
    const rows = filteredTrucks.map(truck => {
      return activeColumns.map(column => {
        const value = truck[column as keyof Schema["trucks"]];
        return value !== undefined && value !== null ? String(value) : "";
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
    link.setAttribute("download", `trucks-${new Date().toISOString().split('T')[0]}.csv`);
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
      doc.text("Trucks Report", 14, 15);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      
      // Table headers
      const headers = activeColumns.map(column => {
        return {
          number: "Number",
          category: "Category",
          make: "Make",
          model: "Model",
          year: "Year",
          vin: "VIN",
          licensePlate: "License Plate"
        }[column] || column;
      });
      
      // Table data
      const data = filteredTrucks.map(truck => {
        return activeColumns.map(column => {
          const value = truck[column as keyof Schema["trucks"]];
          return value !== undefined && value !== null ? String(value) : "-";
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
      doc.text(`Total Trucks: ${filteredTrucks.length}`, margin, totalY);
      
      // Save PDF
      doc.save(`trucks-${new Date().toISOString().split('T')[0]}.pdf`);
      
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
            <h1 className="text-3xl font-bold tracking-tight">Truck Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all your trucks
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
                placeholder="Search trucks..."
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
                      <option value="number">Number</option>
                      <option value="category">Category</option>
                      <option value="make">Make</option>
                      <option value="model">Model</option>
                      <option value="year">Year</option>
                      <option value="vin">VIN</option>
                      <option value="licensePlate">License Plate</option>
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
                        id="column-number" 
                        checked={activeColumns.includes('number')}
                        onCheckedChange={() => toggleColumn('number')}
                      />
                      <Label htmlFor="column-number">Number</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-category" 
                        checked={activeColumns.includes('category')}
                        onCheckedChange={() => toggleColumn('category')}
                      />
                      <Label htmlFor="column-category">Category</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-make" 
                        checked={activeColumns.includes('make')}
                        onCheckedChange={() => toggleColumn('make')}
                      />
                      <Label htmlFor="column-make">Make</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-model" 
                        checked={activeColumns.includes('model')}
                        onCheckedChange={() => toggleColumn('model')}
                      />
                      <Label htmlFor="column-model">Model</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-year" 
                        checked={activeColumns.includes('year')}
                        onCheckedChange={() => toggleColumn('year')}
                      />
                      <Label htmlFor="column-year">Year</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-vin" 
                        checked={activeColumns.includes('vin')}
                        onCheckedChange={() => toggleColumn('vin')}
                      />
                      <Label htmlFor="column-vin">VIN</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-licensePlate" 
                        checked={activeColumns.includes('licensePlate')}
                        onCheckedChange={() => toggleColumn('licensePlate')}
                      />
                      <Label htmlFor="column-licensePlate">License Plate</Label>
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
                  <X className="h-3 w-3" />
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
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setEditingTruck(null)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Truck
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTruck ? "Edit Truck" : "Add New Truck"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">Truck Number</Label>
                      <Input
                        id="number"
                        name="number"
                        value={editingTruck ? editingTruck.number : newTruck.number}
                        onChange={handleInputChange}
                        placeholder="T-123"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        defaultValue={editingTruck ? editingTruck.category : newTruck.category} 
                        onValueChange={(value) => handleSelectChange("category", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Semi">Semi</SelectItem>
                          <SelectItem value="Box">Box</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="make">Make</Label>
                      <Input
                        id="make"
                        name="make"
                        value={editingTruck ? editingTruck.make || "" : newTruck.make || ""}
                        onChange={handleInputChange}
                        placeholder="Freightliner"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Input
                        id="model"
                        name="model"
                        value={editingTruck ? editingTruck.model || "" : newTruck.model || ""}
                        onChange={handleInputChange}
                        placeholder="Cascadia"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="year">Year</Label>
                      <Input
                        id="year"
                        name="year"
                        type="number"
                        value={editingTruck ? editingTruck.year || "" : newTruck.year || ""}
                        onChange={handleInputChange}
                        placeholder="2023"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vin">VIN</Label>
                      <Input
                        id="vin"
                        name="vin"
                        value={editingTruck ? editingTruck.vin || "" : newTruck.vin || ""}
                        onChange={handleInputChange}
                        placeholder="1FUJA6CV12LK12345"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="licensePlate">License Plate</Label>
                    <Input
                      id="licensePlate"
                      name="licensePlate"
                      value={editingTruck ? editingTruck.licensePlate || "" : newTruck.licensePlate || ""}
                      onChange={handleInputChange}
                      placeholder="ABC123"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={editingTruck ? handleUpdateTruck : handleAddTruck}>
                      {editingTruck ? "Update Truck" : "Add Truck"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">Loading truck data...</div>
        ) : (
          <div className="border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeColumns.includes('number') && <TableHead>Number</TableHead>}
                  {activeColumns.includes('category') && <TableHead>Category</TableHead>}
                  {activeColumns.includes('make') && activeColumns.includes('model') && <TableHead>Make/Model</TableHead>}
                  {activeColumns.includes('make') && !activeColumns.includes('model') && <TableHead>Make</TableHead>}
                  {!activeColumns.includes('make') && activeColumns.includes('model') && <TableHead>Model</TableHead>}
                  {activeColumns.includes('year') && <TableHead>Year</TableHead>}
                  {activeColumns.includes('vin') && <TableHead>VIN</TableHead>}
                  {activeColumns.includes('licensePlate') && <TableHead>License Plate</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrucks.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeColumns.length + 1} className="text-center py-8">
                      No trucks found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrucks.map((truck) => (
                    <TableRow key={truck.id}>
                      {activeColumns.includes('number') && <TableCell className="font-medium">{truck.number}</TableCell>}
                      {activeColumns.includes('category') && <TableCell>{truck.category}</TableCell>}
                      {activeColumns.includes('make') && activeColumns.includes('model') && (
                        <TableCell>
                          {truck.make && truck.model 
                            ? `${truck.make} ${truck.model}` 
                            : truck.make || truck.model || "-"}
                        </TableCell>
                      )}
                      {activeColumns.includes('make') && !activeColumns.includes('model') && <TableCell>{truck.make || "-"}</TableCell>}
                      {!activeColumns.includes('make') && activeColumns.includes('model') && <TableCell>{truck.model || "-"}</TableCell>}
                      {activeColumns.includes('year') && <TableCell>{truck.year || "-"}</TableCell>}
                      {activeColumns.includes('vin') && <TableCell>{truck.vin || "-"}</TableCell>}
                      {activeColumns.includes('licensePlate') && <TableCell>{truck.licensePlate || "-"}</TableCell>}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditTruck(truck)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteTruck(truck.id!)}>
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