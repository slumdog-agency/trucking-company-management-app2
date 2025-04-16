import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, isSameDay } from "date-fns"
import { fine } from "@/lib/fine"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function getWeekDays(date: Date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 1 }) // Start on Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }) // End on Sunday
  
  return eachDayOfInterval({ start, end }).map(day => ({
    date: day,
    dayName: format(day, 'EEE'),
    dayNumber: format(day, 'd'),
    fullDate: format(day, 'yyyy-MM-dd'),
    isToday: isSameDay(day, new Date())
  }))
}

export function getNextWeek(currentDate: Date): Date {
  return addWeeks(currentDate, 1)
}

export function getPreviousWeek(currentDate: Date): Date {
  return addWeeks(currentDate, -1)
}

export function formatDate(date: Date): string {
  return format(date, 'MMM d, yyyy')
}

// ZIP code database (simplified for demo)
// In a real app, you would use a proper ZIP code API or database
const zipCodeDatabase: Record<string, { city: string, state: string, county: string, lat: number, lng: number }> = {
  "10001": { city: "New York", state: "NY", county: "New York County", lat: 40.7501, lng: -73.9970 },
  "90210": { city: "Beverly Hills", state: "CA", county: "Los Angeles County", lat: 34.0901, lng: -118.4065 },
  "60601": { city: "Chicago", state: "IL", county: "Cook County", lat: 41.8855, lng: -87.6217 },
  "75001": { city: "Addison", state: "TX", county: "Dallas County", lat: 32.9617, lng: -96.8302 },
  "33101": { city: "Miami", state: "FL", county: "Miami-Dade County", lat: 25.7751, lng: -80.2105 },
  "20001": { city: "Washington", state: "DC", county: "District of Columbia", lat: 38.9121, lng: -77.0147 },
  "02108": { city: "Boston", state: "MA", county: "Suffolk County", lat: 42.3588, lng: -71.0638 },
  "80201": { city: "Denver", state: "CO", county: "Denver County", lat: 39.7392, lng: -104.9847 },
  "98101": { city: "Seattle", state: "WA", county: "King County", lat: 47.6101, lng: -122.3421 },
  "30301": { city: "Atlanta", state: "GA", county: "Fulton County", lat: 33.7490, lng: -84.3880 },
  // Add more as needed
};

export async function getLocationFromZip(zipCode: string): Promise<{ city: string, state: string, county: string }> {
  try {
    // First check if we have this zip code in our database
    const zipData = await fine.table("zipCodes").select().eq("zipCode", zipCode);
    
    if (zipData && zipData.length > 0) {
      return {
        city: zipData[0].city,
        state: zipData[0].state,
        county: zipData[0].county || ""
      };
    }
    
    // If not in our database, check the local fallback
    const location = zipCodeDatabase[zipCode];
    
    if (location) {
      return {
        city: location.city,
        state: location.state,
        county: location.county
      };
    }
    
    // If not found in our database or local fallback, return a placeholder
    return {
      city: "Unknown City",
      state: "Unknown State",
      county: ""
    };
  } catch (error) {
    console.error("Error fetching zip code data:", error);
    
    // Fallback to local database if API fails
    const location = zipCodeDatabase[zipCode];
    
    if (location) {
      return {
        city: location.city,
        state: location.state,
        county: location.county
      };
    }
    
    return {
      city: "Unknown City",
      state: "Unknown State",
      county: ""
    };
  }
}

export async function saveZipCodeLocation(zipCode: string, city: string, state: string, county: string): Promise<void> {
  try {
    // Check if this zip code already exists
    const existingZip = await fine.table("zipCodes").select().eq("zipCode", zipCode);
    
    if (existingZip && existingZip.length > 0) {
      // Update existing record
      await fine.table("zipCodes").update({
        city,
        state,
        county
      }).eq("id", existingZip[0].id!);
    } else {
      // Create new record
      await fine.table("zipCodes").insert({
        zipCode,
        city,
        state,
        county
      });
    }
  } catch (error) {
    console.error("Error saving zip code data:", error);
  }
}

// Distance calculation using a more accurate method
export async function calculateDistance(originZip: string, destinationZip: string): Promise<number> {
  try {
    // First try to get locations from our database
    const originLocation = await getLocationFromZip(originZip);
    const destinationLocation = await getLocationFromZip(destinationZip);
    
    // If we have state information, use state-to-state distance estimation
    if (originLocation.state && destinationLocation.state) {
      // If same state, use a shorter distance estimate
      if (originLocation.state === destinationLocation.state) {
        // For same state, estimate based on zip code difference
        const zipDiff = Math.abs(parseInt(originZip) - parseInt(destinationZip));
        // Rough estimation - adjust as needed
        return Math.min(Math.max(Math.round(zipDiff / 100) * 5, 10), 200);
      }
      
      // For different states, use state-to-state distance estimation
      const stateDistances: Record<string, Record<string, number>> = {
        "NY": { "NJ": 50, "PA": 150, "CT": 80, "MA": 180 },
        "CA": { "NV": 200, "OR": 300, "AZ": 400 },
        "TX": { "OK": 250, "LA": 300, "NM": 500 },
        // Add more state-to-state distances as needed
      };
      
      // Check if we have a predefined distance
      if (stateDistances[originLocation.state]?.[destinationLocation.state]) {
        return stateDistances[originLocation.state][destinationLocation.state];
      }
      
      // If no predefined distance, use a formula based on zip code difference
      const zipDiff = Math.abs(parseInt(originZip) - parseInt(destinationZip));
      return Math.min(Math.max(Math.round(zipDiff / 50) * 10, 100), 2000);
    }
    
    // Fallback to coordinates if available
    const origin = zipCodeDatabase[originZip];
    const destination = zipCodeDatabase[destinationZip];
    
    if (origin && destination) {
      // Calculate distance using Haversine formula
      const R = 3958.8; // Earth's radius in miles
      const lat1 = origin.lat * Math.PI / 180;
      const lat2 = destination.lat * Math.PI / 180;
      const deltaLat = (destination.lat - origin.lat) * Math.PI / 180;
      const deltaLng = (destination.lng - origin.lng) * Math.PI / 180;
      
      const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLng/2) * Math.sin(deltaLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      // Add 15% to account for road routes vs straight lines
      return Math.round(distance * 1.15);
    }
    
    // If all else fails, return a reasonable estimate
    return Math.floor(Math.random() * 300) + 100; // Random distance between 100-400 miles
  } catch (error) {
    console.error("Error calculating distance:", error);
    return 250; // Default fallback distance
  }
}

// App settings management
export const APP_SETTINGS_KEY = "truckingAppSettings";

export function saveAppSettings(settings: Record<string, any>): void {
  try {
    const currentSettings = getAppSettings();
    const updatedSettings = { ...currentSettings, ...settings };
    localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(updatedSettings));
  } catch (error) {
    console.error("Error saving app settings:", error);
  }
}

export function getAppSettings(): Record<string, any> {
  try {
    const settings = localStorage.getItem(APP_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : {
      defaultDriverPercentage: 25,
      showWeeklyTotals: true,
      enableNotifications: true
    };
  } catch (error) {
    console.error("Error getting app settings:", error);
    return {
      defaultDriverPercentage: 25,
      showWeeklyTotals: true,
      enableNotifications: true
    };
  }
}