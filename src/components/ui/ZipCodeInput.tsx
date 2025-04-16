import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { getLocationFromZip } from "@/lib/utils";

interface ZipCodeInputProps {
  id: string;
  name: string;
  value?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLocationChange?: (location: {city: string, state: string, county: string}) => void;
  disabled?: boolean;
  "aria-invalid"?: boolean;
}

export function ZipCodeInput({
  id,
  name,
  value = "",
  onChange,
  onLocationChange,
  disabled = false,
  "aria-invalid": ariaInvalid = false,
}: ZipCodeInputProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLocation = async () => {
      if (value && value.length === 5) {
        setIsLoading(true);
        try {
          const locationData = await getLocationFromZip(value);
          if (onLocationChange && locationData) {
            onLocationChange(locationData);
          }
        } catch (error) {
          console.error(`Error getting location for ${value}:`, error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    
    fetchLocation();
  }, [value, onLocationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 5 digits
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 5);
    
    // Create a new event with the sanitized value
    const newEvent = {
      ...e,
      target: {
        ...e.target,
        name,
        value: newValue
      }
    };
    
    onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        maxLength={5}
        placeholder="12345"
        className="pr-8"
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )}
    </div>
  );
}