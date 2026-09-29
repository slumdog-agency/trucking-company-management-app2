import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { getLocationFromZip } from "@/lib/utils";
import { InputHTMLAttributes } from "react";

interface ZipCodeInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onLocationChange?: (location: {city: string, state: string, county: string}) => void;
  onChange: (value: string) => void;
  error?: string;
}

export function ZipCodeInput({
  id,
  name,
  value = "",
  onChange,
  onLocationChange,
  disabled = false,
  error: propError,
  "aria-invalid": ariaInvalid = false,
  ...props
}: ZipCodeInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [location, setLocation] = useState<{city: string, state: string, county: string} | null>(null);

  const error = propError || internalError;

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchLocation = async () => {
      if (value && value.toString().length === 5) {
        setIsLoading(true);
        setInternalError(null);
        try {
          const locationData = await getLocationFromZip(value.toString());
          
          if (locationData.city === "Unknown City" || locationData.state === "Unknown State") {
            setInternalError("Invalid ZIP code");
            setLocation(null);
          } else {
            setLocation(locationData);
            if (onLocationChange) {
              onLocationChange(locationData);
            }
          }
        } catch (error) {
          console.error(`Error getting location for ${value}:`, error);
          setInternalError("Failed to lookup ZIP code");
          setLocation(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        setLocation(null);
      }
    };
    
    // Add a small delay before making the API call to prevent too many requests
    if (value && value.toString().length === 5) {
      timeoutId = setTimeout(fetchLocation, 500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [value, onLocationChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and limit to 5 digits
    const newValue = e.target.value.replace(/\D/g, '').slice(0, 5);
    
    // Reset error when input changes
    if (internalError) {
      setInternalError(null);
    }
    
    onChange(newValue);
  };

  return (
    <div className="relative space-y-1">
      <Input
        {...props}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={ariaInvalid || !!error}
        maxLength={5}
        placeholder="12345"
        className={`pr-8 ${error ? 'border-destructive' : ''} ${props.className || ''}`}
      />
      {isLoading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
        </div>
      )}
      {location && !error && (
        <p className="text-sm text-muted-foreground">
          {location.city}, {location.state}
        </p>
      )}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}