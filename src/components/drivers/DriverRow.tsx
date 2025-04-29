import { useState, useEffect } from "react";
import { Schema } from "@/lib/db-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Save, Trash2, Phone } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RouteEntry } from "@/components/routes/RouteEntry";
import { fine } from "@/lib/fine";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";

interface DriverRowProps {
  driver: Schema["drivers"];
  weekDays: { fullDate: string; dayName: string; dayNumber: string; isToday: boolean }[];
  routes: Schema["routes"][];
  trucks: Schema["trucks"][];
  trailers: Schema["trailers"][];
  onUpdateDriver: (id: number, data: Partial<Schema["drivers"]>) => Promise<void>;
  onDeleteDriver: (id: number) => Promise<void>;
  onAddRoute: (data: Partial<Schema["routes"]>) => Promise<void>;
  onUpdateRoute: (id: number, data: Partial<Schema["routes"]>) => Promise<void>;
  onDeleteRoute: (id: number) => Promise<void>;
  activeFilters: string[];
  onViewProfile: (id: number) => void;
  showWeeklyTotals: boolean;
}

export function DriverRow({ 
  driver, 
  weekDays, 
  routes,
  trucks,
  trailers,
  onUpdateDriver,
  onDeleteDriver,
  onAddRoute,
  onUpdateRoute,
  onDeleteRoute,
  activeFilters,
  onViewProfile,
  showWeeklyTotals
}: DriverRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDriver, setEditedDriver] = useState<Schema["drivers"]>(driver);
  const [dispatchers, setDispatchers] = useState<Schema["dispatchers"][]>([]);
  const [loadingDispatchers, setLoadingDispatchers] = useState(false);

  useEffect(() => {
    // Only fetch dispatchers when editing
    if (isEditing) {
      const fetchDispatchers = async () => {
        setLoadingDispatchers(true);
        try {
          const data = await fine.table("dispatchers").select();
          setDispatchers(data || []);
        } catch (error) {
          console.error("Error fetching dispatchers:", error);
        } finally {
          setLoadingDispatchers(false);
        }
      };
      
      fetchDispatchers();
    }
  }, [isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedDriver(prev => ({
      ...prev,
      [name]: name === 'count' || name === 'percentage' ? parseFloat(value) : value
    }));
  };

  const handleDispatcherChange = (value: string) => {
    const selectedDispatcher = dispatchers.find(d => d.id === parseInt(value));
    
    if (selectedDispatcher) {
      setEditedDriver(prev => ({
        ...prev,
        dispatcherId: selectedDispatcher.id,
        dispatcher: `${selectedDispatcher.firstName} ${selectedDispatcher.lastName}`
      }));
    }
  };

  const handleSave = async () => {
    if (driver.id) {
      await onUpdateDriver(driver.id, editedDriver);
      setIsEditing(false);
    }
  };

  const handleDelete = async () => {
    if (driver.id && confirm("Are you sure you want to delete this driver?")) {
      await onDeleteDriver(driver.id);
    }
  };

  const handleCallDriver = () => {
    if (driver.phone) {
      window.location.href = `tel:${driver.phone}`;
    }
  };

  // Filter routes for this driver
  const driverRoutes = routes.filter(route => route.driverId === driver.id);

  // Calculate weekly total gross - sum of all route rates
  const weeklyTotalGross = driverRoutes.reduce((total, route) => {
    return total + route.rate;
  }, 0);
  
  // Calculate total miles
  const totalMiles = driverRoutes.reduce((total, route) => {
    return total + (route.mileage || 0);
  }, 0);

  // Calculate gross difference
  const grossDifference = driverRoutes.reduce((total, route) => {
    return total + (route.soldFor ? route.rate - route.soldFor : 0);
  }, 0);
  
  // Calculate percentage income
  const percentageIncome = driverRoutes.reduce((total, route) => {
    return total + (route.soldFor ? route.soldFor * (driver.percentage / 100) : 0);
  }, 0);
  
  // Calculate total earnings
  const totalEarnings = grossDifference + percentageIncome;

  return (
    <tr className="border-b border-border">
      {/* Fixed columns - exactly as specified in requirements */}
      {activeFilters.includes('count') && (
        <td className="p-2 text-center">{driver.count}</td>
      )}
      
      {activeFilters.includes('percentage') && (
        <td className="p-2 text-center">{driver.percentage}%</td>
      )}
      
      {(activeFilters.includes('firstName') || activeFilters.includes('lastName')) && (
        <td className="p-2">
          <button 
            onClick={() => driver.id && onViewProfile(driver.id)}
            className="text-primary hover:underline font-medium"
          >
            {driver.firstName} {driver.lastName}
          </button>
        </td>
      )}
      
      {activeFilters.includes('phone') && (
        <td className="p-2">
          {driver.phone ? (
            <button 
              onClick={handleCallDriver}
              className="flex items-center text-primary hover:underline"
            >
              <Phone className="h-3 w-3 mr-1" />
              {driver.phone}
            </button>
          ) : (
            "-"
          )}
        </td>
      )}
      
      {activeFilters.includes('dispatcher') && (
        <td className="p-2">
          {isEditing ? (
            loadingDispatchers ? (
              <div className="h-8 flex items-center">Loading...</div>
            ) : (
              <Select 
                defaultValue={driver.dispatcherId?.toString()} 
                onValueChange={handleDispatcherChange}
              >
                <SelectTrigger className="h-8">
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
            )
          ) : (
            driver.dispatcher
          )}
        </td>
      )}
      
      {/* Days of the week */}
      {weekDays.map((day) => {
        const dayRoutes = driverRoutes.filter(route => 
          route.date === day.fullDate
        );
        
        return (
          <td key={day.fullDate} className={`p-1 border-l border-border ${day.isToday ? 'bg-muted/30' : ''}`}>
            <RouteEntry 
              driverId={driver.id || 0} 
              date={day.fullDate}
              routes={dayRoutes}
              onAddRoute={onAddRoute}
              onUpdateRoute={onUpdateRoute}
              onDeleteRoute={onDeleteRoute}
            />
          </td>
        );
      })}

      {showWeeklyTotals && (
        <>
          {/* Weekly total gross */}
          <td className="p-2 font-medium text-right border-l border-border">
            {formatCurrency(weeklyTotalGross)}
          </td>

          {/* Gross difference */}
          <td className="p-2 font-medium text-right border-l border-border">
            {formatCurrency(grossDifference)}
          </td>

          {/* Percentage income */}
          <td className="p-2 font-medium text-right border-l border-border">
            {formatCurrency(percentageIncome)}
          </td>
          
          {/* Total earnings */}
          <td className="p-2 font-medium text-right border-l border-border">
            {formatCurrency(totalEarnings)}
          </td>
        </>
      )}

      {/* Actions */}
      <td className="p-2 text-right">
        {isEditing ? (
          <Button size="sm" variant="ghost" onClick={handleSave}>
            <Save className="h-4 w-4" />
          </Button>
        ) : (
          <div className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}