import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Upload, FileText, Settings2, Plus, Search, Edit2, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { fine } from "@/lib/fine";
import { saveAppSettings, getAppSettings, clearTables } from "@/lib/utils";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Schema } from "@/lib/db-types";
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
import { 
  getDivisions, 
  addDivision, 
  updateDivision, 
  deleteDivision,
  getDispatchers,
  addDispatcher,
  updateDispatcher,
  deleteDispatcher,
  getRouteStatuses,
  addRouteStatus,
  updateRouteStatus,
  deleteRouteStatus
} from "@/lib/api";

export default function SettingsPage() {
  const { toast } = useToast();
  const [companySettings, setCompanySettings] = useState({
    companyName: "My Trucking Company",
    contactEmail: "contact@example.com",
    contactPhone: "(555) 123-4567",
    address: "123 Trucking Lane, Anytown, USA"
  });
  const [appSettings, setAppSettings] = useState({
    defaultDriverPercentage: 25,
    showWeeklyTotals: true,
    enableNotifications: true
  });
  
  // Divisions state
  const [divisions, setDivisions] = useState<Schema["divisions"][]>([]);
  const [divisionSearchTerm, setDivisionSearchTerm] = useState("");
  const [isDivisionDialogOpen, setIsDivisionDialogOpen] = useState(false);
  const [editingDivision, setEditingDivision] = useState<Schema["divisions"] | null>(null);
  const [divisionFormData, setDivisionFormData] = useState<Schema["divisions"]>({
    name: "",
    description: "",
    mc: "",
    dot: "",
    address: "",
    phone_number: ""
  });

  // Dispatchers state
  const [dispatchers, setDispatchers] = useState<Schema["dispatchers"][]>([]);
  const [dispatcherSearchTerm, setDispatcherSearchTerm] = useState("");
  const [isDispatcherDialogOpen, setIsDispatcherDialogOpen] = useState(false);
  const [editingDispatcher, setEditingDispatcher] = useState<Schema["dispatchers"] | null>(null);
  const [dispatcherFormData, setDispatcherFormData] = useState<Schema["dispatchers"]>({
    first_name: "",
    last_name: "",
    email: "",
    phone: ""
  });

  // Route Statuses state
  const [routeStatuses, setRouteStatuses] = useState<Schema["route_statuses"][]>([]);
  const [routeStatusSearchTerm, setRouteStatusSearchTerm] = useState("");
  const [isRouteStatusDialogOpen, setIsRouteStatusDialogOpen] = useState(false);
  const [editingRouteStatus, setEditingRouteStatus] = useState<Schema["route_statuses"] | null>(null);
  const [routeStatusFormData, setRouteStatusFormData] = useState<Schema["route_statuses"]>({
    name: "",
    color: "#4169E1",
    is_default: false,
    sort_order: 0
  });

  const [loading, setLoading] = useState({
    divisions: true,
    dispatchers: true,
    routeStatuses: true
  });

  // Load settings and data on mount
  useEffect(() => {
    const savedSettings = getAppSettings();
    setAppSettings(prev => ({
      ...prev,
      defaultDriverPercentage: savedSettings.defaultDriverPercentage || 25,
      showWeeklyTotals: savedSettings.showWeeklyTotals !== undefined ? savedSettings.showWeeklyTotals : true,
      enableNotifications: savedSettings.enableNotifications !== undefined ? savedSettings.enableNotifications : true
    }));

    setCompanySettings(prev => ({
      ...prev,
      companyName: savedSettings.companyName || "My Trucking Company",
      contactEmail: savedSettings.contactEmail || "contact@example.com",
      contactPhone: savedSettings.contactPhone || "(555) 123-4567",
      address: savedSettings.address || "123 Trucking Lane, Anytown, USA"
    }));

    fetchDivisions();
    fetchDispatchers();
    fetchRouteStatuses();
  }, []);

  const fetchDivisions = async () => {
    setLoading(prev => ({ ...prev, divisions: true }));
    try {
      const data = await getDivisions();
      setDivisions(data || []);
    } catch (error) {
      console.error("Error fetching divisions:", error);
      toast({
        title: "Error",
        description: "Failed to load divisions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, divisions: false }));
    }
  };

  const fetchDispatchers = async () => {
    setLoading(prev => ({ ...prev, dispatchers: true }));
    try {
      const data = await getDispatchers();
      setDispatchers(data || []);
    } catch (error) {
      console.error("Error fetching dispatchers:", error);
      toast({
        title: "Error",
        description: "Failed to load dispatchers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, dispatchers: false }));
    }
  };

  const fetchRouteStatuses = async () => {
    setLoading(prev => ({ ...prev, routeStatuses: true }));
    try {
      const data = await getRouteStatuses();
      setRouteStatuses(data || []);
    } catch (error) {
      console.error("Error fetching route statuses:", error);
      toast({
        title: "Error",
        description: "Failed to load route statuses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, routeStatuses: false }));
    }
  };

  const handleCompanySettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanySettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAppSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAppSettings(prev => ({
      ...prev,
      [name]: name === 'defaultDriverPercentage' ? parseInt(value) : value
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setAppSettings(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSaveSettings = () => {
    // Save both app settings and company settings to localStorage
    saveAppSettings({
      ...appSettings,
      companyName: companySettings.companyName,
      contactEmail: companySettings.contactEmail,
      contactPhone: companySettings.contactPhone,
      address: companySettings.address
    });
    
    // Dispatch event to notify components of settings change
    window.dispatchEvent(new Event('app-settings-changed'));
    
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  const handleAddDivision = async () => {
    if (!divisionFormData.name) {
      toast({
        title: "Validation Error",
        description: "Division name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDivision(divisionFormData);
      await fetchDivisions();
      setDivisionFormData({
        name: "",
        description: "",
        mc: "",
        dot: "",
        address: "",
        phone_number: ""
      });
      setIsDivisionDialogOpen(false);
      toast({
        title: "Success",
        description: "Division added successfully.",
      });
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
    
    if (!divisionFormData.name) {
      toast({
        title: "Validation Error",
        description: "Division name is required.",
        variant: "destructive",
      });
      return;
    }
        
    try {
      await updateDivision(editingDivision.id, divisionFormData);
      await fetchDivisions();
      setEditingDivision(null);
      setIsDivisionDialogOpen(false);
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
      await deleteDivision(id);
      await fetchDivisions();
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
    setDivisionFormData(division);
    setIsDivisionDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingDivision(null);
    setDivisionFormData({
      name: "",
      description: "",
      mc: "",
      dot: "",
      address: "",
      phone_number: ""
    });
    setIsDivisionDialogOpen(true);
  };

  const filteredDivisions = divisions.filter(division => {
    const searchString = `${division.name} ${division.mc || ''} ${division.dot || ''}`.toLowerCase();
    return searchString.includes(divisionSearchTerm.toLowerCase());
  });

  const handleAddDispatcher = async () => {
    if (!dispatcherFormData.first_name || !dispatcherFormData.last_name) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDispatcher(dispatcherFormData);
      await fetchDispatchers();
      setDispatcherFormData({
        first_name: "",
        last_name: "",
        email: "",
        phone: ""
      });
      setIsDispatcherDialogOpen(false);
      toast({
        title: "Success",
        description: "Dispatcher added successfully.",
      });
    } catch (error) {
      console.error("Error adding dispatcher:", error);
      toast({
        title: "Error",
        description: "Failed to add dispatcher. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateDispatcher = async () => {
    if (!editingDispatcher || !editingDispatcher.id) return;
    
    if (!dispatcherFormData.first_name || !dispatcherFormData.last_name) {
      toast({
        title: "Validation Error",
        description: "First name and last name are required.",
        variant: "destructive",
      });
      return;
    }
        
    try {
      await updateDispatcher(editingDispatcher.id, dispatcherFormData);
      await fetchDispatchers();
      setEditingDispatcher(null);
      setIsDispatcherDialogOpen(false);
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
      await deleteDispatcher(id);
      await fetchDispatchers();
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
    setDispatcherFormData(dispatcher);
    setIsDispatcherDialogOpen(true);
  };

  const handleAddRouteStatus = async () => {
    if (!routeStatusFormData.name) {
      toast({
        title: "Validation Error",
        description: "Status name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Set the sort order to be the highest + 1
      const maxSortOrder = routeStatuses.reduce((max, status) => 
        Math.max(max, status.sort_order || 0), 0);
      
      const newStatus = {
        ...routeStatusFormData,
        sort_order: maxSortOrder + 1
      };
      
      await addRouteStatus(newStatus);
      await fetchRouteStatuses();
      setRouteStatusFormData({
        name: "",
        color: "#4169E1",
        is_default: false,
        sort_order: 0
      });
      setIsRouteStatusDialogOpen(false);
      toast({
        title: "Success",
        description: "Route status added successfully.",
      });
    } catch (error) {
      console.error("Error adding route status:", error);
      toast({
        title: "Error",
        description: "Failed to add route status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateRouteStatus = async () => {
    if (!editingRouteStatus || !editingRouteStatus.id) return;
    
    if (!routeStatusFormData.name) {
      toast({
        title: "Validation Error",
        description: "Status name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      await updateRouteStatus(editingRouteStatus.id, routeStatusFormData);
      await fetchRouteStatuses();
      setEditingRouteStatus(null);
      setIsRouteStatusDialogOpen(false);
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

  const handleDeleteRouteStatus = async (id: number) => {
    if (!confirm("Are you sure you want to delete this route status? This may affect existing routes.")) return;

    try {
      await deleteRouteStatus(id);
      await fetchRouteStatuses();
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

  const handleEditRouteStatus = (status: Schema["route_statuses"]) => {
    setEditingRouteStatus(status);
    setRouteStatusFormData(status);
    setIsRouteStatusDialogOpen(true);
  };

  const handleMoveRouteStatusUp = async (index: number) => {
    if (index <= 0) return;
    
    try {
      const currentStatus = routeStatuses[index];
      const previousStatus = routeStatuses[index - 1];
      
      // Swap sort orders
      const tempOrder = currentStatus.sort_order;
      await updateRouteStatus(currentStatus.id!, { sort_order: previousStatus.sort_order });
      await updateRouteStatus(previousStatus.id!, { sort_order: tempOrder });
      
      await fetchRouteStatuses();
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

  const handleMoveRouteStatusDown = async (index: number) => {
    if (index >= routeStatuses.length - 1) return;
    
    try {
      const currentStatus = routeStatuses[index];
      const nextStatus = routeStatuses[index + 1];
      
      // Swap sort orders
      const tempOrder = currentStatus.sort_order;
      await updateRouteStatus(currentStatus.id!, { sort_order: nextStatus.sort_order });
      await updateRouteStatus(nextStatus.id!, { sort_order: tempOrder });
      
      await fetchRouteStatuses();
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

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Manage your company settings and preferences
            </p>
          </div>
          <Button asChild>
            <Link to="/">
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="company">
          <TabsList>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="divisions">Divisions</TabsTrigger>
            <TabsTrigger value="dispatchers">Dispatchers</TabsTrigger>
            <TabsTrigger value="route-statuses">Route Statuses</TabsTrigger>
            <TabsTrigger value="app">App Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Update your company details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={companySettings.companyName}
                    onChange={handleCompanySettingsChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Contact Email</Label>
                  <Input
                    id="contactEmail"
                    name="contactEmail"
                    type="email"
                    value={companySettings.contactEmail}
                    onChange={handleCompanySettingsChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={companySettings.contactPhone}
                    onChange={handleCompanySettingsChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    value={companySettings.address}
                    onChange={handleCompanySettingsChange}
                  />
                </div>
                <Button onClick={handleSaveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="divisions">
            <Card>
              <CardHeader>
                <CardTitle>Divisions Management</CardTitle>
                <CardDescription>
                  Manage your company's divisions and their information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search divisions..."
                      className="pl-8"
                      value={divisionSearchTerm}
                      onChange={(e) => setDivisionSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={isDivisionDialogOpen} onOpenChange={setIsDivisionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingDivision(null);
                        setDivisionFormData({
                          name: "",
                          description: "",
                          mc: "",
                          dot: "",
                          address: "",
                          phone_number: ""
                        });
                      }}>
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
                          <Label htmlFor="name">Division Name</Label>
                          <Input
                            id="name"
                            value={divisionFormData.name}
                            onChange={(e) => setDivisionFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter division name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="description">Description</Label>
                          <Input
                            id="description"
                            value={divisionFormData.description}
                            onChange={(e) => setDivisionFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter division description"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="mc">MC Number</Label>
                            <Input
                              id="mc"
                              value={divisionFormData.mc}
                              onChange={(e) => setDivisionFormData(prev => ({ ...prev, mc: e.target.value }))}
                              placeholder="MC-XXXXXX"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="dot">DOT Number</Label>
                            <Input
                              id="dot"
                              value={divisionFormData.dot}
                              onChange={(e) => setDivisionFormData(prev => ({ ...prev, dot: e.target.value }))}
                              placeholder="XXXXXXX"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={divisionFormData.address}
                            onChange={(e) => setDivisionFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Enter address"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone_number">Phone Number</Label>
                          <Input
                            id="phone_number"
                            value={divisionFormData.phone_number}
                            onChange={(e) => setDivisionFormData(prev => ({ ...prev, phone_number: e.target.value }))}
                            placeholder="(XXX) XXX-XXXX"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsDivisionDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={editingDivision ? handleUpdateDivision : handleAddDivision}>
                            {editingDivision ? "Update Division" : "Add Division"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {loading.divisions ? (
                  <div className="flex justify-center p-8">Loading division data...</div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Division Name</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>MC Number</TableHead>
                          <TableHead>DOT Number</TableHead>
                          <TableHead>Address</TableHead>
                          <TableHead>Phone Number</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {divisions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8">
                              No divisions found
                            </TableCell>
                          </TableRow>
                        ) : (
                          divisions
                            .filter(division => 
                              division.name.toLowerCase().includes(divisionSearchTerm.toLowerCase()) ||
                              (division.mc?.toLowerCase() || '').includes(divisionSearchTerm.toLowerCase()) ||
                              (division.dot?.toLowerCase() || '').includes(divisionSearchTerm.toLowerCase())
                            )
                            .map((division) => (
                              <TableRow key={division.id}>
                                <TableCell className="font-medium">{division.name}</TableCell>
                                <TableCell>{division.description || "-"}</TableCell>
                                <TableCell>{division.mc || "-"}</TableCell>
                                <TableCell>{division.dot || "-"}</TableCell>
                                <TableCell>{division.address || "-"}</TableCell>
                                <TableCell>{division.phone_number || "-"}</TableCell>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dispatchers">
            <Card>
              <CardHeader>
                <CardTitle>Dispatchers Management</CardTitle>
                <CardDescription>
                  Manage your company's dispatchers and their information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search dispatchers..."
                      className="pl-8"
                      value={dispatcherSearchTerm}
                      onChange={(e) => setDispatcherSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={isDispatcherDialogOpen} onOpenChange={setIsDispatcherDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingDispatcher(null);
                        setDispatcherFormData({
                          first_name: "",
                          last_name: "",
                          email: "",
                          phone: ""
                        });
                      }}>
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
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="first_name">First Name</Label>
                            <Input
                              id="first_name"
                              value={dispatcherFormData.first_name}
                              onChange={(e) => setDispatcherFormData(prev => ({ ...prev, first_name: e.target.value }))}
                              placeholder="John"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="last_name">Last Name</Label>
                            <Input
                              id="last_name"
                              value={dispatcherFormData.last_name}
                              onChange={(e) => setDispatcherFormData(prev => ({ ...prev, last_name: e.target.value }))}
                              placeholder="Doe"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={dispatcherFormData.email}
                            onChange={(e) => setDispatcherFormData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="john.doe@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={dispatcherFormData.phone}
                            onChange={(e) => setDispatcherFormData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder="(XXX) XXX-XXXX"
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsDispatcherDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={editingDispatcher ? handleUpdateDispatcher : handleAddDispatcher}>
                            {editingDispatcher ? "Update Dispatcher" : "Add Dispatcher"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {loading.dispatchers ? (
                  <div className="flex justify-center p-8">Loading dispatcher data...</div>
                ) : (
                  <div className="border rounded-lg">
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
                        {dispatchers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-8">
                              No dispatchers found
                            </TableCell>
                          </TableRow>
                        ) : (
                          dispatchers
                            .filter(dispatcher => 
                              `${dispatcher.first_name} ${dispatcher.last_name}`.toLowerCase().includes(dispatcherSearchTerm.toLowerCase()) ||
                              (dispatcher.email?.toLowerCase() || '').includes(dispatcherSearchTerm.toLowerCase()) ||
                              (dispatcher.phone?.toLowerCase() || '').includes(dispatcherSearchTerm.toLowerCase())
                            )
                            .map((dispatcher) => (
                              <TableRow key={dispatcher.id}>
                                <TableCell className="font-medium">{`${dispatcher.first_name} ${dispatcher.last_name}`}</TableCell>
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="route-statuses">
            <Card>
              <CardHeader>
                <CardTitle>Route Statuses Management</CardTitle>
                <CardDescription>
                  Manage your route statuses and their colors
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="relative max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search route statuses..."
                      className="pl-8"
                      value={routeStatusSearchTerm}
                      onChange={(e) => setRouteStatusSearchTerm(e.target.value)}
                    />
                  </div>
                  <Dialog open={isRouteStatusDialogOpen} onOpenChange={setIsRouteStatusDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => {
                        setEditingRouteStatus(null);
                        setRouteStatusFormData({
                          name: "",
                          color: "#4169E1",
                          is_default: false,
                          sort_order: 0
                        });
                      }}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Route Status
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>
                          {editingRouteStatus ? "Edit Route Status" : "Add New Route Status"}
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Status Name</Label>
                          <Input
                            id="name"
                            value={routeStatusFormData.name}
                            onChange={(e) => setRouteStatusFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Enter status name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="color">Color</Label>
                          <Input
                            id="color"
                            type="color"
                            value={routeStatusFormData.color}
                            onChange={(e) => setRouteStatusFormData(prev => ({ ...prev, color: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="is_default"
                            checked={routeStatusFormData.is_default}
                            onCheckedChange={(checked) => setRouteStatusFormData(prev => ({ ...prev, is_default: checked }))}
                          />
                          <Label htmlFor="is_default">Set as Default Status</Label>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsRouteStatusDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button onClick={editingRouteStatus ? handleUpdateRouteStatus : handleAddRouteStatus}>
                            {editingRouteStatus ? "Update Status" : "Add Status"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {loading.routeStatuses ? (
                  <div className="flex justify-center p-8">Loading route status data...</div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Status Name</TableHead>
                          <TableHead>Color</TableHead>
                          <TableHead>Default</TableHead>
                          <TableHead>Order</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {routeStatuses.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8">
                              No route statuses found
                            </TableCell>
                          </TableRow>
                        ) : (
                          routeStatuses
                            .filter(status => 
                              status.name.toLowerCase().includes(routeStatusSearchTerm.toLowerCase())
                            )
                            .map((status, index) => (
                              <TableRow key={status.id}>
                                <TableCell className="font-medium">{status.name}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    <div 
                                      className="w-6 h-6 rounded border"
                                      style={{ backgroundColor: status.color }}
                                    />
                                    {status.color}
                                  </div>
                                </TableCell>
                                <TableCell>{status.is_default ? "Yes" : "No"}</TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleMoveRouteStatusUp(index)}
                                      disabled={index === 0}
                                    >
                                      <ArrowUp className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleMoveRouteStatusDown(index)}
                                      disabled={index === routeStatuses.length - 1}
                                    >
                                      <ArrowDown className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => handleEditRouteStatus(status)}>
                                      <Edit2 className="h-4 w-4" />
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => handleDeleteRouteStatus(status.id!)}
                                      disabled={status.is_default}
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="app">
            <Card>
              <CardHeader>
                <CardTitle>App Settings</CardTitle>
                <CardDescription>
                  Configure application preferences and defaults
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="defaultDriverPercentage">Default Driver Percentage</Label>
                  <Input
                    id="defaultDriverPercentage"
                    name="defaultDriverPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={appSettings.defaultDriverPercentage}
                    onChange={handleAppSettingsChange}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showWeeklyTotals"
                    checked={appSettings.showWeeklyTotals}
                    onCheckedChange={(checked) => handleSwitchChange("showWeeklyTotals", checked)}
                  />
                  <Label htmlFor="showWeeklyTotals">Show Weekly Totals</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="enableNotifications"
                    checked={appSettings.enableNotifications}
                    onCheckedChange={(checked) => handleSwitchChange("enableNotifications", checked)}
                  />
                  <Label htmlFor="enableNotifications">Enable Notifications</Label>
                </div>
                <Button onClick={handleSaveSettings}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="border-t py-4 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CarrierXXL. All rights reserved.
        </div>
      </footer>
    </div>
  );
}