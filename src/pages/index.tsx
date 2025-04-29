import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { WeekNavigation } from "@/components/layout/WeekNavigation";
import { DriverTable } from "@/components/drivers/DriverTable";

const Index = () => {
  const [currentDate, setCurrentDate] = useState(new Date());

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container mx-auto py-5 px-3">
        <div className="mb-5">
          <h1 className="text-2xl font-bold tracking-tight">Trucking Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your drivers, routes, and track earnings
          </p>
        </div>
        
        <WeekNavigation 
          currentDate={currentDate} 
          onDateChange={setCurrentDate} 
        />
        
        <div className="mt-5 border rounded-lg shadow-sm">
          <DriverTable currentDate={currentDate} />
        </div>
      </main>
      
      <footer className="border-t py-3 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} CarrierXXL. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;