import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Schema } from "@/lib/db-types";
import { fine } from "@/lib/fine";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Phone, Mail, User, Truck, CalendarRange, Copy, Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

export default function DriverProfilePage() {
  const { id } = useParams<{ id: string }>();
  const [driver, setDriver] = useState<Schema["drivers"] | null>(null);
  const [routes, setRoutes] = useState<Schema["routes"][]>([]);
  const [dispatcher, setDispatcher] = useState<Schema["dispatchers"] | null>(null);
  const [truck, setTruck] = useState<Schema["trucks"] | null>(null);
  const [trailer, setTrailer] = useState<Schema["trailers"] | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch driver
        const driverData = await fine.table("drivers").select().eq("id", parseInt(id));
        
        if (driverData && driverData.length > 0) {
          const driver = driverData[0];
          setDriver(driver);
          
          // Fetch dispatcher
          if (driver.dispatcherId) {
            const dispatcherData = await fine.table("dispatchers").select().eq("id", driver.dispatcherId);
            if (dispatcherData && dispatcherData.length > 0) {
              setDispatcher(dispatcherData[0]);
            }
          }
          
          // Fetch truck
          if (driver.truck) {
            const truckData = await fine.table("trucks").select().eq("number", driver.truck);
            if (truckData && truckData.length > 0) {
              setTruck(truckData[0]);
            }
          }
          
          // Fetch trailer
          if (driver.trailer) {
            const trailerData = await fine.table("trailers").select().eq("number", driver.trailer);
            if (trailerData && trailerData.length > 0) {
              setTrailer(trailerData[0]);
            }
          }
          
          // Fetch routes (last 30 days)
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          const formattedDate = thirtyDaysAgo.toISOString().split('T')[0];
          
          const routesData = await fine.table("routes").select().eq("driverId", parseInt(id));
          if (routesData) {
            // Filter for last 30 days
            const recentRoutes = routesData.filter(route => route.date >= formattedDate);
            // Sort by date descending
            recentRoutes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRoutes(recentRoutes);
          }
        } else {
          toast({
            title: "Error",
            description: "Driver not found",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching driver data:", error);
        toast({
          title: "Error",
          description: "Failed to load driver data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchDriverData();
  }, [id, toast]);

  const handleCopyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCallDriver = () => {
    if (driver?.phone) {
      window.location.href = `tel:${driver.phone}`;
    }
  };

  const handleEmailDriver = () => {
    if (driver?.email) {
      window.location.href = `mailto:${driver.email}`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container mx-auto py-6 px-4">
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse">Loading driver profile...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container mx-auto py-6 px-4">
          <div className="flex flex-col items-center justify-center h-full">
            <h2 className="text-2xl font-bold mb-4">Driver Not Found</h2>
            <p className="text-muted-foreground mb-6">The driver you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link to="/">Back to Dashboard</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Calculate statistics
  const totalRoutes = routes.length;
  const totalMiles = routes.reduce((sum, route) => sum + (route.mileage || 0), 0);
  const totalGross = routes.reduce((sum, route) => sum + route.rate, 0);
  const totalEarnings = routes.reduce((sum, route) => {
    const grossDiff = route.soldFor ? route.rate - route.soldFor : 0;
    const percentIncome = route.soldFor ? route.soldFor * (driver.percentage / 100) : 0;
    return sum + grossDiff + percentIncome;
  }, 0);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex items-center mb-6">
          <Button variant="ghost" asChild className="mr-4">
            <Link to="/">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Driver Profile</h1>
            <p className="text-muted-foreground mt-2">
              View detailed information about this driver
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {driver.firstName} {driver.lastName}
                </CardTitle>
                <CardDescription>Driver #{driver.count}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Percentage</div>
                  <div className="font-medium">{driver.percentage}%</div>
                </div>
                
                {driver.phone && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Phone</div>
                    <div className="font-medium flex items-center justify-between">
                      <button 
                        onClick={handleCallDriver}
                        className="flex items-center text-primary hover:underline"
                      >
                        <Phone className="h-3 w-3 mr-1" />
                        {driver.phone}
                      </button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => handleCopyToClipboard(driver.phone!, 'phone')}
                      >
                        {copiedField === 'phone' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {driver.email && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Email</div>
                    <div className="font-medium flex items-center justify-between">
                      <button 
                        onClick={handleEmailDriver}
                        className="flex items-center text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>{driver.email}</span>
                      </button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 flex-shrink-0" 
                        onClick={() => handleCopyToClipboard(driver.email!, 'email')}
                      >
                        {copiedField === 'email' ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Dispatcher</div>
                  <div className="font-medium">{driver.dispatcher}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Category</div>
                  <div className="font-medium">{driver.category || "Semi"}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Equipment</div>
                  <div className="font-medium">
                    <div className="flex items-center">
                      <Truck className="h-3 w-3 mr-1" />
                      {driver.truck || "No truck assigned"}
                    </div>
                    {driver.category !== "Box" && (
                      <div className="mt-1">
                        Trailer: {driver.trailer || "No trailer assigned"}
                      </div>
                    )}
                  </div>
                </div>
                
                {driver.emergencyContactName && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Emergency Contact Name</div>
                    <div className="font-medium">
                      {driver.emergencyContactName}
                    </div>
                  </div>
                )}
                
                {driver.emergencyContactPhone && (
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Emergency Contact Phone</div>
                    <div className="font-medium">
                      <a href={`tel:${driver.emergencyContactPhone}`} className="text-primary hover:underline">
                        {driver.emergencyContactPhone}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Statistics (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Routes</div>
                    <div className="font-medium text-lg">{totalRoutes}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Miles</div>
                    <div className="font-medium text-lg">{totalMiles.toLocaleString()}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Gross</div>
                    <div className="font-medium text-lg">{formatCurrency(totalGross)}</div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-sm text-muted-foreground">Total Earnings</div>
                    <div className="font-medium text-lg">{formatCurrency(totalEarnings)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Tabs defaultValue="routes">
              <TabsList>
                <TabsTrigger value="routes">Recent Routes</TabsTrigger>
                <TabsTrigger value="equipment">Equipment Details</TabsTrigger>
              </TabsList>
              
              <TabsContent value="routes" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <CalendarRange className="h-5 w-5 mr-2" />
                      Recent Routes
                    </CardTitle>
                    <CardDescription>
                      Last 30 days of routes for this driver
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {routes.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No recent routes found for this driver
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Date</TableHead>
                              <TableHead>Route</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Miles</TableHead>
                              <TableHead className="text-right">Rate</TableHead>
                              <TableHead className="text-right">Sold For</TableHead>
                              <TableHead className="text-right">Earnings</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {routes.map((route) => {
                              const grossDiff = route.soldFor ? route.rate - route.soldFor : 0;
                              const percentIncome = route.soldFor ? route.soldFor * (driver.percentage / 100) : 0;
                              const earnings = grossDiff + percentIncome;
                              
                              return (
                                <TableRow key={route.id}>
                                  <TableCell>{new Date(route.date).toLocaleDateString()}</TableCell>
                                  <TableCell>
                                    {route.pickupCity}, {route.pickupState} to {route.deliveryCity}, {route.deliveryState}
                                    {route.customerLoadNumber && (
                                      <div className="text-xs text-muted-foreground">
                                        Load #{route.customerLoadNumber}
                                      </div>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div 
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                      style={{ 
                                        backgroundColor: route.statusColor || '#f0f0f0',
                                        color: getContrastTextColor(route.statusColor || '#f0f0f0')
                                      }}
                                    >
                                      {route.status || "Unknown"}
                                    </div>
                                  </TableCell>
                                  <TableCell>{route.mileage?.toLocaleString() || "-"}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(route.rate)}</TableCell>
                                  <TableCell className="text-right">{route.soldFor ? formatCurrency(route.soldFor) : "-"}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(earnings)}</TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                          <TableFooter>
                            <TableRow>
                              <TableCell colSpan={3} className="font-medium">Totals</TableCell>
                              <TableCell className="font-medium">{routes.reduce((sum, route) => sum + (route.mileage || 0), 0).toLocaleString()}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(routes.reduce((sum, route) => sum + route.rate, 0))}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(routes.reduce((sum, route) => sum + (route.soldFor || 0), 0))}</TableCell>
                              <TableCell className="text-right font-medium">{formatCurrency(routes.reduce((sum, route) => {
                                const grossDiff = route.soldFor ? route.rate - route.soldFor : 0;
                                const percentIncome = route.soldFor ? route.soldFor * (driver.percentage / 100) : 0;
                                return sum + grossDiff + percentIncome;
                              }, 0))}</TableCell>
                            </TableRow>
                          </TableFooter>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="equipment" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Truck Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {truck ? (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Number</div>
                              <div className="font-medium">{truck.number}</div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Category</div>
                              <div className="font-medium">{truck.category}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Make</div>
                              <div className="font-medium">{truck.make || "-"}</div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Model</div>
                              <div className="font-medium">{truck.model || "-"}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">Year</div>
                              <div className="font-medium">{truck.year || "-"}</div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">License Plate</div>
                              <div className="font-medium">{truck.licensePlate || "-"}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-sm text-muted-foreground">VIN</div>
                            <div className="font-medium flex items-center justify-between">
                              <span className="truncate">{truck.vin || "-"}</span>
                              {truck.vin && (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-6 w-6 p-0" 
                                  onClick={() => handleCopyToClipboard(truck.vin!, 'truckVin')}
                                >
                                  {copiedField === 'truckVin' ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <Copy className="h-3 w-3" />
                                  )}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          No truck assigned to this driver
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  {driver.category !== "Box" && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Trailer Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {trailer ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Number</div>
                                <div className="font-medium">{trailer.number}</div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Category</div>
                                <div className="font-medium">{trailer.category}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Type</div>
                                <div className="font-medium">{trailer.type || "-"}</div>
                              </div>
                              
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">Length</div>
                                <div className="font-medium">{trailer.length || "-"}</div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <div className="text-sm text-muted-foreground">License Plate</div>
                                <div className="font-medium">{trailer.licensePlate || "-"}</div>
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <div className="text-sm text-muted-foreground">VIN</div>
                              <div className="font-medium flex items-center justify-between">
                                <span className="truncate">{trailer.vin || "-"}</span>
                                {trailer.vin && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 w-6 p-0" 
                                    onClick={() => handleCopyToClipboard(trailer.vin!, 'trailerVin')}
                                  >
                                    {copiedField === 'trailerVin' ? (
                                      <Check className="h-3 w-3" />
                                    ) : (
                                      <Copy className="h-3 w-3" />
                                    )}
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            No trailer assigned to this driver
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      
      <footer className="border-t py-4 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} CarrierXXL. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

// Helper function to determine if text should be white or black based on background color
function getContrastTextColor(backgroundColor: string): string {
  // Convert hex to RGB
  let hex = backgroundColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance - standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}