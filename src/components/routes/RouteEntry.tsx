import { useState } from "react";
import { Schema } from "@/lib/db-types";
import { Button } from "@/components/ui/button";
import { Plus, MapPin, DollarSign, Edit2, Copy, Check, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { RouteForm } from "./RouteForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface RouteEntryProps {
  driverId: number;
  date: string;
  routes: Schema["routes"][];
  onAddRoute: (route: Schema["routes"]) => Promise<void>;
  onUpdateRoute: (id: number, route: Schema["routes"]) => Promise<void>;
  onDeleteRoute: (id: number) => Promise<void>;
}

export function RouteEntry({ 
  driverId, 
  date, 
  routes,
  onAddRoute,
  onUpdateRoute,
  onDeleteRoute
}: RouteEntryProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Schema["routes"] | null>(null);
  const [copiedLoadId, setCopiedLoadId] = useState<number | null>(null);

  const handleAddRoute = async (route: Schema["routes"]) => {
    await onAddRoute(route);
    setIsAddDialogOpen(false);
  };

  const handleUpdateRoute = async (route: Schema["routes"]) => {
    if (editingRoute?.id) {
      await onUpdateRoute(editingRoute.id, route);
      setIsEditDialogOpen(false);
      setEditingRoute(null);
    }
  };

  const handleEditRoute = (route: Schema["routes"]) => {
    setEditingRoute(route);
    setIsEditDialogOpen(true);
  };

  const copyLoadNumber = (routeId: number, loadNumber: string) => {
    navigator.clipboard.writeText(loadNumber);
    setCopiedLoadId(routeId);
    setTimeout(() => setCopiedLoadId(null), 2000);
  };

  // Calculate total for the day
  const dailyTotal = routes.reduce((total, route) => total + route.rate, 0);

  // Calculate gross difference for the day
  const dailyGrossDifference = routes.reduce((total, route) => 
    total + (route.soldFor ? route.rate - route.soldFor : 0), 0);

  return (
    <div className="min-h-[66px] p-1 route-entry">
      {routes.length > 0 ? (
        <div className="space-y-2 route-entry-content">
          {routes.map((route) => (
            <div 
              key={route.id} 
              className="text-xs p-1 rounded border border-border relative"
              style={{ 
                backgroundColor: route.statusColor || '#f0f0f0', // Use a light gray default if no color
                color: getContrastTextColor(route.statusColor || '#f0f0f0') // Ensure text is visible
              }}
            >
              <div className="flex items-center justify-between gap-1">
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {route.mileage} mi • ${route.rate}
                  </div>
                  {route.customerLoadNumber && (
                    <div className="text-xs text-muted-foreground">
                      Load #{route.customerLoadNumber}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6" 
                    onClick={() => handleEditRoute(route)}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-destructive" 
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this route?")) {
                        onDeleteRoute(route.id!);
                      }
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <span>{route.mileage} mi</span>
                
                {route.customerLoadNumber && (
                  <div className="flex items-center">
                    <span className="text-xs font-medium mr-1">#{route.customerLoadNumber}</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-4 w-4 p-0" 
                            onClick={() => copyLoadNumber(route.id!, route.customerLoadNumber!)}
                          >
                            {copiedLoadId === route.id ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copiedLoadId === route.id ? "Copied!" : "Copy load number"}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
              
              {route.soldFor && (
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-border/30">
                  <span>Sold: {formatCurrency(route.soldFor)}</span>
                  <span>Earn: {formatCurrency(route.rate - route.soldFor)}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-1">
                <span className="font-medium">{route.status}</span>
              </div>
              
              {route.comments && (
                <div className="mt-1 pt-1 border-t border-border/30">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-[10px] truncate">
                          💬 {route.lastCommentBy ? `${route.lastCommentBy}: ` : ''}
                          {(() => {
                            try {
                              const comments = JSON.parse(route.comments);
                              return comments.length > 0 ? comments[comments.length - 1].text : '';
                            } catch (e) {
                              return '';
                            }
                          })()}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>View all comments in edit mode</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
          ))}
          
          {routes.length > 0 && (
            <div className="text-xs font-medium text-right pt-1 border-t border-border">
              Total: {formatCurrency(dailyTotal)}
              {dailyGrossDifference > 0 && (
                <div>Earnings: {formatCurrency(dailyGrossDifference)}</div>
              )}
            </div>
          )}
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full h-6 text-xs">
                <Plus className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white text-black">
              <DialogHeader>
                <DialogTitle>Add New Route</DialogTitle>
              </DialogHeader>
              <RouteForm 
                driverId={driverId} 
                date={date} 
                onSubmit={handleAddRoute} 
              />
            </DialogContent>
          </Dialog>
          
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="max-w-3xl bg-white text-black">
              <DialogHeader>
                <DialogTitle>Edit Route</DialogTitle>
              </DialogHeader>
              {editingRoute && (
                <RouteForm 
                  driverId={driverId} 
                  date={date} 
                  route={editingRoute}
                  onSubmit={handleUpdateRoute} 
                  isEditing={true}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      ) : (
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full h-8">
              <Plus className="h-4 w-4 mr-1" />
              Add Route
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl bg-white text-black">
            <DialogHeader>
              <DialogTitle>Add New Route</DialogTitle>
            </DialogHeader>
            <RouteForm 
              driverId={driverId} 
              date={date} 
              onSubmit={handleAddRoute} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Helper function to determine if text should be white or black based on background color
function getContrastTextColor(backgroundColor: string): string {
  // Convert hex to RGB
  let hex = backgroundColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  
  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  // Calculate luminance - standard formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}