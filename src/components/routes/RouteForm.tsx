import { useState, useEffect, useRef } from "react";
import { Schema, NewRoute } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, ChevronDown, ChevronUp, Clock, User, ChevronRight, Copy, Check, DollarSign } from "lucide-react";
import { calculateDistance, getLocationFromZip, saveZipCodeLocation, formatCurrency } from "@/lib/utils";
import { ZipCodeInput } from "@/components/ui/ZipCodeInput";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { getRoutes, getRoute, addRoute, updateRoute, getDivisions } from "@/lib/api";
import { fine } from "@/lib/fine";

interface RouteFormProps {
  driverId: number;
  date: string;
  route?: Schema["routes"];
  onSubmit: (route: Schema["routes"]) => Promise<void>;
  isEditing?: boolean;
}

interface RouteComment {
  text: string;
  by: string;
  at: string;
}

interface CityOption {
  city: string;
  state: string;
  zipCode: string;
  county?: string;
}

export function RouteForm({ driverId, date, route, onSubmit, isEditing = false }: RouteFormProps) {
  const { data: session } = fine.auth.useSession();
  const userName = session?.user?.name || session?.user?.email || "Unknown user";
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Schema["routes"]>>({
      driverId,
      date,
    status: route?.status || "Empty",
    statusColor: route?.statusColor || "#FF9E44",
    pickupZip: route?.pickupZip || "",
    pickupCity: route?.pickupCity || "",
    pickupState: route?.pickupState || "",
    deliveryZip: route?.deliveryZip || "",
    deliveryCity: route?.deliveryCity || "",
    deliveryState: route?.deliveryState || "",
    rate: route?.rate || 0,
    soldFor: route?.soldFor || 0,
    mileage: route?.mileage || 0,
    customerLoadNumber: route?.customerLoadNumber || "",
    divisionId: route?.divisionId || null,
    comments: route?.comments || "[]",
    previousRouteIds: route?.previousRouteIds || "[]"
  });
  const [originalData, setOriginalData] = useState<Schema["routes"] | null>(route || null);
  const [pickupLocation, setPickupLocation] = useState<{city: string, state: string, county: string} | null>(null);
  const [deliveryLocation, setDeliveryLocation] = useState<{city: string, state: string, county: string} | null>(null);
  const [calculatedMileage, setCalculatedMileage] = useState<number | null>(route?.mileage || null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [divisions, setDivisions] = useState<Schema["divisions"][]>([]);
  const [loadingDivisions, setLoadingDivisions] = useState(true);
  const [previousRoutes, setPreviousRoutes] = useState<Schema["routes"][]>([]);
  const [selectedPreviousRoutes, setSelectedPreviousRoutes] = useState<number[]>([]);
  const [routeAudits, setRouteAudits] = useState<Schema["routeAudits"][]>([]);
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<RouteComment[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [pickupCityOptions, setPickupCityOptions] = useState<CityOption[]>([]);
  const [deliveryCityOptions, setDeliveryCityOptions] = useState<CityOption[]>([]);
  const [isPickupCityOpen, setIsPickupCityOpen] = useState(false);
  const [isDeliveryCityOpen, setIsDeliveryCityOpen] = useState(false);
  const [pickupCitySearch, setPickupCitySearch] = useState("");
  const [deliveryCitySearch, setDeliveryCitySearch] = useState("");
  const [earnings, setEarnings] = useState<number>(0);
  const [routeStatuses, setRouteStatuses] = useState<Schema["routeStatuses"][]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDivisions() {
      setLoadingDivisions(true);
      try {
        const data = await getDivisions();
        setDivisions(data || []);
      } catch (error) {
        setDivisions([]);
      } finally {
        setLoadingDivisions(false);
      }
    }
    fetchDivisions();
    setPreviousRoutes([]);
    setPickupCityOptions([]);
    setDeliveryCityOptions([]);
          setRouteStatuses([
            { name: "Empty", color: "#FF9E44" },
            { name: "Service", color: "#4169E1" },
            { name: "Driving previous route", color: "#FFB6C1" },
            { name: "Hometime", color: "#A9A9A9" },
            { name: "Loaded", color: "#2E8B57" },
            { name: "AT PU", color: "#FFD700" },
            { name: "AT DEL", color: "#FFA500" },
            { name: "34 hour reset", color: "#DDA0DD" },
            { name: "Not answering", color: "#4682B4" }
          ]);
  }, []);

  useEffect(() => {
    const shouldCalculate =
      formData.pickupZip && formData.pickupZip.length === 5 &&
      formData.deliveryZip && formData.deliveryZip.length === 5 &&
      formData.pickupCity && formData.pickupState &&
      formData.deliveryCity && formData.deliveryState;

    if (shouldCalculate) {
      (async () => {
        const mileage = await calculateDistance(formData.pickupZip!, formData.deliveryZip!);
        setCalculatedMileage(mileage);
        setFormData(prev => ({ ...prev, mileage }));
      })();
    }
  }, [formData.pickupZip, formData.deliveryZip, formData.pickupCity, formData.pickupState, formData.deliveryCity, formData.deliveryState]);

  useEffect(() => {
    const rate = Number(formData.rate) || 0;
    const soldFor = Number(formData.soldFor) || 0;
    setEarnings(rate - soldFor);
  }, [formData.rate, formData.soldFor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = name === 'rate' || name === 'mileage' || name === 'soldFor' ? parseFloat(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: numValue
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

  const handleZipChange = async (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // If we have a valid zip code, try to get location data
    if (value.length === 5) {
      try {
        const locationData = await getLocationFromZip(value);
        if (locationData) {
          if (name === 'pickupZip') {
            setPickupLocation(locationData);
            setFormData(prev => ({
              ...prev,
              pickupCity: locationData.city,
              pickupState: locationData.state,
              pickupCounty: typeof (locationData as any).county === 'string' ? (locationData as any).county : ""
            }));
          } else if (name === 'deliveryZip') {
            setDeliveryLocation(locationData);
            setFormData(prev => ({
              ...prev,
              deliveryCity: locationData.city,
              deliveryState: locationData.state,
              deliveryCounty: typeof (locationData as any).county === 'string' ? (locationData as any).county : ""
            }));
          }

          // Save the zip code location for future use
          await saveZipCodeLocation({
            zipCode: value,
            city: locationData.city,
            state: locationData.state,
            county: typeof (locationData as any).county === 'string' ? (locationData as any).county : ""
          });
        }
      } catch (error) {
        console.error(`Error getting location for ${value}:`, error);
        setErrors(prev => ({
          ...prev,
          [name]: "Invalid ZIP code"
        }));
        return;
      }
    }

    // If we have both zip codes, calculate mileage
    if (name === 'pickupZip' && value.length === 5 && formData.deliveryZip && formData.deliveryZip.length === 5) {
      const mileage = await calculateDistance(value, formData.deliveryZip);
      setCalculatedMileage(mileage);
      setFormData(prev => ({
        ...prev,
        mileage
      }));
    } else if (name === 'deliveryZip' && value.length === 5 && formData.pickupZip && formData.pickupZip.length === 5) {
      const mileage = await calculateDistance(formData.pickupZip, value);
      setCalculatedMileage(mileage);
      setFormData(prev => ({
        ...prev,
        mileage
      }));
    }
  };

  const handleCityStateChange = (type: 'pickup' | 'delivery', field: 'city' | 'state', value: string) => {
    if (type === 'pickup') {
      setFormData(prev => ({
        ...prev,
        [`pickup${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
      }));
      
      if (field === 'city') {
        setPickupCitySearch(value);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [`delivery${field.charAt(0).toUpperCase() + field.slice(1)}`]: value
      }));
      
      if (field === 'city') {
        setDeliveryCitySearch(value);
      }
    }
  };

  const handleCitySelect = async (type: 'pickup' | 'delivery', option: CityOption) => {
    if (type === 'pickup') {
      setFormData(prev => ({
        ...prev,
        pickupZip: option.zipCode,
        pickupCity: option.city,
        pickupState: option.state,
        pickupCounty: typeof (option as any).county === 'string' ? (option as any).county : ""
      }));
      setIsPickupCityOpen(false);
      
      // If we have both zip codes, calculate mileage
      if (formData.deliveryZip && formData.deliveryZip.length === 5) {
        const mileage = await calculateDistance(option.zipCode, formData.deliveryZip);
        setCalculatedMileage(mileage);
        setFormData(prev => ({
          ...prev,
          mileage
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        deliveryZip: option.zipCode,
        deliveryCity: option.city,
        deliveryState: option.state,
        deliveryCounty: typeof (option as any).county === 'string' ? (option as any).county : ""
      }));
      setIsDeliveryCityOpen(false);
      
      // If we have both zip codes, calculate mileage
      if (formData.pickupZip && formData.pickupZip.length === 5) {
        const mileage = await calculateDistance(formData.pickupZip, option.zipCode);
        setCalculatedMileage(mileage);
        setFormData(prev => ({
          ...prev,
          mileage
        }));
      }
    }
  };

  const handleStatusChange = (value: string) => {
    const selectedStatus = routeStatuses.find(s => s.name === value);
    
    setFormData(prev => ({
      ...prev,
      status: value,
      statusColor: selectedStatus?.color || ""
    }));

    // Reset previous routes selection if not "Driving previous route"
    if (value !== "Driving previous route") {
      setSelectedPreviousRoutes([]);
    }
    
    // If "Driving previous route" is selected, suggest the most recent route
    if (value === "Driving previous route" && previousRoutes.length > 0 && selectedPreviousRoutes.length === 0) {
      // Sort by date descending
      const sortedRoutes = [...previousRoutes].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Select the most recent route by default
      if (sortedRoutes.length > 0 && sortedRoutes[0].id) {
        setSelectedPreviousRoutes([sortedRoutes[0].id]);
      }
    }
  };

  const handleDivisionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      divisionId: parseInt(value)
    }));
  };

  const handlePreviousRouteToggle = (routeId: number) => {
    setSelectedPreviousRoutes(prev => {
      if (prev.includes(routeId)) {
        return prev.filter(id => id !== routeId);
      } else {
        if (prev.length < 7) {
          return [...prev, routeId];
        }
        toast({
          title: "Maximum routes selected",
          description: "You can only select up to 7 previous routes.",
          variant: "destructive",
        });
        return prev;
      }
    });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    
    const comment: RouteComment = {
      text: newComment.trim(),
      by: userName,
      at: new Date().toISOString()
    };
    
    setComments([...comments, comment]);
    setNewComment("");
  };

  const copyLoadNumber = () => {
    if (formData.customerLoadNumber) {
      navigator.clipboard.writeText(formData.customerLoadNumber);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.pickupState) {
      newErrors.pickupState = "Pickup state is required";
    }

    if (!formData.pickupCity) {
      newErrors.pickupCity = "Pickup city is required";
    }

    if (!formData.pickupZip) {
      newErrors.pickupZip = "Pickup ZIP code is required";
    } else if (!/^\d{5}$/.test(formData.pickupZip)) {
      newErrors.pickupZip = "Please enter a valid 5-digit ZIP code";
    }

    if (!formData.deliveryState) {
      newErrors.deliveryState = "Delivery state is required";
    }

    if (!formData.deliveryCity) {
      newErrors.deliveryCity = "Delivery city is required";
    }

    if (!formData.deliveryZip) {
      newErrors.deliveryZip = "Delivery ZIP code is required";
    } else if (!/^\d{5}$/.test(formData.deliveryZip)) {
      newErrors.deliveryZip = "Please enter a valid 5-digit ZIP code";
    }

    if (!formData.rate && formData.rate !== 0) {
      newErrors.rate = "Rate is required";
    } else if (formData.rate < 0) {
      newErrors.rate = "Rate must be greater than or equal to zero";
    }

    if (!formData.status) {
      newErrors.status = "Route status is required";
    }

    if (formData.status === "Driving previous route" && selectedPreviousRoutes.length === 0) {
      newErrors.previousRoutes = "Please select at least one previous route";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Function to identify what fields have changed for audit
  const getChangedFields = () => {
    if (!originalData) return {};
    
    const changedFields: Record<string, { old: any, new: any }> = {};
    
    // Compare each field
    Object.keys(formData).forEach(key => {
      const typedKey = key as keyof Schema["routes"];
      if (originalData[typedKey] !== formData[typedKey] && 
          // Ignore these fields for audit
          !['lastEditedBy', 'lastEditedAt', 'updatedAt', 'lastCommentBy', 'lastCommentAt'].includes(key)) {
        changedFields[key] = {
          old: originalData[typedKey],
          new: formData[typedKey]
        };
      }
    });
    
    return changedFields;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Prepare route data with snake_case keys for API
      const routeData = {
        driver_id: driverId,
        date,
        pickup_zip: formData.pickupZip || "",
        pickup_city: formData.pickupCity || "",
        pickup_state: formData.pickupState || "",
        pickup_county: formData.pickupCounty || "",
        delivery_zip: formData.deliveryZip || "",
        delivery_city: formData.deliveryCity || "",
        delivery_state: formData.deliveryState || "",
        delivery_county: formData.deliveryCounty || "",
        mileage: formData.mileage || 0,
        rate: formData.rate || 0,
        sold_for: formData.soldFor || 0,
        status: formData.status || "Empty",
        status_color: formData.statusColor || "#FF9E44",
        customer_load_number: formData.customerLoadNumber || "",
        division_id: formData.divisionId || null,
        comments: JSON.stringify(comments),
        previous_route_ids: JSON.stringify(selectedPreviousRoutes),
        last_edited_by: userName,
        last_edited_at: new Date().toISOString(),
        last_comment_by: userName,
        last_comment_at: new Date().toISOString()
      };

      if (isEditing && route?.id) {
        // Update existing route
        const changedFields = getChangedFields();
        const oldValues = Object.fromEntries(
          Object.keys(changedFields).map(field => [field, route[field]])
        );
        const newValues = Object.fromEntries(
          Object.keys(changedFields).map(field => [field, routeData[field]])
        );

        await updateRoute(route.id, routeData);
        toast({
          title: "Route updated",
          description: "The route has been updated successfully.",
        });
      } else {
        // Create new route
        const result = await addRoute(routeData);

        if (!result || result.length === 0) {
          throw new Error("Failed to create route");
        }

        toast({
          title: "Route created",
          description: "The new route has been created successfully.",
        });
      }

      // Convert back to camelCase for the form submission
      const submissionData: Schema["routes"] = {
        id: route?.id || 0, // Use 0 for new routes
        driverId: routeData.driver_id,
        date: routeData.date,
        pickupZip: routeData.pickup_zip,
        pickupCity: routeData.pickup_city,
        pickupState: routeData.pickup_state,
        pickupCounty: routeData.pickup_county,
        deliveryZip: routeData.delivery_zip,
        deliveryCity: routeData.delivery_city,
        deliveryState: routeData.delivery_state,
        deliveryCounty: routeData.delivery_county,
        mileage: routeData.mileage,
        rate: routeData.rate,
        soldFor: routeData.sold_for,
        status: routeData.status,
        statusColor: routeData.status_color,
        customerLoadNumber: routeData.customer_load_number,
        divisionId: routeData.division_id,
        comments: routeData.comments,
        previousRouteIds: routeData.previous_route_ids,
        lastEditedBy: routeData.last_edited_by,
        lastEditedAt: routeData.last_edited_at
      };

      await onSubmit(submissionData);
    } catch (err) {
      console.error("Error saving route:", err);
      toast({
        title: "Error",
        description: `There was an error saving the route. Please try again.\n${err instanceof Error ? err.message : String(err)}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Format audit data for display
  const formatAuditData = (audit: Schema["routeAudits"]) => {
    try {
      const changedFields = JSON.parse(audit.changedFields || "[]");
      const oldValues = JSON.parse(audit.oldValues || "{}");
      const newValues = JSON.parse(audit.newValues || "{}");
      
      return {
        changedFields,
        oldValues,
        newValues,
        formattedDate: audit.createdAt ? new Date(audit.createdAt).toLocaleString() : "Unknown date"
      };
    } catch (e) {
      console.error("Error parsing audit data:", e);
      return {
        changedFields: [],
        oldValues: {},
        newValues: {},
        formattedDate: "Error parsing data"
      };
    }
  };

  // Format field name for display
  const formatFieldName = (fieldName: string) => {
    // Convert camelCase to Title Case with spaces
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase());
  };

  // Format field value for display
  const formatFieldValue = (fieldName: string, value: any) => {
    if (value === null || value === undefined) return "None";
    
    if (fieldName.includes("date")) {
      try {
        return new Date(value).toLocaleDateString();
      } catch (e) {
        return value;
      }
    }
    
    if (fieldName === "rate" || fieldName === "soldFor") {
      return formatCurrency(parseFloat(value));
    }
    
    if (fieldName === "mileage") {
      return `${value} miles`;
    }
    
    if (fieldName === "divisionId") {
      const division = divisions.find(d => d.id === parseInt(value));
      return division ? division.companyName : value;
    }
    
    return value.toString();
  };

  // Filter city options based on search
  const filteredPickupCityOptions = pickupCityOptions.filter(option => 
    option.city.toLowerCase().includes(pickupCitySearch.toLowerCase()) ||
    option.state.toLowerCase().includes(pickupCitySearch.toLowerCase())
  ).slice(0, 50); // Limit to 50 results for performance

  const filteredDeliveryCityOptions = deliveryCityOptions.filter(option => 
    option.city.toLowerCase().includes(deliveryCitySearch.toLowerCase()) ||
    option.state.toLowerCase().includes(deliveryCitySearch.toLowerCase())
  ).slice(0, 50); // Limit to 50 results for performance

  // Get US states for dropdown
  const usStates = [
    { name: "Alabama", code: "AL" },
    { name: "Alaska", code: "AK" },
    { name: "Arizona", code: "AZ" },
    { name: "Arkansas", code: "AR" },
    { name: "California", code: "CA" },
    { name: "Colorado", code: "CO" },
    { name: "Connecticut", code: "CT" },
    { name: "Delaware", code: "DE" },
    { name: "Florida", code: "FL" },
    { name: "Georgia", code: "GA" },
    { name: "Hawaii", code: "HI" },
    { name: "Idaho", code: "ID" },
    { name: "Illinois", code: "IL" },
    { name: "Indiana", code: "IN" },
    { name: "Iowa", code: "IA" },
    { name: "Kansas", code: "KS" },
    { name: "Kentucky", code: "KY" },
    { name: "Louisiana", code: "LA" },
    { name: "Maine", code: "ME" },
    { name: "Maryland", code: "MD" },
    { name: "Massachusetts", code: "MA" },
    { name: "Michigan", code: "MI" },
    { name: "Minnesota", code: "MN" },
    { name: "Mississippi", code: "MS" },
    { name: "Missouri", code: "MO" },
    { name: "Montana", code: "MT" },
    { name: "Nebraska", code: "NE" },
    { name: "Nevada", code: "NV" },
    { name: "New Hampshire", code: "NH" },
    { name: "New Jersey", code: "NJ" },
    { name: "New Mexico", code: "NM" },
    { name: "New York", code: "NY" },
    { name: "North Carolina", code: "NC" },
    { name: "North Dakota", code: "ND" },
    { name: "Ohio", code: "OH" },
    { name: "Oklahoma", code: "OK" },
    { name: "Oregon", code: "OR" },
    { name: "Pennsylvania", code: "PA" },
    { name: "Rhode Island", code: "RI" },
    { name: "South Carolina", code: "SC" },
    { name: "South Dakota", code: "SD" },
    { name: "Tennessee", code: "TN" },
    { name: "Texas", code: "TX" },
    { name: "Utah", code: "UT" },
    { name: "Vermont", code: "VT" },
    { name: "Virginia", code: "VA" },
    { name: "Washington", code: "WA" },
    { name: "West Virginia", code: "WV" },
    { name: "Wisconsin", code: "WI" },
    { name: "Wyoming", code: "WY" }
  ];

  const handlePickupLocationChange = (location: { city: string; state: string }) => {
    setFormData(prev => ({
      ...prev,
      pickupCity: location.city,
      pickupState: location.state,
      pickupCounty: "" // Optional field
    }));
  };

  const handleDeliveryLocationChange = (location: { city: string; state: string }) => {
    setFormData(prev => ({
      ...prev,
      deliveryCity: location.city,
      deliveryState: location.state,
      deliveryCounty: "" // Optional field
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white text-black">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="status">Route Status</Label>
          <Select 
            value={formData.status || undefined}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className={errors.status ? "border-destructive" : ""}>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {routeStatuses.map((status) => (
                <SelectItem 
                  key={status.name} 
                  value={status.name}
                  className="flex items-center gap-2"
                >
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: status.color }}
                  ></div>
                  {status.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.status && <p className="text-sm text-destructive">{errors.status}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="division">Division (Booked Under)</Label>
          {loadingDivisions ? (
            <div className="flex items-center space-x-2 h-10 border rounded-md px-3">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading divisions...</span>
            </div>
          ) : (
            <Select 
              value={formData.divisionId?.toString() || undefined}
              onValueChange={handleDivisionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select division" />
              </SelectTrigger>
              <SelectContent>
                {divisions.map((division) => (
                  <SelectItem key={division.id} value={division.id?.toString() || ""}>
                    {division.companyName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {formData.status === "Driving previous route" && (
        <div className="space-y-2">
          <Label>Select Previous Routes (up to 7)</Label>
          <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
            {previousRoutes.length === 0 ? (
              <p className="text-sm text-muted-foreground p-2">No previous routes available</p>
            ) : (
              previousRoutes.map((prevRoute) => (
                <div key={prevRoute.id} className="flex items-center space-x-2 py-1">
                  <Checkbox 
                    id={`route-${prevRoute.id}`}
                    checked={selectedPreviousRoutes.includes(prevRoute.id!)}
                    onCheckedChange={() => handlePreviousRouteToggle(prevRoute.id!)}
                  />
                  <Label htmlFor={`route-${prevRoute.id}`} className="text-sm font-normal">
                    {format(new Date(prevRoute.date), 'MMM d')} - {prevRoute.pickupState} to {prevRoute.deliveryState}
                    {prevRoute.customerLoadNumber ? ` (Load #${prevRoute.customerLoadNumber})` : ''}
                  </Label>
                </div>
              ))
            )}
          </div>
          {errors.previousRoutes && <p className="text-sm text-destructive">{errors.previousRoutes}</p>}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="customerLoadNumber">Customer Load #</Label>
          {formData.customerLoadNumber && (
            <Button 
              type="button" 
              variant="ghost" 
              size="sm" 
              onClick={copyLoadNumber}
              className="h-6 px-2"
            >
              {isCopied ? (
                <Check className="h-3 w-3 mr-1" />
              ) : (
                <Copy className="h-3 w-3 mr-1" />
              )}
              {isCopied ? "Copied" : "Copy"}
            </Button>
          )}
        </div>
        <Input
          id="customerLoadNumber"
          name="customerLoadNumber"
          value={formData.customerLoadNumber || ""}
          onChange={handleInputChange}
          disabled={isLoading}
          placeholder="Enter load number"
        />
      </div>

      {/* Pickup Location */}
      <div className="grid grid-cols-3 gap-4">
        <ZipCodeInput
          id="pickupZip"
          label="Pickup ZIP"
          value={formData.pickupZip || ""}
          onChange={(value) => setFormData(prev => ({ ...prev, pickupZip: value }))}
          onLocationChange={(location) => {
            setFormData(prev => ({
              ...prev,
              pickupCity: location.city,
              pickupState: location.state,
              pickupCounty: typeof (location as any).county === 'string' ? (location as any).county : ""
            }));
          }}
          disabled={isLoading}
          error={errors.pickupZip}
        />

        <div className="space-y-2">
          <Label htmlFor="pickupCity">City</Label>
              <Input
                id="pickupCity"
                value={formData.pickupCity || ""}
            disabled
            className="bg-muted/50"
          />
          {errors.pickupCity && <p className="text-sm text-destructive">{errors.pickupCity}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pickupState">State</Label>
              <Input
            id="pickupState"
            value={formData.pickupState || ""}
            disabled
            className="bg-muted/50"
          />
          {errors.pickupState && <p className="text-sm text-destructive">{errors.pickupState}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
          <ZipCodeInput
          id="deliveryZip"
          label="Delivery ZIP"
          value={formData.deliveryZip || ""}
          onChange={(value) => setFormData(prev => ({ ...prev, deliveryZip: value }))}
            onLocationChange={(location) => {
              setFormData(prev => ({
                ...prev,
              deliveryCity: location.city,
              deliveryState: location.state,
              deliveryCounty: typeof (location as any).county === 'string' ? (location as any).county : ""
              }));
            }}
            disabled={isLoading}
          error={errors.deliveryZip}
        />
        
        <div className="space-y-2">
          <Label htmlFor="deliveryCity">City</Label>
          <Input
            id="deliveryCity"
            value={formData.deliveryCity || ""}
            disabled
            className="bg-muted/50"
          />
          {errors.deliveryCity && <p className="text-sm text-destructive">{errors.deliveryCity}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliveryState">State</Label>
          <Input
            id="deliveryState"
            value={formData.deliveryState || ""}
            disabled
            className="bg-muted/50"
          />
          {errors.deliveryState && <p className="text-sm text-destructive">{errors.deliveryState}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="mileage">Mileage</Label>
          <Input
            id="mileage"
            name="mileage"
            type="number"
            value={calculatedMileage !== null ? calculatedMileage : ""}
            onChange={handleInputChange}
            disabled={isLoading}
            className="bg-muted/50"
          />
          <p className="text-xs text-muted-foreground">
            Calculated automatically from zip codes
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="rate">Rate ($)</Label>
          <Input
            id="rate"
            name="rate"
            type="number"
            step="0.01"
            value={formData.rate || ""}
            onChange={handleInputChange}
            disabled={isLoading}
            aria-invalid={!!errors.rate}
          />
          {errors.rate && <p className="text-sm text-destructive">{errors.rate}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="soldFor">Sold For ($)</Label>
          <Input
            id="soldFor"
            name="soldFor"
            type="number"
            step="0.01"
            value={formData.soldFor || ""}
            onChange={handleInputChange}
            disabled={isLoading}
          />
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Earnings:</span>
            <span className="font-medium">{formatCurrency(earnings)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Add Comment</Label>
        <div className="flex gap-2">
          <Textarea
            id="comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment about this route..."
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={handleAddComment} 
            disabled={!newComment.trim()}
            className="self-end"
          >
            Add
          </Button>
        </div>
      </div>

      {comments.length > 0 && (
        <div className="space-y-2 border rounded-md p-3">
          <h4 className="font-medium">Comments</h4>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {comments.map((comment, index) => (
              <div key={index} className="border-b pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <User className="h-3 w-3" />
                  <span>{comment.by}</span>
                  <Clock className="h-3 w-3 ml-1" />
                  <span>{new Date(comment.at).toLocaleString()}</span>
                </div>
                <p className="text-sm">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {isEditing && route?.lastEditedBy && (
        <div className="text-xs text-muted-foreground mt-2">
          Last edited by {route.lastEditedBy} on {route.lastEditedAt ? new Date(route.lastEditedAt).toLocaleString() : "unknown date"}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? "Updating Route..." : "Adding Route..."}
          </>
        ) : (
          isEditing ? "Save Changes" : "Add Route"
        )}
      </Button>
    </form>
  );
}