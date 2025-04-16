import { useState, useEffect, useRef } from "react";
import { Schema } from "@/lib/db-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar, ChevronDown, ChevronUp, Clock, User, ChevronRight, Copy, Check, DollarSign } from "lucide-react";
import { calculateDistance, getLocationFromZip, saveZipCodeLocation, formatCurrency } from "@/lib/utils";
import { ZipCodeInput } from "@/components/ui/ZipCodeInput";
import { fine } from "@/lib/fine";
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
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<Schema["routes"]>(
    route || {
      driverId,
      date,
      pickupZip: "",
      pickupCity: "",
      pickupState: "",
      deliveryZip: "",
      deliveryCity: "",
      deliveryState: "",
      rate: 0,
      soldFor: 0,
      status: "",
      customerLoadNumber: "",
      comments: ""
    }
  );
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
  const { data: session } = fine.auth.useSession();
  
  // New state for hometime dates
  const [hometimeStartDate, setHometimeStartDate] = useState<Date | undefined>(
    route?.statusStartDate ? new Date(route.statusStartDate) : new Date(date)
  );
  const [hometimeEndDate, setHometimeEndDate] = useState<Date | undefined>(
    route?.statusEndDate ? new Date(route.statusEndDate) : new Date(date)
  );

  useEffect(() => {
    const fetchDivisions = async () => {
      setLoadingDivisions(true);
      try {
        const data = await fine.table("divisions").select();
        setDivisions(data || []);
      } catch (error) {
        console.error("Error fetching divisions:", error);
      } finally {
        setLoadingDivisions(false);
      }
    };

    const fetchPreviousRoutes = async () => {
      try {
        // Get routes from the past 14 days for this driver
        const currentDate = new Date(date);
        const fourteenDaysAgo = new Date(currentDate);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
        
        const formattedFourteenDaysAgo = format(fourteenDaysAgo, 'yyyy-MM-dd');
        const formattedCurrentDate = format(currentDate, 'yyyy-MM-dd');
        
        // In a real app, you would use gte and lte for date range
        // For this demo, we'll fetch all routes and filter them in JavaScript
        const allRoutes = await fine.table("routes").select().eq("driverId", driverId);
        
        if (allRoutes) {
          // Filter routes for the past 14 days
          const recentRoutes = allRoutes.filter(route => 
            route.date >= formattedFourteenDaysAgo && 
            route.date <= formattedCurrentDate &&
            route.date !== date // Exclude routes from the current day
          );
          
          setPreviousRoutes(recentRoutes);
        }
      } catch (error) {
        console.error("Error fetching previous routes:", error);
      }
    };
    
    const fetchRouteAudits = async () => {
      if (isEditing && route?.id) {
        try {
          const audits = await fine.table("routeAudits").select().eq("routeId", route.id);
          if (audits) {
            // Sort by most recent first
            setRouteAudits(audits.sort((a, b) => {
              return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
            }));
          }
        } catch (error) {
          console.error("Error fetching route audits:", error);
        }
      }
    };
    
    const fetchCityOptions = async () => {
      try {
        const zipData = await fine.table("zipCodes").select();
        if (zipData) {
          const cityOptions: CityOption[] = zipData.map(zip => ({
            city: zip.city,
            state: zip.state,
            zipCode: zip.zipCode,
            county: zip.county
          }));
          
          setPickupCityOptions(cityOptions);
          setDeliveryCityOptions(cityOptions);
        }
      } catch (error) {
        console.error("Error fetching city options:", error);
      }
    };
    
    const fetchRouteStatuses = async () => {
      try {
        const statusData = await fine.table("routeStatuses").select();
        if (statusData && statusData.length > 0) {
          // Sort by sortOrder if available
          const sortedStatuses = statusData.sort((a, b) => 
            (a.sortOrder || 0) - (b.sortOrder || 0)
          );
          setRouteStatuses(sortedStatuses);
        } else {
          // Fallback to hardcoded statuses
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
        }
      } catch (error) {
        console.error("Error fetching route statuses:", error);
      }
    };
    
    fetchDivisions();
    fetchPreviousRoutes();
    fetchCityOptions();
    fetchRouteStatuses();
    
    if (isEditing) {
      fetchRouteAudits();
      
      // Parse previous route IDs if they exist
      if (route?.previousRouteIds) {
        try {
          const parsedIds = JSON.parse(route.previousRouteIds);
          if (Array.isArray(parsedIds)) {
            setSelectedPreviousRoutes(parsedIds);
          }
        } catch (e) {
          console.error("Error parsing previous route IDs:", e);
        }
      }
      
      // Parse comments if they exist
      if (route?.comments) {
        try {
          const parsedComments = JSON.parse(route.comments);
          if (Array.isArray(parsedComments)) {
            setComments(parsedComments);
          }
        } catch (e) {
          console.error("Error parsing comments:", e);
        }
      }
    }
    
    // Calculate earnings when rate or soldFor changes
    if (formData.rate !== undefined && formData.soldFor !== undefined) {
      setEarnings(formData.rate - (formData.soldFor || 0));
    }
  }, [driverId, date, route, isEditing, formData.rate, formData.soldFor]);

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
              pickupCounty: locationData.county
            }));
          } else if (name === 'deliveryZip') {
            setDeliveryLocation(locationData);
            setFormData(prev => ({
              ...prev,
              deliveryCity: locationData.city,
              deliveryState: locationData.state,
              deliveryCounty: locationData.county
            }));
          }
        }
      } catch (error) {
        console.error(`Error getting location for ${value}:`, error);
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
        pickupCounty: option.county || ""
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
        deliveryCounty: option.county || ""
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
      by: session?.user?.name || session?.user?.email || "Unknown user",
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

    if (formData.status === "Hometime") {
      if (!hometimeStartDate) {
        newErrors.hometimeStartDate = "Start date is required for Hometime";
      }
      if (!hometimeEndDate) {
        newErrors.hometimeEndDate = "End date is required for Hometime";
      }
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

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Save custom zip code data if entered manually
      if (formData.pickupZip && formData.pickupCity && formData.pickupState) {
        await saveZipCodeLocation(
          formData.pickupZip,
          formData.pickupCity,
          formData.pickupState,
          formData.pickupCounty || ""
        );
      }

      if (formData.deliveryZip && formData.deliveryCity && formData.deliveryState) {
        await saveZipCodeLocation(
          formData.deliveryZip,
          formData.deliveryCity,
          formData.deliveryState,
          formData.deliveryCounty || ""
        );
      }

      // Create the complete route object
      const completeRoute: Schema["routes"] = {
        ...formData,
        driverId,
        date,
        mileage: calculatedMileage || 0,
        previousRouteIds: selectedPreviousRoutes.length > 0 ? JSON.stringify(selectedPreviousRoutes) : null,
        statusStartDate: formData.status === "Hometime" && hometimeStartDate ? format(hometimeStartDate, 'yyyy-MM-dd') : null,
        statusEndDate: formData.status === "Hometime" && hometimeEndDate ? format(hometimeEndDate, 'yyyy-MM-dd') : null,
        comments: comments.length > 0 ? JSON.stringify(comments) : null
      };

      // If there's a new comment, add it and update the last comment info
      if (newComment.trim()) {
        const newCommentObj: RouteComment = {
          text: newComment.trim(),
          by: session?.user?.name || session?.user?.email || "Unknown user",
          at: new Date().toISOString()
        };
        
        const updatedComments = [...comments, newCommentObj];
        completeRoute.comments = JSON.stringify(updatedComments);
        completeRoute.lastCommentBy = newCommentObj.by;
        completeRoute.lastCommentAt = newCommentObj.at;
      }

      // If editing, add audit information
      if (isEditing && route?.id) {
        const changedFields = getChangedFields();
        const changedFieldsCount = Object.keys(changedFields).length;
        
        if (changedFieldsCount > 0 || newComment.trim()) {
          // Add audit information
          completeRoute.lastEditedBy = session?.user?.name || session?.user?.email || "Unknown user";
          completeRoute.lastEditedAt = new Date().toISOString();
          
          // Create audit record
          await fine.table("routeAudits").insert({
            routeId: route.id,
            userId: session?.user?.id ? parseInt(session.user.id) : null,
            userName: session?.user?.name || session?.user?.email || "Unknown user",
            changedFields: JSON.stringify(Object.keys(changedFields)),
            oldValues: JSON.stringify(Object.entries(changedFields).reduce((acc, [key, value]) => {
              acc[key] = value.old;
              return acc;
            }, {} as Record<string, any>)),
            newValues: JSON.stringify(Object.entries(changedFields).reduce((acc, [key, value]) => {
              acc[key] = value.new;
              return acc;
            }, {} as Record<string, any>))
          });
        }
      }

      await onSubmit(completeRoute);
    } catch (error) {
      console.error("Error saving route:", error);
      toast({
        title: "Error",
        description: "Failed to save route. Please try again.",
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

      {formData.status === "Hometime" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Hometime Start Date</Label>
            <Input
              type="date"
              value={hometimeStartDate ? format(hometimeStartDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setHometimeStartDate(new Date(e.target.value));
                }
              }}
              className={errors.hometimeStartDate ? "border-destructive" : ""}
            />
            {errors.hometimeStartDate && <p className="text-sm text-destructive">{errors.hometimeStartDate}</p>}
          </div>

          <div className="space-y-2">
            <Label>Hometime End Date</Label>
            <Input
              type="date"
              value={hometimeEndDate ? format(hometimeEndDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setHometimeEndDate(new Date(e.target.value));
                }
              }}
              className={errors.hometimeEndDate ? "border-destructive" : ""}
            />
            {errors.hometimeEndDate && <p className="text-sm text-destructive">{errors.hometimeEndDate}</p>}
          </div>
        </div>
      )}

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
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickupState">Pickup State</Label>
          <Select 
            value={formData.pickupState || undefined}
            onValueChange={(value) => handleCityStateChange('pickup', 'state', value)}
          >
            <SelectTrigger className={errors.pickupState ? "border-destructive" : ""}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {usStates.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.pickupState && <p className="text-sm text-destructive">{errors.pickupState}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliveryState">Delivery State</Label>
          <Select 
            value={formData.deliveryState || undefined}
            onValueChange={(value) => handleCityStateChange('delivery', 'state', value)}
          >
            <SelectTrigger className={errors.deliveryState ? "border-destructive" : ""}>
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              {usStates.map((state) => (
                <SelectItem key={state.code} value={state.code}>
                  {state.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.deliveryState && <p className="text-sm text-destructive">{errors.deliveryState}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickupCity">Pickup City</Label>
          <Popover open={isPickupCityOpen} onOpenChange={setIsPickupCityOpen}>
            <PopoverTrigger asChild>
              <Input
                id="pickupCity"
                name="pickupCity"
                value={formData.pickupCity || ""}
                onChange={(e) => handleCityStateChange('pickup', 'city', e.target.value)}
                onFocus={() => setIsPickupCityOpen(true)}
                disabled={isLoading}
                aria-invalid={!!errors.pickupCity}
                placeholder="Enter city name"
                className={errors.pickupCity ? "border-destructive" : ""}
              />
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search cities..." 
                  value={pickupCitySearch}
                  onValueChange={setPickupCitySearch}
                />
                <CommandList>
                  <CommandEmpty>No cities found</CommandEmpty>
                  <CommandGroup>
                    {filteredPickupCityOptions.map((option, index) => (
                      <CommandItem
                        key={`${option.zipCode}-${index}`}
                        onSelect={() => handleCitySelect('pickup', option)}
                      >
                        {option.city}, {option.state} ({option.zipCode})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.pickupCity && <p className="text-sm text-destructive">{errors.pickupCity}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliveryCity">Delivery City</Label>
          <Popover open={isDeliveryCityOpen} onOpenChange={setIsDeliveryCityOpen}>
            <PopoverTrigger asChild>
              <Input
                id="deliveryCity"
                name="deliveryCity"
                value={formData.deliveryCity || ""}
                onChange={(e) => handleCityStateChange('delivery', 'city', e.target.value)}
                onFocus={() => setIsDeliveryCityOpen(true)}
                disabled={isLoading}
                aria-invalid={!!errors.deliveryCity}
                placeholder="Enter city name"
                className={errors.deliveryCity ? "border-destructive" : ""}
              />
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Search cities..." 
                  value={deliveryCitySearch}
                  onValueChange={setDeliveryCitySearch}
                />
                <CommandList>
                  <CommandEmpty>No cities found</CommandEmpty>
                  <CommandGroup>
                    {filteredDeliveryCityOptions.map((option, index) => (
                      <CommandItem
                        key={`${option.zipCode}-${index}`}
                        onSelect={() => handleCitySelect('delivery', option)}
                      >
                        {option.city}, {option.state} ({option.zipCode})
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          {errors.deliveryCity && <p className="text-sm text-destructive">{errors.deliveryCity}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pickupZip">Pickup ZIP Code</Label>
          <ZipCodeInput
            id="pickupZip"
            name="pickupZip"
            value={formData.pickupZip}
            onChange={(e) => handleZipChange('pickupZip', e.target.value)}
            onLocationChange={(location) => {
              setPickupLocation(location);
              setFormData(prev => ({
                ...prev,
                pickupCity: location.city,
                pickupState: location.state,
                pickupCounty: location.county
              }));
            }}
            disabled={isLoading}
            aria-invalid={!!errors.pickupZip}
          />
          {errors.pickupZip && <p className="text-sm text-destructive">{errors.pickupZip}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="deliveryZip">Delivery ZIP Code</Label>
          <ZipCodeInput
            id="deliveryZip"
            name="deliveryZip"
            value={formData.deliveryZip}
            onChange={(e) => handleZipChange('deliveryZip', e.target.value)}
            onLocationChange={(location) => {
              setDeliveryLocation(location);
              setFormData(prev => ({
                ...prev,
                deliveryCity: location.city,
                deliveryState: location.state,
                deliveryCounty: location.county
              }));
            }}
            disabled={isLoading}
            aria-invalid={!!errors.deliveryZip}
          />
          {errors.deliveryZip && <p className="text-sm text-destructive">{errors.deliveryZip}</p>}
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

      {isEditing && routeAudits.length > 0 && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="audit-history">
            <AccordionTrigger className="text-sm">
              View Edit History ({routeAudits.length} {routeAudits.length === 1 ? "change" : "changes"})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 max-h-60 overflow-y-auto p-2">
                {routeAudits.map((audit) => {
                  const { changedFields, oldValues, newValues, formattedDate } = formatAuditData(audit);
                  return (
                    <div key={audit.id} className="border rounded-md p-3 text-sm">
                      <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{audit.userName || "Unknown user"}</span>
                        <Clock className="h-3 w-3 ml-2" />
                        <span>{formattedDate}</span>
                      </div>
                      <div className="space-y-2">
                        {changedFields.map((field: string) => (
                          <div key={field} className="grid grid-cols-2 gap-2">
                            <div className="font-medium">{formatFieldName(field)}:</div>
                            <div className="flex items-center gap-2">
                              <span className="line-through text-muted-foreground">
                                {formatFieldValue(field, oldValues[field])}
                              </span>
                              <ChevronRight className="h-3 w-3 text-muted-foreground" />
                              <span>{formatFieldValue(field, newValues[field])}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
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