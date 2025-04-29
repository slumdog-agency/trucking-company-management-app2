import { useState, useEffect } from "react";
import { Trophy, Medal, Award } from "lucide-react";
import { fine } from "@/lib/fine";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatCurrency } from "@/lib/utils";

interface DispatcherStats {
  id: number;
  name: string;
  totalEarnings: number;
  grossDifference: number;
  percentageIncome: number;
}

export function DispatcherRankings() {
  const [rankings, setRankings] = useState<DispatcherStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const calculateRankings = async () => {
      try {
        // Fetch all dispatchers, routes, and drivers
        const dispatchers = await fine.table("users").select().eq("group", "dispatcher");
        const routes = await fine.table("routes").select();
        const drivers = await fine.table("drivers").select();

        if (!dispatchers || !routes || !drivers) return;

        // Calculate stats for each dispatcher
        const stats = dispatchers.map(dispatcher => {
          // Get all drivers assigned to this dispatcher
          const assignedDrivers = drivers.filter(driver => driver.dispatcherId === dispatcher.id);
          const driverIds = assignedDrivers.map(driver => driver.id);
          
          // Get all routes for these drivers
          const dispatcherRoutes = routes.filter(route => driverIds.includes(route.driverId));
          
          // Calculate total earnings (rate - soldFor)
          const totalEarnings = dispatcherRoutes.reduce((sum, route) => 
            sum + ((route.rate || 0) - (route.soldFor || 0)), 0);
          
          // Calculate gross difference (sum of all rates)
          const grossDifference = dispatcherRoutes.reduce((sum, route) => 
            sum + (route.rate || 0), 0);
          
          // Calculate percentage income ((rate - soldFor) / rate * 100)
          const totalPercentage = dispatcherRoutes.reduce((sum, route) => {
            if (route.rate && route.rate > 0) {
              return sum + (((route.rate - (route.soldFor || 0)) / route.rate) * 100);
            }
            return sum;
          }, 0);
          const percentageIncome = dispatcherRoutes.length > 0 
            ? totalPercentage / dispatcherRoutes.length 
            : 0;

          return {
            id: dispatcher.id!,
            name: dispatcher.name || dispatcher.email || 'Unknown',
            totalEarnings,
            grossDifference,
            percentageIncome
          };
        });

        // Sort by different metrics and get top performers
        const sortedByEarnings = [...stats].sort((a, b) => b.totalEarnings - a.totalEarnings);
        const sortedByGross = [...stats].sort((a, b) => b.grossDifference - a.grossDifference);
        const sortedByPercentage = [...stats].sort((a, b) => b.percentageIncome - a.percentageIncome);

        // Combine top performers
        const rankings = [
          { ...sortedByEarnings[0], metric: 'earnings' },
          { ...sortedByGross[0], metric: 'gross' },
          { ...sortedByPercentage[0], metric: 'percentage' }
        ].filter(Boolean);

        setRankings(rankings);
      } catch (error) {
        console.error('Error calculating rankings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    calculateRankings();
  }, []);

  if (isLoading || rankings.length === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-center gap-8 py-2 bg-primary-foreground/10">
        {/* First Place - Total Earnings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-yellow-500">
              <Trophy className="h-6 w-6" />
              <span className="font-medium">{rankings[0]?.name}</span>
              <span>{formatCurrency(rankings[0]?.totalEarnings)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total Earnings Leader</p>
          </TooltipContent>
        </Tooltip>

        {/* Second Place - Gross Difference */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-gray-400">
              <Medal className="h-6 w-6" />
              <span className="font-medium">{rankings[1]?.name}</span>
              <span>{formatCurrency(rankings[1]?.grossDifference)}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Gross Difference Leader</p>
          </TooltipContent>
        </Tooltip>

        {/* Third Place - Percentage Income */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-amber-700">
              <Award className="h-6 w-6" />
              <span className="font-medium">{rankings[2]?.name}</span>
              <span>{rankings[2]?.percentageIncome.toFixed(1)}%</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Percentage Income Leader</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
} 