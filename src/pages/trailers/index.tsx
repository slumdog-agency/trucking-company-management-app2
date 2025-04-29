import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Schema } from "@/lib/db-types";
import { fine } from "@/lib/fine";
import { useToast } from "@/hooks/use-toast";
import { Edit2, Save, Trash2, Plus, Search, Download, FileText, X } from "lucide-react";
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

export default function TrailersPage() {
  const [trailers, setTrailers] = useState<Schema["trailers"][]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTrailer, setEditingTrailer] = useState<Schema["trailers"] | null>(null);
  const [newTrailer, setNewTrailer] = useState<Schema["trailers"]>({
    number: "",
    category: "Semi",
    type: "",
    length: "",
    vin: "",
    licensePlate: ""
  });
  const [filters, setFilters] = useState<Array<{field: string, value: string, label: string}>>([]);
  const [filterInput, setFilterInput] = useState("");
  const [filterField, setFilterField] = useState("number");
  const [activeColumns, setActiveColumns] = useState<string[]>([
    "number", "category", "type", "length", "vin", "licensePlate"
  ]);
  const [isColumnMenuOpen, setIsColumnMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrailers();
  }, []);

  const fetchTrailers = async () => {
    setLoading(true);
    try {
      const data = await fine.table("trailers").select();
      setTrailers(data || []);
    } catch (error) {
      console.error("Error fetching trailers:", error);
      toast({
        title: "Error",
        description: "Failed to load trailers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (editingTrailer) {
      setEditingTrailer(prev => ({
        ...prev!,
        [name]: value
      }));
    } else {
      setNewTrailer(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (editingTrailer) {
      setEditingTrailer(prev => ({
        ...prev!,
        [name]: value
      }));
    } else {
      setNewTrailer(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleAddTrailer = async () => {
    if (!newTrailer.number) {
      toast({
        title: "Validation Error",
        description: "Trailer number is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const addedTrailers = await fine.table("trailers").insert(newTrailer).select();
      if (addedTrailers && addedTrailers.length > 0) {
        setTrailers([...trailers, addedTrailers[0]]);
        setNewTrailer({
          number: "",
          category: "Semi",
          type: "",
          length: "",
          vin: "",
          licensePlate: ""
        });
        setIsDialogOpen(false);
        toast({
          title: "Success",
          description: "Trailer added successfully.",
        });
      }
    } catch (error) {
      console.error("Error adding trailer:", error);
      toast({
        title: "Error",
        description: "Failed to add trailer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateTrailer = async () => {
    if (!editingTrailer || !editingTrailer.id) return;
    
    if (!editingTrailer.number) {
      toast({
        title: "Validation Error",
        description: "Trailer number is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await fine.table("trailers").update({
        number: editingTrailer.number,
        category: editingTrailer.category,
        type: editingTrailer.type,
        length: editingTrailer.length,
        vin: editingTrailer.vin,
        licensePlate: editingTrailer.licensePlate
      }).eq("id", editingTrailer.id);
      
      setTrailers(trailers.map(trailer => 
        trailer.id === editingTrailer.id ? editingTrailer : trailer
      ));
      
      setEditingTrailer(null);
      setIsDialogOpen(false);
      
      toast({
        title: "Success",
        description: "Trailer updated successfully.",
      });
    } catch (error) {
      console.error("Error updating trailer:", error);
      toast({
        title: "Error",
        description: "Failed to update trailer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTrailer = async (id: number) => {
    if (!confirm("Are you sure you want to delete this trailer?")) return;

    try {
      await fine.table("trailers").delete().eq("id", id);
      setTrailers(trailers.filter(trailer => trailer.id !== id));
      toast({
        title: "Success",
        description: "Trailer deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting trailer:", error);
      toast({
        title: "Error",
        description: "Failed to delete trailer. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleEditTrailer = (trailer: Schema["trailers"]) => {
    setEditingTrailer(trailer);
    setIsDialogOpen(true);
  };

  const addFilter = () => {
    if (!filterInput.trim()) return;
    
    const fieldLabel = {
      number: "Number",
      category: "Category",
      type: "Type",
      length: "Length",
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

  const filteredTrailers = trailers.filter(trailer => {
    if (filters.length === 0) {
      return searchTerm ? 
        Object.values(trailer).some(value => 
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        ) : true;
    }
    
    return filters.every(filter => {
      const value = String(trailer[filter.field as keyof Schema["trailers"]] || "").toLowerCase();
      return value.includes(filter.value.toLowerCase());
    });
  });

  const exportToCSV = () => {
    // Create CSV content
    const headers = activeColumns.map(column => {
      return {
        number: "Number",
        category: "Category",
        type: "Type",
        length: "Length",
        vin: "VIN",
        licensePlate: "License Plate"
      }[column] || column;
    });
    
    const rows = filteredTrailers.map(trailer => {
      return activeColumns.map(column => {
        const value = trailer[column as keyof Schema["trailers"]];
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
    link.setAttribute("download", `trailers-${new Date().toISOString().split('T')[0]}.csv`);
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
      doc.text("Trailers Report", 14, 15);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      
      // Table headers
      const headers = activeColumns.map(column => {
        return {
          number: "Number",
          category: "Category",
          type: "Type",
          length: "Length",
          vin: "VIN",
          licensePlate: "License Plate"
        }[column] || column;
      });
      
      // Table data
      const data = filteredTrailers.map(trailer => {
        return activeColumns.map(column => {
          const value = trailer[column as keyof Schema["trailers"]];
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
      doc.text(`Total Trailers: ${filteredTrailers.length}`, margin, totalY);
      
      // Save PDF
      doc.save(`trailers-${new Date().toISOString().split('T')[0]}.pdf`);
      
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
            <h1 className="text-3xl font-bold tracking-tight">Trailer Management</h1>
            <p className="text-muted-foreground mt-2">
              View and manage all your trailers
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
                placeholder="Search trailers..."
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
                      <option value="type">Type</option>
                      <option value="length">Length</option>
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
                        id="column-type" 
                        checked={activeColumns.includes('type')}
                        onCheckedChange={() => toggleColumn('type')}
                      />
                      <Label htmlFor="column-type">Type</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-length" 
                        checked={activeColumns.includes('length')}
                        onCheckedChange={() => toggleColumn('length')}
                      />
                      <Label htmlFor="column-length">Length</Label>
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
                <Button onClick={() => setEditingTrailer(null)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Trailer
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingTrailer ? "Edit Trailer" : "Add New Trailer"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="number">Trailer Number</Label>
                      <Input
                        id="number"
                        name="number"
                        value={editingTrailer ? editingTrailer.number : newTrailer.number}
                        onChange={handleInputChange}
                        placeholder="TR-456"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        defaultValue="Semi" 
                        disabled={true}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Semi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Semi">Semi</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Trailers are only for Semi trucks
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="type">Type</Label>
                      <Input
                        id="type"
                        name="type"
                        value={editingTrailer ? editingTrailer.type || "" : newTrailer.type || ""}
                        onChange={handleInputChange}
                        placeholder="Dry Van"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="length">Length</Label>
                      <Input
                        id="length"
                        name="length"
                        value={editingTrailer ? editingTrailer.length || "" : newTrailer.length || ""}
                        onChange={handleInputChange}
                        placeholder="53 ft"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vin">VIN</Label>
                      <Input
                        id="vin"
                        name="vin"
                        value={editingTrailer ? editingTrailer.vin || "" : newTrailer.vin || ""}
                        onChange={handleInputChange}
                        placeholder="1UYVS2538YU123456"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="licensePlate">License Plate</Label>
                      <Input
                        id="licensePlate"
                        name="licensePlate"
                        value={editingTrailer ? editingTrailer.licensePlate || "" : newTrailer.licensePlate || ""}
                        onChange={handleInputChange}
                        placeholder="XYZ789"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="button" onClick={editingTrailer ? handleUpdateTrailer : handleAddTrailer}>
                      {editingTrailer ? "Update Trailer" : "Add Trailer"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center p-8">Loading trailer data...</div>
        ) : (
          <div className="border rounded-lg shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  {activeColumns.includes('number') && <TableHead>Number</TableHead>}
                  {activeColumns.includes('category') && <TableHead>Category</TableHead>}
                  {activeColumns.includes('type') && <TableHead>Type</TableHead>}
                  {activeColumns.includes('length') && <TableHead>Length</TableHead>}
                  {activeColumns.includes('vin') && <TableHead>VIN</TableHead>}
                  {activeColumns.includes('licensePlate') && <TableHead>License Plate</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrailers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={activeColumns.length + 1} className="text-center py-8">
                      No trailers found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTrailers.map((trailer) => (
                    <TableRow key={trailer.id}>
                      {activeColumns.includes('number') && <TableCell className="font-medium">{trailer.number}</TableCell>}
                      {activeColumns.includes('category') && <TableCell>{trailer.category}</TableCell>}
                      {activeColumns.includes('type') && <TableCell>{trailer.type || "-"}</TableCell>}
                      {activeColumns.includes('length') && <TableCell>{trailer.length || "-"}</TableCell>}
                      {activeColumns.includes('vin') && <TableCell>{trailer.vin || "-"}</TableCell>}
                      {activeColumns.includes('licensePlate') && <TableCell>{trailer.licensePlate || "-"}</TableCell>}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => handleEditTrailer(trailer)}>
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteTrailer(trailer.id!)}>
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
          &copy; {new Date().getFullYear()} CarrierXXL. All rights reserved.
        </div>
      </footer>
    </div>
  );
}