import { useState, useEffect, useRef } from "react";
import { Schema } from "@/lib/db-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DriverRow } from "./DriverRow";
import { getWeekDays, formatCurrency, getAppSettings } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  FileText, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  SlidersHorizontal
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import { getDrivers, getRoutes, getTrucks, getTrailers, updateDriver, deleteDriver, addRoute, updateRoute, deleteRoute } from "@/lib/api";

interface DriverTableProps {
  currentDate: Date;
}

type FilterType = {
  field: string;
  value: string;
  label: string;
};

export function DriverTable({ currentDate }: DriverTableProps) {
  const [drivers, setDrivers] = useState<Schema["drivers"][]>([]);
  const [routes, setRoutes] = useState<Schema["routes"][]>([]);
  const [trucks, setTrucks] = useState<Schema["trucks"][]>([]);
  const [trailers, setTrailers] = useState<Schema["trailers"][]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterType[]>([]);
  const [filterInput, setFilterInput] = useState("");
  const [filterField, setFilterField] = useState("first_name");
  const [activeFilters, setActiveFilters] = useState<string[]>([
    'count',
    'percentage',
    'first_name',
    'last_name',
    'phone',
    'dispatcher'
  ]);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const weekDays = getWeekDays(currentDate);
  const tableRef = useRef<HTMLTableElement>(null);
  const [showWeeklyTotals, setShowWeeklyTotals] = useState(true);

  useEffect(() => {
    const settings = getAppSettings();
    setShowWeeklyTotals(settings.showWeeklyTotals);
  }, []);

  // Fetch drivers and routes for the current week
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get start and end dates for the week
        const startDate = weekDays[0].fullDate;
        const endDate = weekDays[6].fullDate;
        
        // Fetch drivers
        const driversData = await getDrivers();
        
        // Sort drivers by count
        const sortedDrivers = driversData ? [...driversData].sort((a, b) => a.count - b.count) : [];
        setDrivers(sortedDrivers);
        
        // Fetch trucks and trailers
        const trucksData = await getTrucks();
        setTrucks(trucksData || []);
        
        const trailersData = await getTrailers();
        setTrailers(trailersData || []);
        
        // Fetch routes
        const routesData = await getRoutes();
        
        // Filter routes for the current week
        const weekRoutes = routesData.filter((route: Schema["routes"]) => 
          route.date >= startDate && route.date <= endDate
        );
        
        setRoutes(weekRoutes || []);
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
  }, [currentDate, toast]);

  const addFilter = () => {
    if (!filterInput.trim()) return;
    
    const fieldLabel = {
      count: "Count",
      percentage: "Percentage",
      first_name: "First Name",
      last_name: "Last Name",
      phone: "Phone",
      dispatcher: "Dispatcher"
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

  const toggleFilterField = (field: string) => {
    if (activeFilters.includes(field)) {
      setActiveFilters(activeFilters.filter(f => f !== field));
    } else {
      setActiveFilters([...activeFilters, field]);
    }
  };

  const filteredDrivers = drivers.filter(driver => {
    if (filters.length === 0) return true;
    
    return filters.every(filter => {
      const value = String(driver[filter.field as keyof Schema["drivers"]] || "").toLowerCase();
      return value.includes(filter.value.toLowerCase());
    });
  });

  const handleAddRoute = async (route: Schema["routes"]) => {
    try {
      const addedRoute = await addRoute({
        ...route,
        last_comment_by: "System" // TODO: Replace with actual user name
      });
      setRoutes([...routes, addedRoute]);
      toast({
        title: "Success",
        description: "Route added successfully.",
      });
    } catch (error) {
      console.error("Error adding route:", error);
      toast({
        title: "Error",
        description: "Failed to add route. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRoute = async (id: number, route: Schema["routes"]) => {
    try {
      const updatedRoute = await updateRoute(id, {
        ...route,
        last_edited_by: "System" // TODO: Replace with actual user name
      });
      setRoutes(routes.map(r => r.id === id ? updatedRoute : r));
      toast({
        title: "Success",
        description: "Route updated successfully.",
      });
    } catch (error) {
      console.error("Error updating route:", error);
      toast({
        title: "Error",
        description: "Failed to update route. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRoute = async (id: number) => {
    try {
      await deleteRoute(id, "System"); // TODO: Replace with actual user name
      setRoutes(routes.filter(r => r.id !== id));
      toast({
        title: "Success",
        description: "Route deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting route:", error);
      toast({
        title: "Error",
        description: "Failed to delete route. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDriver = async (id: number, data: Partial<Schema["drivers"]>) => {
    try {
      const updatedDriver = await updateDriver(id, data);
      setDrivers(drivers.map(driver => 
        driver.id === id ? { ...driver, ...updatedDriver } : driver
      ));
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

  const handleDeleteDriver = async (id: number) => {
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

  const exportToCSV = () => {
    // Create CSV content
    const headers = [
      "#", 
      "%", 
      "Driver Name", 
      "Phone",
      "Dispatcher", 
      ...weekDays.map(day => `${day.dayName} ${day.dayNumber}`),
      "Total Gross",
      "Gross Difference",
      "Percentage Income",
      "Total Earnings"
    ];
    
    const rows = filteredDrivers.map(driver => {
      const driverRoutes = routes.filter(route => route.driver_id === driver.id);
      
      // Calculate weekly total gross
      const weeklyTotalGross = driverRoutes.reduce((total, route) => {
        return total + route.rate;
      }, 0);
      
      // Calculate gross difference
      const grossDifference = driverRoutes.reduce((total, route) => {
        return total + (route.sold_for ? route.rate - route.sold_for : 0);
      }, 0);
      
      // Calculate percentage income
      const percentageIncome = driverRoutes.reduce((total, route) => {
        return total + (route.sold_for ? route.sold_for * (driver.percentage / 100) : 0);
      }, 0);
      
      // Calculate total earnings
      const totalEarnings = grossDifference + percentageIncome;
      
      // Create daily route summaries
      const dailyRoutes = weekDays.map(day => {
        const dayRoutes = driverRoutes.filter(route => route.date === day.fullDate);
        if (dayRoutes.length === 0) return "";
        
        return dayRoutes.map(route => 
          `${route.pickup_state || ''}-${route.delivery_state || ''} $${route.rate}`
        ).join("; ");
      });
      
      return [
        driver.count,
        `${driver.percentage}%`,
        `${driver.first_name} ${driver.last_name}`,
        driver.phone || "",
        driver.dispatcher || "",
        ...dailyRoutes,
        `$${weeklyTotalGross.toFixed(2)}`,
        `$${grossDifference.toFixed(2)}`,
        `$${percentageIncome.toFixed(2)}`,
        `$${totalEarnings.toFixed(2)}`
      ];
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
    link.setAttribute("download", `trucking-dashboard-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });
      
      // Add title
      doc.setFontSize(16);
      doc.text("Trucking Dashboard Report", 14, 15);
      doc.setFontSize(12);
      doc.text(`Week of ${weekDays[0].fullDate} to ${weekDays[6].fullDate}`, 14, 22);
      
      // Add date
      doc.setFontSize(10);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 28);
      
      // Table headers
      const headers = [
        "#", "%", "Driver", "Phone", "Dispatcher", "Total Gross", "Earnings"
      ];
      
      // Table data
      const data = filteredDrivers.map(driver => {
        const driverRoutes = routes.filter(route => route.driver_id === driver.id);
        
        // Calculate weekly total gross
        const weeklyTotalGross = driverRoutes.reduce((total, route) => {
          return total + route.rate;
        }, 0);
        
        // Calculate total earnings
        const grossDifference = driverRoutes.reduce((total, route) => {
          return total + (route.sold_for ? route.rate - route.sold_for : 0);
        }, 0);
        
        const percentageIncome = driverRoutes.reduce((total, route) => {
          return total + (route.sold_for ? route.sold_for * (driver.percentage / 100) : 0);
        }, 0);
        
        const totalEarnings = grossDifference + percentageIncome;
        
        return [
          driver.count.toString(),
          `${driver.percentage}%`,
          `${driver.first_name} ${driver.last_name}`,
          driver.phone || "-",
          driver.dispatcher || "-",
          formatCurrency(weeklyTotalGross),
          formatCurrency(totalEarnings)
        ];
      });
      
      // Draw table
      doc.setFontSize(10);
      
      // Table settings
      const startY = 35;
      const margin = 14;
      const cellPadding = 2;
      const cellWidth = (doc.internal.pageSize.getWidth() - margin * 2) / headers.length;
      const cellHeight = 10;
      
      // Draw header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, startY, doc.internal.pageSize.getWidth() - margin * 2, cellHeight, 'F');
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
          doc.rect(margin, y, doc.internal.pageSize.getWidth() - margin * 2, cellHeight, 'F');
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
      doc.text(`Total Drivers: ${filteredDrivers.length}`, margin, totalY);
      
      // Calculate totals
      const totalGross = routes.reduce((total, route) => total + route.rate, 0);
      const totalEarnings = routes.reduce((total, route) => {
        if (!route.sold_for) return total;
        const driver = drivers.find(d => d.id === route.driver_id);
        const grossDiff = route.rate - route.sold_for;
        const percentIncome = driver ? route.sold_for * (driver.percentage / 100) : 0;
        return total + grossDiff + percentIncome;
      }, 0);
      
      doc.text(`Total Gross: ${formatCurrency(totalGross)}`, margin, totalY + 7);
      doc.text(`Total Earnings: ${formatCurrency(totalEarnings)}`, margin, totalY + 14);
      
      // Save PDF
      doc.save(`trucking-dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
      
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

  const handleViewDriverProfile = (driverId: number) => {
    navigate(`/drivers/${driverId}`);
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading driver data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {/* Filters */}
        <div className="flex-1 flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-1" />
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
                      <option value="count">Count</option>
                      <option value="percentage">Percentage</option>
                      <option value="first_name">First Name</option>
                      <option value="last_name">Last Name</option>
                      <option value="phone">Phone</option>
                      <option value="dispatcher">Dispatcher</option>
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
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-1" />
                  Columns
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-56">
                <div className="space-y-2">
                  <h4 className="font-medium mb-2">Toggle Columns</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-count" 
                        checked={activeFilters.includes('count')}
                        onCheckedChange={() => toggleFilterField('count')}
                      />
                      <Label htmlFor="column-count">Count</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-percentage" 
                        checked={activeFilters.includes('percentage')}
                        onCheckedChange={() => toggleFilterField('percentage')}
                      />
                      <Label htmlFor="column-percentage">Percentage</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-first_name" 
                        checked={activeFilters.includes('first_name')}
                        onCheckedChange={() => toggleFilterField('first_name')}
                      />
                      <Label htmlFor="column-first_name">First Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-last_name" 
                        checked={activeFilters.includes('last_name')}
                        onCheckedChange={() => toggleFilterField('last_name')}
                      />
                      <Label htmlFor="column-last_name">Last Name</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-phone" 
                        checked={activeFilters.includes('phone')}
                        onCheckedChange={() => toggleFilterField('phone')}
                      />
                      <Label htmlFor="column-phone">Phone</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="column-dispatcher" 
                        checked={activeFilters.includes('dispatcher')}
                        onCheckedChange={() => toggleFilterField('dispatcher')}
                      />
                      <Label htmlFor="column-dispatcher">Dispatcher</Label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
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
        
        {/* Export buttons */}
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
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm driver-table" ref={tableRef}>
          <thead>
            <tr className="bg-muted">
              {activeFilters.includes('count') && (
                <th className="p-2 text-left font-medium text-muted-foreground w-12">#</th>
              )}
              {activeFilters.includes('percentage') && (
                <th className="p-2 text-left font-medium text-muted-foreground w-20">%</th>
              )}
              {(activeFilters.includes('first_name') || activeFilters.includes('last_name')) && (
                <th className="p-2 text-left font-medium text-muted-foreground">Driver Name</th>
              )}
              {activeFilters.includes('phone') && (
                <th className="p-2 text-left font-medium text-muted-foreground">Phone</th>
              )}
              {activeFilters.includes('dispatcher') && (
                <th className="p-2 text-left font-medium text-muted-foreground">Dispatcher</th>
              )}
              
              {/* Days of the week */}
              {weekDays.map((day) => (
                <th 
                  key={day.fullDate} 
                  className={`p-2 text-center font-medium text-muted-foreground border-l border-border min-w-[110px] ${day.isToday ? 'bg-muted/50' : ''}`}
                >
                  <div>{day.dayName}</div>
                  <div className="text-sm">{day.dayNumber}</div>
                </th>
              ))}
              
              {showWeeklyTotals && (
                <>
                  <th className="p-2 text-right font-medium text-muted-foreground border-l border-border w-24">Total Gross</th>
                  <th className="p-2 text-right font-medium text-muted-foreground border-l border-border w-24">Gross Difference</th>
                  <th className="p-2 text-right font-medium text-muted-foreground border-l border-border w-24">Percentage Income</th>
                  <th className="p-2 text-right font-medium text-muted-foreground border-l border-border w-24">Total Earnings</th>
                </>
              )}
              <th className="p-2 text-right font-medium text-muted-foreground w-20">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((driver) => (
              <DriverRow 
                key={driver.id} 
                driver={driver} 
                weekDays={weekDays}
                routes={routes}
                trucks={trucks}
                trailers={trailers}
                onUpdateDriver={handleUpdateDriver}
                onDeleteDriver={handleDeleteDriver}
                onAddRoute={handleAddRoute}
                onUpdateRoute={handleUpdateRoute}
                onDeleteRoute={handleDeleteRoute}
                activeFilters={activeFilters}
                onViewProfile={handleViewDriverProfile}
                showWeeklyTotals={showWeeklyTotals}
              />
            ))}
          </tbody>
          
          {showWeeklyTotals && (
            <tfoot>
              <tr className="bg-muted/50">
                {/* Individual cells for each filter column */}
                {activeFilters.includes('count') && (
                  <td className="p-2 font-medium">
                    Total: {filteredDrivers.length}
                  </td>
                )}
                {activeFilters.includes('percentage') && (
                  <td className="p-2"></td>
                )}
                {(activeFilters.includes('first_name') || activeFilters.includes('last_name')) && (
                  <td className="p-2"></td>
                )}
                {activeFilters.includes('phone') && (
                  <td className="p-2"></td>
                )}
                {activeFilters.includes('dispatcher') && (
                  <td className="p-2"></td>
                )}
                
                {/* Individual cells for each day of the week */}
                {weekDays.map((day) => (
                  <td key={day.fullDate} className="p-2 text-right font-medium border-l border-border"></td>
                ))}
                
                {/* Total Gross */}
                <td className="p-2 text-right font-medium border-l border-border">
                  {formatCurrency(routes.reduce((total, route) => total + route.rate, 0))}
                </td>
                
                {/* Gross Difference */}
                <td className="p-2 text-right font-medium border-l border-border">
                  {formatCurrency(routes.reduce((total, route) => 
                    total + (route.sold_for ? route.rate - route.sold_for : 0), 0))}
                </td>
                
                {/* Percentage Income */}
                <td className="p-2 text-right font-medium border-l border-border">
                  {formatCurrency(routes.reduce((total, route) => {
                    const driver = drivers.find(d => d.id === route.driver_id);
                    return total + (route.sold_for && driver ? route.sold_for * (driver.percentage / 100) : 0);
                  }, 0))}
                </td>
                
                {/* Total Earnings */}
                <td className="p-2 text-right font-medium border-l border-border">
                  {formatCurrency(routes.reduce((total, route) => {
                    const driver = drivers.find(d => d.id === route.driver_id);
                    const grossDiff = route.sold_for ? route.rate - route.sold_for : 0;
                    const percentIncome = route.sold_for && driver ? route.sold_for * (driver.percentage / 100) : 0;
                    return total + grossDiff + percentIncome;
                  }, 0))}
                </td>
                
                {/* Empty cell for actions column */}
                <td className="p-2"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}