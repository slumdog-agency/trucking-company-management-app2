import { useState, useEffect, useRef } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { getLocationFromZip } from "@/lib/utils";

interface ZipCodeInputProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onLocationChange?: (location: { city: string; state: string; county?: string }) => void;
  disabled?: boolean;
  error?: string;
}

export function ZipCodeInput({
  id,
  label,
  value,
  onChange,
  onLocationChange,
  disabled = false,
  error,
}: ZipCodeInputProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const lastZipRef = useRef<string>("");
  const lastLocationRef = useRef<{ city: string; state: string; county?: string } | null>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Debounce lookup
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    if (value.length === 5) {
      setIsLoading(true);
      setIsValid(null);
      debounceTimeout.current = setTimeout(async () => {
        // Only lookup if ZIP changed
        if (lastZipRef.current !== value) {
          lastZipRef.current = value;
          try {
            const location = await getLocationFromZip(value);
            if (location) {
              setIsValid(true);
              setIsLoading(false);
              // Only call onLocationChange if city/state/county changed
              if (
                !lastLocationRef.current ||
                lastLocationRef.current.city !== location.city ||
                lastLocationRef.current.state !== location.state ||
                lastLocationRef.current.county !== location.county
              ) {
                lastLocationRef.current = location;
                if (onLocationChange) {
                  onLocationChange(location);
                }
              }
            } else {
              setIsValid(false);
              setIsLoading(false);
            }
          } catch (error) {
            setIsValid(false);
            setIsLoading(false);
            console.error("Error fetching location:", error);
          }
        } else {
          setIsLoading(false);
        }
      }, 350);
    } else {
      setIsValid(null);
      setIsLoading(false);
      lastZipRef.current = "";
      lastLocationRef.current = null;
    }
    // Cleanup
    return () => {
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    };
  }, [value, onLocationChange]);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          pattern="[0-9]*"
          maxLength={5}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value.replace(/\D/g, "");
            onChange(newValue);
          }}
          disabled={disabled}
          className={`${isLoading ? "pr-8" : ""} ${error ? "border-destructive" : ""} ${isValid === true ? "border-green-500" : ""}`}
        />
        {isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {isValid === true && !isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full bg-green-500" />
          </div>
        )}
        {isValid === false && !isLoading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 rounded-full bg-destructive" />
          </div>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}