import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Upload, FileText, Settings2 } from "lucide-react";
import { fine } from "@/lib/fine";
import { saveAppSettings, getAppSettings } from "@/lib/utils";
import { Link } from "react-router-dom";

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load saved settings on component mount
  useEffect(() => {
    const savedSettings = getAppSettings();
    setAppSettings(prev => ({
      ...prev,
      defaultDriverPercentage: savedSettings.defaultDriverPercentage || 25,
      showWeeklyTotals: savedSettings.showWeeklyTotals !== undefined ? savedSettings.showWeeklyTotals : true,
      enableNotifications: savedSettings.enableNotifications !== undefined ? savedSettings.enableNotifications : true
    }));
  }, []);

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
    // Save app settings to localStorage
    saveAppSettings(appSettings);
    
    // In a real app, you would save company settings to the database
    toast({
      title: "Settings Saved",
      description: "Your settings have been saved successfully.",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if it's a CSV file
    if (file.type !== "text/csv" && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Read the file
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        const csvData = event.target?.result as string;
        const lines = csvData.split('\\n');
        
        // Skip header row
        const header = lines[0].split(',');
        
        // Find column indices based on your specified format
        const zipIndex = header.findIndex(col => col.toLowerCase().trim() === 'zip');
        const cityIndex = header.findIndex(col => col.toLowerCase().trim() === 'city');
        const stateIdIndex = header.findIndex(col => col.toLowerCase().trim() === 'state_id');
        const stateNameIndex = header.findIndex(col => col.toLowerCase().trim() === 'state name');
        const countyNameIndex = header.findIndex(col => col.toLowerCase().trim() === 'county_name');
        
        if (zipIndex === -1 || cityIndex === -1 || (stateIdIndex === -1 && stateNameIndex === -1)) {
          toast({
            title: "Invalid CSV Format",
            description: "CSV must contain columns for Zip, City, and State (either state_id or state name).",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        }
        
        // Process data in batches
        const batchSize = 100;
        const totalRows = lines.length - 1; // Exclude header
        
        for (let i = 1; i < lines.length; i += batchSize) {
          const batch = [];
          
          for (let j = i; j < Math.min(i + batchSize, lines.length); j++) {
            const line = lines[j].trim();
            if (!line) continue;
            
            // Handle quoted CSV values properly
            let columns: string[] = [];
            let inQuotes = false;
            let currentValue = '';
            
            for (let k = 0; k < line.length; k++) {
              const char = line[k];
              
              if (char === '"' && (k === 0 || line[k-1] !== '\\')) {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                columns.push(currentValue);
                currentValue = '';
              } else {
                currentValue += char;
              }
            }
            
            // Add the last value
            columns.push(currentValue);
            
            // Clean up values (remove quotes)
            columns = columns.map(col => col.replace(/^"|"$/g, '').trim());
            
            const zipCode = columns[zipIndex];
            const city = columns[cityIndex];
            const state = stateNameIndex !== -1 ? columns[stateNameIndex] : columns[stateIdIndex]; // Use state name if available, otherwise use state ID
            const county = countyNameIndex !== -1 ? columns[countyNameIndex] : ''; // Optional
            
            if (zipCode && city && state) {
              batch.push({
                zipCode,
                city,
                state,
                county
              });
            }
          }
          
          if (batch.length > 0) {
            // Insert batch into database
            await fine.table("zipCodes").insert(batch);
          }
          
          // Update progress
          const progress = Math.min(100, Math.round(((i + batchSize) / totalRows) * 100));
          setUploadProgress(progress);
        }
        
        toast({
          title: "Upload Complete",
          description: "Zip code data has been successfully imported.",
        });
        setIsUploading(false);
      };
      
      reader.onerror = () => {
        toast({
          title: "Error",
          description: "Failed to read the file. Please try again.",
          variant: "destructive",
        });
        setIsUploading(false);
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error("Error uploading zip codes:", error);
      toast({
        title: "Error",
        description: "Failed to upload zip codes. Please try again.",
        variant: "destructive",
      });
      setIsUploading(false);
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
              Configure your application preferences
            </p>
          </div>
          <Button asChild>
            <a href="/">
              Back to Dashboard
            </a>
          </Button>
        </div>
        
        <Tabs defaultValue="company" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="application">Application</TabsTrigger>
            <TabsTrigger value="data">Data Import</TabsTrigger>
          </TabsList>
          
          <TabsContent value="company">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
                <CardDescription>
                  Update your company details that will appear on reports and documents
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
                
                <Button onClick={handleSaveSettings} className="mt-4">
                  <Save className="h-4 w-4 mr-2" />
                  Save Company Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="application">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Application Settings</CardTitle>
                  <CardDescription>
                    Customize how the application works for your needs
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="defaultDriverPercentage">Default Driver Percentage</Label>
                    <Input
                      id="defaultDriverPercentage"
                      name="defaultDriverPercentage"
                      type="number"
                      value={appSettings.defaultDriverPercentage}
                      onChange={handleAppSettingsChange}
                    />
                    <p className="text-sm text-muted-foreground">
                      The default percentage used when adding new drivers
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="showWeeklyTotals">Show Weekly Totals</Label>
                      <p className="text-sm text-muted-foreground">
                        Display weekly earnings totals on the dashboard
                      </p>
                    </div>
                    <Switch
                      id="showWeeklyTotals"
                      checked={appSettings.showWeeklyTotals}
                      onCheckedChange={(checked) => handleSwitchChange('showWeeklyTotals', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="enableNotifications">Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for important events
                      </p>
                    </div>
                    <Switch
                      id="enableNotifications"
                      checked={appSettings.enableNotifications}
                      onCheckedChange={(checked) => handleSwitchChange('enableNotifications', checked)}
                    />
                  </div>
                  
                  <Button onClick={handleSaveSettings} className="mt-4">
                    <Save className="h-4 w-4 mr-2" />
                    Save Application Settings
                  </Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                  <CardDescription>
                    Configure advanced application settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">Route Statuses</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage route status options and colors
                        </p>
                      </div>
                      <Button asChild>
                        <Link to="/settings/route-statuses">
                          <Settings2 className="h-4 w-4 mr-2" />
                          Manage
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-medium">User Permissions</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Manage user access and permissions
                      </p>
                      <Button asChild>
                        <Link to="/users">
                          <Settings2 className="h-4 w-4 mr-2" />
                          Manage Users
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle>Import ZIP Code Data</CardTitle>
                <CardDescription>
                  Upload a CSV file containing ZIP codes, cities, states, and counties
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                    <FileText className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">Upload ZIP Code CSV</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      CSV file should contain columns for Zip, City, State Name, and County Name
                    </p>
                    
                    <div className="flex justify-center">
                      <Label 
                        htmlFor="zipCodeFile" 
                        className="cursor-pointer inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
                      >
                        <Upload className="h-4 w-4" />
                        Select CSV File
                      </Label>
                      <Input 
                        id="zipCodeFile" 
                        type="file" 
                        accept=".csv" 
                        className="hidden" 
                        onChange={handleFileUpload}
                        disabled={isUploading}
                      />
                    </div>
                  </div>
                  
                  {isUploading && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Uploading...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary" 
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">CSV Format Example</h4>
                    <pre className="text-xs overflow-x-auto p-2 bg-background rounded">
                      Zip,City,state_id,State Name,county_name<br/>
                      10001,New York,NY,New York,New York County<br/>
                      90210,Beverly Hills,CA,California,Los Angeles County<br/>
                      60601,Chicago,IL,Illinois,Cook County
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <footer className="border-t py-4 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Trucking Manager. All rights reserved.
        </div>
      </footer>
    </div>
  );
}