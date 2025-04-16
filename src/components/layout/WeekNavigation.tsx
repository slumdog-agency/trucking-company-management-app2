import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { formatDate, getNextWeek, getPreviousWeek } from "@/lib/utils";

interface WeekNavigationProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

export function WeekNavigation({ currentDate, onDateChange }: WeekNavigationProps) {
  const [isLoading, setIsLoading] = useState(false);

  const goToPreviousWeek = () => {
    setIsLoading(true);
    // Use setTimeout to allow the UI to update before processing
    setTimeout(() => {
      onDateChange(getPreviousWeek(currentDate));
      setIsLoading(false);
    }, 10);
  };

  const goToNextWeek = () => {
    setIsLoading(true);
    // Use setTimeout to allow the UI to update before processing
    setTimeout(() => {
      onDateChange(getNextWeek(currentDate));
      setIsLoading(false);
    }, 10);
  };

  const goToCurrentWeek = () => {
    setIsLoading(true);
    // Use setTimeout to allow the UI to update before processing
    setTimeout(() => {
      onDateChange(new Date());
      setIsLoading(false);
    }, 10);
  };

  return (
    <div className="flex items-center justify-between py-4 px-2 bg-muted/30 rounded-lg mb-4">
      <Button variant="outline" size="sm" onClick={goToPreviousWeek} disabled={isLoading}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous Week
      </Button>
      
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-medium">
          Week of {formatDate(currentDate)}
        </h2>
        <Button variant="ghost" size="sm" onClick={goToCurrentWeek} disabled={isLoading}>
          Today
        </Button>
      </div>
      
      <Button variant="outline" size="sm" onClick={goToNextWeek} disabled={isLoading}>
        Next Week
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}