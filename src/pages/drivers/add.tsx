import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Schema } from "@/lib/db-types";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAppSettings } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  addDriver, 
  getDispatchers, 
  getTrucks, 
  getTrailers, 
  getDrivers,
  addTruck,
  addTrailer 
} from "@/lib/api";

export default function AddDriverPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [dispatchers, setDispatchers] = useState<Schema["dispatchers"][]>([]);
  const [trucks, setTrucks] = useState<Schema["trucks"][]>([]);
  const [trailers, setTrailers] = useState<Schema["trailers"][]>([]);
  const [loadingDispatchers, setLoadingDispatchers] = useState(true);
  const [isAddTruckDialogOpen, setIsAddTruckDialogOpen] = useState(false);
  const [isAddTrailerDialogOpen, setIsAddTrailerDialogOpen] = useState(false);
  const [newTruck, setNewTruck] = useState<Schema["trucks"]>({
    number: "",
    category: "Semi"
  });
  const [newTrailer, setNewTrailer] = useState<Schema["trailers"]>({
    number: "",
    category: "Semi"
  });
  const [formData, setFormData] = useState<Partial<Schema["drivers"]>>({
    count: 1,
    percentage: 0,
    first_name: "",
    last_name: "",
    dispatcher_id: undefined,
    truck: "",
    trailer: "",
    phone: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    email: "",
    category: "Company"
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load default percentage from settings
        const settings = getAppSettings();
        if (settings.defaultDriverPercentage) {
          setFormData(prev => ({
            ...prev,
            percentage: settings.defaultDriverPercentage
          }));
        }
        
        // Fetch dispatchers
        const dispatchersData = await getDispatchers();
        setDispatchers(dispatchersData || []);
        
        // Fetch trucks
        const trucksData = await getTrucks();
        setTrucks(trucksData || []);
        
        // Fetch trailers
        const trailersData = await getTrailers();
        setTrailers(trailersData || []);
        
        // Fetch drivers to determine next count
        const driversData = await getDrivers();
        if (driversData && driversData.length > 0) {
          const maxCount = Math.max(...driversData.map(d => d.count));
          setFormData(prev => ({
            ...prev,
            count: maxCount + 1
          }));
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingDispatchers(false);
      }
    };
    
    fetchData();
  }, [toast]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'percentage' ? parseFloat(value) : value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTruckInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTruck(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTrailerInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTrailer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === "category") {
      // If changing to Box truck, clear trailer selection
      if (value === "Box") {
        setFormData(prev => ({
          ...prev,
          [name]: value,
          trailer: ""
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleTruckSelectChange = (name: string, value: string) => {
    setNewTruck(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTrailerSelectChange = (name: string, value: string) => {
    setNewTrailer(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDispatcherChange = (value: string) => {
    const selectedDispatcher = dispatchers.find(d => d.dispatcher_id === parseInt(value));
    if (selectedDispatcher) {
      setFormData(prev => ({
        ...prev,
        dispatcher_id: selectedDispatcher.dispatcher_id,
        first_name: selectedDispatcher.first_name,
        last_name: selectedDispatcher.last_name
      }));
    }
  };

  const handleTruckChange = (value: string) => {
    const selectedTruck = trucks.find(t => t.number === value);
    if (selectedTruck) {
      setFormData(prev => ({
        ...prev,
        truck: `${selectedTruck.number} - ${selectedTruck.make} ${selectedTruck.model} (${selectedTruck.license_plate})`
      }));
    }
  };

  const handleTrailerChange = (value: string) => {
    const selectedTrailer = trailers.find(t => t.number === value);
    if (selectedTrailer) {
      setFormData(prev => ({
        ...prev,
        trailer: `${selectedTrailer.number} - ${selectedTrailer.type} (${selectedTrailer.license_plate})`
      }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name) {
      newErrors.first_name = "First name is required";
    }

    if (!formData.last_name) {
      newErrors.last_name = "Last name is required";
    }

    if (!formData.dispatcher_id) {
      newErrors.dispatcher = "Dispatcher is required";
    }

    if (!formData.percentage) {
      newErrors.percentage = "Percentage is required";
    } else if (formData.percentage <= 0 || formData.percentage > 100) {
      newErrors.percentage = "Percentage must be between 1 and 100";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name) {
      toast({
        title: "Error",
        description: "First and last name are required",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.dispatcher_id) {
      toast({
        title: "Error",
        description: "Please select a dispatcher",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await addDriver({
        count: formData.count || 1,
        percentage: formData.percentage || 0,
        first_name: formData.first_name,
        last_name: formData.last_name,
        dispatcher_id: formData.dispatcher_id,
        truck: formData.truck,
        trailer: formData.trailer,
        phone: formData.phone,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_phone: formData.emergency_contact_phone,
        email: formData.email,
        category: formData.category
      });
      
      navigate("/drivers");
      toast({
        title: "Success",
        description: "Driver added successfully",
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

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTruck.number) {
      toast({
        title: "Error",
        description: "Truck number is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const addedTruck = await addTruck(newTruck);
      setTrucks(prev => [...prev, addedTruck]);
      setFormData(prev => ({
        ...prev,
        truck: `${addedTruck.number} - ${addedTruck.make} ${addedTruck.model} (${addedTruck.license_plate})`
      }));
      setIsAddTruckDialogOpen(false);
      setNewTruck({
        number: "",
        category: "Semi"
      });
      toast({
        title: "Success",
        description: "Truck added successfully",
      });
    } catch (error) {
      console.error("Error adding truck:", error);
      toast({
        title: "Error",
        description: "Failed to add truck. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddTrailer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTrailer.number) {
      toast({
        title: "Error",
        description: "Trailer number is required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const addedTrailer = await addTrailer(newTrailer);
      setTrailers(prev => [...prev, addedTrailer]);
      setFormData(prev => ({
        ...prev,
        trailer: `${addedTrailer.number} - ${addedTrailer.type} (${addedTrailer.license_plate})`
      }));
      setIsAddTrailerDialogOpen(false);
      setNewTrailer({
        number: "",
        category: "Semi"
      });
      toast({
        title: "Success",
        description: "Trailer added successfully",
      });
    } catch (error) {
      console.error("Error adding trailer:", error);
      toast({
        title: "Error",
        description: "Failed to add trailer. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter trucks based on selected category
  const filteredTrucks = trucks.filter(truck => 
    formData.category === "All" || truck.category === formData.category
  );

  // Only show trailers for Semi trucks
  const showTrailerSection = formData.category !== "Box";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" onClick={() => navigate("/drivers")} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Drivers
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Add New Driver</h1>
            <p className="text-muted-foreground mt-2">
              Create a new driver record
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="contact">Contact Information</TabsTrigger>
              <TabsTrigger value="equipment">Equipment</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <Card>
                <CardHeader>
                  <CardTitle>Driver Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="count">Count #</Label>
                      <Input
                        id="count"
                        name="count"
                        type="number"
                        value={formData.count}
                        disabled={true}
                        className="bg-muted/50"
                      />
                      <p className="text-xs text-muted-foreground">Count is automatically assigned</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="percentage">Percentage (%)</Label>
                      <Input
                        id="percentage"
                        name="percentage"
                        type="number"
                        value={formData.percentage}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        aria-invalid={!!errors.percentage}
                      />
                      {errors.percentage && <p className="text-sm text-destructive">{errors.percentage}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first_name">First Name</Label>
                      <Input
                        id="first_name"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        aria-invalid={!!errors.first_name}
                      />
                      {errors.first_name && <p className="text-sm text-destructive">{errors.first_name}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="last_name">Last Name</Label>
                      <Input
                        id="last_name"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        aria-invalid={!!errors.last_name}
                      />
                      {errors.last_name && <p className="text-sm text-destructive">{errors.last_name}</p>}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dispatcher">Dispatcher</Label>
                    {loadingDispatchers ? (
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading dispatchers...</span>
                      </div>
                    ) : (
                      <>
                        <Select onValueChange={handleDispatcherChange}>
                          <SelectTrigger className={errors.dispatcher ? "border-destructive" : ""}>
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
                        {errors.dispatcher && <p className="text-sm text-destructive">{errors.dispatcher}</p>}
                      </>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category">Driver Category</Label>
                    <Select 
                      defaultValue={formData.category || "Semi"} 
                      onValueChange={(value) => handleSelectChange("category", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select driver category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Semi">Semi</SelectItem>
                        <SelectItem value="Box">Box</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="contact">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone || ""}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email || ""}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="driver@example.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
                    <Input
                      id="emergency_contact_name"
                      name="emergency_contact_name"
                      value={formData.emergency_contact_name || ""}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
                    <Input
                      id="emergency_contact_phone"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone || ""}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="(555) 987-6543"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="equipment">
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="truck">Truck</Label>
                      <Dialog open={isAddTruckDialogOpen} onOpenChange={setIsAddTruckDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Plus className="h-4 w-4 mr-1" />
                            Add New Truck
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Truck</DialogTitle>
                          </DialogHeader>
                          <form onSubmit={handleAddTruck} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="truckNumber">Truck Number</Label>
                              <Input
                                id="truckNumber"
                                name="number"
                                value={newTruck.number}
                                onChange={handleTruckInputChange}
                                placeholder="T-123"
                                required
                              />
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="truckCategory">Category</Label>
                              <Select 
                                defaultValue={newTruck.category} 
                                onValueChange={(value) => handleTruckSelectChange("category", value)}
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
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="truckMake">Make</Label>
                                <Input
                                  id="truckMake"
                                  name="make"
                                  value={newTruck.make || ""}
                                  onChange={handleTruckInputChange}
                                  placeholder="Freightliner"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="truckModel">Model</Label>
                                <Input
                                  id="truckModel"
                                  name="model"
                                  value={newTruck.model || ""}
                                  onChange={handleTruckInputChange}
                                  placeholder="Cascadia"
                                />
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="truckYear">Year</Label>
                                <Input
                                  id="truckYear"
                                  name="year"
                                  type="number"
                                  value={newTruck.year || ""}
                                  onChange={handleTruckInputChange}
                                  placeholder="2023"
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="truckVin">VIN</Label>
                                <Input
                                  id="truckVin"
                                  name="vin"
                                  value={newTruck.vin || ""}
                                  onChange={handleTruckInputChange}
                                  placeholder="1FUJA6CV12LK12345"
                                />
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="truckLicensePlate">License Plate</Label>
                              <Input
                                id="truckLicensePlate"
                                name="license_plate"
                                value={newTruck.license_plate || ""}
                                onChange={handleTruckInputChange}
                                placeholder="ABC123"
                              />
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button type="button" variant="outline" onClick={() => setIsAddTruckDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button type="submit">
                                Add Truck
                              </Button>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                    
                    <Select onValueChange={handleTruckChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a truck" />
                      </SelectTrigger>
                      <SelectContent>
                        {trucks.map((truck) => (
                          <SelectItem key={truck.id} value={truck.number}>
                            {truck.number} - {truck.make} {truck.model} ({truck.license_plate})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {showTrailerSection && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="trailer">Trailer</Label>
                        <Dialog open={isAddTrailerDialogOpen} onOpenChange={setIsAddTrailerDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Plus className="h-4 w-4 mr-1" />
                              Add New Trailer
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add New Trailer</DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleAddTrailer} className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="trailerNumber">Trailer Number</Label>
                                <Input
                                  id="trailerNumber"
                                  name="number"
                                  value={newTrailer.number}
                                  onChange={handleTrailerInputChange}
                                  placeholder="TR-456"
                                  required
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="trailerCategory">Category</Label>
                                <Select 
                                  defaultValue={newTrailer.category} 
                                  onValueChange={(value) => handleTrailerSelectChange("category", value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Semi">Semi</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="trailerType">Type</Label>
                                  <Input
                                    id="trailerType"
                                    name="type"
                                    value={newTrailer.type || ""}
                                    onChange={handleTrailerInputChange}
                                    placeholder="Dry Van"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="trailerLength">Length</Label>
                                  <Input
                                    id="trailerLength"
                                    name="length"
                                    value={newTrailer.length || ""}
                                    onChange={handleTrailerInputChange}
                                    placeholder="53 ft"
                                  />
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label htmlFor="trailerVin">VIN</Label>
                                  <Input
                                    id="trailerVin"
                                    name="vin"
                                    value={newTrailer.vin || ""}
                                    onChange={handleTrailerInputChange}
                                    placeholder="1UYVS2538YU123456"
                                  />
                                </div>
                                
                                <div className="space-y-2">
                                  <Label htmlFor="trailerLicensePlate">License Plate</Label>
                                  <Input
                                    id="trailerLicensePlate"
                                    name="license_plate"
                                    value={newTrailer.license_plate || ""}
                                    onChange={handleTrailerInputChange}
                                    placeholder="XYZ789"
                                  />
                                </div>
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button type="button" variant="outline" onClick={() => setIsAddTrailerDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button type="submit">
                                  Add Trailer
                                </Button>
                              </div>
                            </form>
                          </DialogContent>
                        </Dialog>
                      </div>
                      
                      <Select onValueChange={handleTrailerChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trailer" />
                        </SelectTrigger>
                        <SelectContent>
                          {trailers.map((trailer) => (
                            <SelectItem key={trailer.id} value={trailer.number}>
                              {trailer.number} - {trailer.type} ({trailer.license_plate})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.category === "Box" && (
                        <p className="text-xs text-muted-foreground">
                          Box trucks do not use trailers
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Driver...
                </>
              ) : (
                "Add Driver"
              )}
            </Button>
          </div>
        </form>
      </main>
      
      <footer className="border-t py-4 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CarrierXXL. All rights reserved.
        </div>
      </footer>
    </div>
  );
}