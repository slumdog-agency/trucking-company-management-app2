import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Schema } from "@/lib/db-types";
import { fine } from "@/lib/fine";
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
  const [formData, setFormData] = useState<Schema["drivers"]>({
    count: 1,
    percentage: 25,
    firstName: "",
    lastName: "",
    dispatcher: "",
    dispatcherId: null,
    truck: "",
    trailer: "",
    phone: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    email: "",
    category: "Semi"
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
        const dispatchersData = await fine.table("dispatchers").select();
        setDispatchers(dispatchersData || []);
        
        // Fetch trucks
        const trucksData = await fine.table("trucks").select();
        setTrucks(trucksData || []);
        
        // Fetch trailers
        const trailersData = await fine.table("trailers").select();
        setTrailers(trailersData || []);
        
        // Fetch drivers to determine next count
        const driversData = await fine.table("drivers").select();
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
      [name]: name === 'year' ? parseInt(value) : value
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
    const selectedDispatcher = dispatchers.find(d => d.id === parseInt(value));
    
    if (selectedDispatcher) {
      setFormData(prev => ({
        ...prev,
        dispatcherId: selectedDispatcher.id,
        dispatcher: `${selectedDispatcher.firstName} ${selectedDispatcher.lastName}`
      }));
    }
    
    // Clear error
    if (errors.dispatcher) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.dispatcher;
        return newErrors;
      });
    }
  };

  const handleTruckChange = (value: string) => {
    const selectedTruck = trucks.find(t => t.number === value);
    
    // If changing to a Box truck, clear trailer selection
    if (selectedTruck && selectedTruck.category === "Box") {
      setFormData(prev => ({
        ...prev,
        truck: value,
        trailer: "",
        category: "Box"
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        truck: value,
        category: selectedTruck?.category || formData.category
      }));
    }
  };

  const handleTrailerChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      trailer: value
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.dispatcher) {
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

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const addedDrivers = await fine.table("drivers").insert(formData).select();
      
      if (addedDrivers && addedDrivers.length > 0) {
        toast({
          title: "Success",
          description: "Driver added successfully.",
        });
        navigate("/drivers");
      }
    } catch (error) {
      console.error("Error adding driver:", error);
      toast({
        title: "Error",
        description: "Failed to add driver. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        setFormData(prev => ({
          ...prev,
          truck: addedTrucks[0].number,
          category: addedTrucks[0].category,
          // If it's a Box truck, clear trailer
          trailer: addedTrucks[0].category === "Box" ? "" : prev.trailer
        }));
        setNewTruck({
          number: "",
          category: "Semi"
        });
        setIsAddTruckDialogOpen(false);
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

  const handleAddTrailer = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
        setFormData(prev => ({
          ...prev,
          trailer: addedTrailers[0].number
        }));
        setNewTrailer({
          number: "",
          category: "Semi"
        });
        setIsAddTrailerDialogOpen(false);
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
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        aria-invalid={!!errors.firstName}
                      />
                      {errors.firstName && <p className="text-sm text-destructive">{errors.firstName}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        disabled={isLoading}
                        aria-invalid={!!errors.lastName}
                      />
                      {errors.lastName && <p className="text-sm text-destructive">{errors.lastName}</p>}
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
                              <SelectItem key={dispatcher.id} value={dispatcher.id?.toString() || ""}>
                                {dispatcher.firstName} {dispatcher.lastName}
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
                    <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
                    <Input
                      id="emergencyContactName"
                      name="emergencyContactName"
                      value={formData.emergencyContactName || ""}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
                    <Input
                      id="emergencyContactPhone"
                      name="emergencyContactPhone"
                      value={formData.emergencyContactPhone || ""}
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
                                name="licensePlate"
                                value={newTruck.licensePlate || ""}
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
                            {truck.number} ({truck.category})
                            {truck.make && truck.model ? ` - ${truck.make} ${truck.model}` : ""}
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
                                    name="licensePlate"
                                    value={newTrailer.licensePlate || ""}
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
                      
                      <Select onValueChange={handleTrailerChange} disabled={formData.category === "Box"}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a trailer" />
                        </SelectTrigger>
                        <SelectContent>
                          {trailers.map((trailer) => (
                            <SelectItem key={trailer.id} value={trailer.number}>
                              {trailer.number} ({trailer.category})
                              {trailer.type ? ` - ${trailer.type}` : ""}
                              {trailer.length ? ` ${trailer.length}` : ""}
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
          &copy; {new Date().getFullYear()} Trucking Manager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}