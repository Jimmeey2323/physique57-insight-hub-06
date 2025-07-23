
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Target, Users, TrendingUp } from 'lucide-react';
import type { SessionData, SalesData, PayrollData } from '@/types/dashboard';
import { formatNumber } from '@/utils/formatters';

interface PowerCycleVsBarreTablesProps {
  powerCycleData: SessionData[];
  barreData: SessionData[];
  salesData: SalesData[];
  payrollData: PayrollData[];
}

export const PowerCycleVsBarreTables: React.FC<PowerCycleVsBarreTablesProps> = ({
  powerCycleData,
  barreData,
  salesData,
  payrollData
}) => {
  // Class format comparison metrics
  const classComparison = React.useMemo(() => {
    const powerCycleMetrics = {
      totalSessions: powerCycleData.length,
      totalAttendance: powerCycleData.reduce((sum, session) => sum + session.checkedIn, 0),
      totalCapacity: powerCycleData.reduce((sum, session) => sum + session.capacity, 0),
      totalBookings: powerCycleData.reduce((sum, session) => sum + session.booked, 0),
      emptySessions: powerCycleData.filter(session => session.checkedIn === 0).length,
    };
    
    const barreMetrics = {
      totalSessions: barreData.length,
      totalAttendance: barreData.reduce((sum, session) => sum + session.checkedIn, 0),
      totalCapacity: barreData.reduce((sum, session) => sum + session.capacity, 0),
      totalBookings: barreData.reduce((sum, session) => sum + session.booked, 0),
      emptySessions: barreData.filter(session => session.checkedIn === 0).length,
    };

    return [
      {
        metric: 'Total Sessions',
        powerCycle: powerCycleMetrics.totalSessions,
        barre: barreMetrics.totalSessions,
        difference: powerCycleMetrics.totalSessions - barreMetrics.totalSessions,
        tooltip: 'Total number of sessions conducted'
      },
      {
        metric: 'Total Capacity',
        powerCycle: powerCycleMetrics.totalCapacity,
        barre: barreMetrics.totalCapacity,
        difference: powerCycleMetrics.totalCapacity - barreMetrics.totalCapacity,
        tooltip: 'Combined capacity across all sessions'
      },
      {
        metric: 'Total Bookings',
        powerCycle: powerCycleMetrics.totalBookings,
        barre: barreMetrics.totalBookings,
        difference: powerCycleMetrics.totalBookings - barreMetrics.totalBookings,
        tooltip: 'Total number of bookings made'
      },
      {
        metric: 'Total Attendance',
        powerCycle: powerCycleMetrics.totalAttendance,
        barre: barreMetrics.totalAttendance,
        difference: powerCycleMetrics.totalAttendance - barreMetrics.totalAttendance,
        tooltip: 'Total number of check-ins'
      },
      {
        metric: 'Empty Classes',
        powerCycle: powerCycleMetrics.emptySessions,
        barre: barreMetrics.emptySessions,
        difference: powerCycleMetrics.emptySessions - barreMetrics.emptySessions,
        tooltip: 'Sessions with zero attendance'
      },
      {
        metric: 'Avg Class Size (Incl Empty)',
        powerCycle: powerCycleMetrics.totalSessions > 0 ? Math.round(powerCycleMetrics.totalAttendance / powerCycleMetrics.totalSessions) : 0,
        barre: barreMetrics.totalSessions > 0 ? Math.round(barreMetrics.totalAttendance / barreMetrics.totalSessions) : 0,
        difference: powerCycleMetrics.totalSessions > 0 && barreMetrics.totalSessions > 0 
          ? Math.round(powerCycleMetrics.totalAttendance / powerCycleMetrics.totalSessions) - Math.round(barreMetrics.totalAttendance / barreMetrics.totalSessions)
          : 0,
        tooltip: 'Average attendance per session including empty classes'
      },
      {
        metric: 'Avg Class Size (Excl Empty)',
        powerCycle: (powerCycleMetrics.totalSessions - powerCycleMetrics.emptySessions) > 0 
          ? Math.round(powerCycleMetrics.totalAttendance / (powerCycleMetrics.totalSessions - powerCycleMetrics.emptySessions))
          : 0,
        barre: (barreMetrics.totalSessions - barreMetrics.emptySessions) > 0 
          ? Math.round(barreMetrics.totalAttendance / (barreMetrics.totalSessions - barreMetrics.emptySessions))
          : 0,
        difference: 0, // Calculate later
        tooltip: 'Average attendance per session excluding empty classes'
      },
      {
        metric: 'Fill Rate %',
        powerCycle: powerCycleMetrics.totalCapacity > 0 ? Math.round((powerCycleMetrics.totalAttendance / powerCycleMetrics.totalCapacity) * 100) : 0,
        barre: barreMetrics.totalCapacity > 0 ? Math.round((barreMetrics.totalAttendance / barreMetrics.totalCapacity) * 100) : 0,
        difference: 0, // Calculate later
        tooltip: 'Percentage of capacity filled'
      }
    ];
  }, [powerCycleData, barreData]);

  // Aggregate instructor performance by class type
  const instructorPerformance = React.useMemo(() => {
    const performance: Record<string, { 
      instructor: string; 
      powerCycleSessions: number; 
      barreSessions: number; 
      powerCycleAttendance: number; 
      barreAttendance: number;
      powerCycleCapacity: number;
      barreCapacity: number;
      powerCycleFillRate: number;
      barreFillRate: number;
    }> = {};
    
    [...powerCycleData, ...barreData].forEach(session => {
      if (!performance[session.instructor]) {
        performance[session.instructor] = {
          instructor: session.instructor,
          powerCycleSessions: 0,
          barreSessions: 0,
          powerCycleAttendance: 0,
          barreAttendance: 0,
          powerCycleCapacity: 0,
          barreCapacity: 0,
          powerCycleFillRate: 0,
          barreFillRate: 0
        };
      }
      
      if (session.cleanedClass?.toLowerCase().includes('power') || session.cleanedClass?.toLowerCase().includes('cycle')) {
        performance[session.instructor].powerCycleSessions++;
        performance[session.instructor].powerCycleAttendance += session.checkedIn;
        performance[session.instructor].powerCycleCapacity += session.capacity;
      } else if (session.cleanedClass?.toLowerCase().includes('barre')) {
        performance[session.instructor].barreSessions++;
        performance[session.instructor].barreAttendance += session.checkedIn;
        performance[session.instructor].barreCapacity += session.capacity;
      }
    });
    
    // Calculate fill rates
    Object.values(performance).forEach(perf => {
      perf.powerCycleFillRate = perf.powerCycleCapacity > 0 ? (perf.powerCycleAttendance / perf.powerCycleCapacity) * 100 : 0;
      perf.barreFillRate = perf.barreCapacity > 0 ? (perf.barreAttendance / perf.barreCapacity) * 100 : 0;
    });
    
    return Object.values(performance).sort((a, b) => 
      (b.powerCycleAttendance + b.barreAttendance) - (a.powerCycleAttendance + a.barreAttendance)
    );
  }, [powerCycleData, barreData]);

  // Monthly trends analysis
  const monthlyTrends = React.useMemo(() => {
    const trends: Record<string, {
      month: string;
      powerCycleSessions: number;
      barreSessions: number;
      powerCycleAttendance: number;
      barreAttendance: number;
      powerCycleCapacity: number;
      barreCapacity: number;
    }> = {};

    [...powerCycleData, ...barreData].forEach(session => {
      const month = session.date.substring(0, 7); // YYYY-MM format
      
      if (!trends[month]) {
        trends[month] = {
          month,
          powerCycleSessions: 0,
          barreSessions: 0,
          powerCycleAttendance: 0,
          barreAttendance: 0,
          powerCycleCapacity: 0,
          barreCapacity: 0
        };
      }

      if (session.cleanedClass?.toLowerCase().includes('power') || session.cleanedClass?.toLowerCase().includes('cycle')) {
        trends[month].powerCycleSessions++;
        trends[month].powerCycleAttendance += session.checkedIn;
        trends[month].powerCycleCapacity += session.capacity;
      } else if (session.cleanedClass?.toLowerCase().includes('barre')) {
        trends[month].barreSessions++;
        trends[month].barreAttendance += session.checkedIn;
        trends[month].barreCapacity += session.capacity;
      }
    });

    return Object.values(trends).sort((a, b) => b.month.localeCompare(a.month)).slice(0, 12);
  }, [powerCycleData, barreData]);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Class Format Comparison Table */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5" />
              PowerCycle vs Barre - Comprehensive Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="font-bold">Metric</TableHead>
                    <TableHead className="text-center font-bold text-blue-600">PowerCycle</TableHead>
                    <TableHead className="text-center font-bold text-green-600">Barre</TableHead>
                    <TableHead className="text-center font-bold">Difference</TableHead>
                    <TableHead className="text-center">Info</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classComparison.map((item, index) => (
                    <TableRow key={item.metric} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{item.metric}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {formatNumber(item.powerCycle)}{item.metric.includes('%') ? '%' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {formatNumber(item.barre)}{item.metric.includes('%') ? '%' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge 
                          variant={item.difference > 0 ? "default" : item.difference < 0 ? "destructive" : "outline"}
                          className={item.difference > 0 ? "bg-emerald-100 text-emerald-800" : ""}
                        >
                          {item.difference > 0 ? '+' : ''}{formatNumber(item.difference)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row */}
                  <TableRow className="bg-gray-100 font-bold border-t-2">
                    <TableCell>TOTAL SESSIONS</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-600 text-white">
                        {formatNumber(powerCycleData.length)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-600 text-white">
                        {formatNumber(barreData.length)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-gray-600 text-white">
                        {formatNumber(powerCycleData.length + barreData.length)} Combined
                      </Badge>
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Instructor Performance Comparison Table */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Instructor Performance by Class Format
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Instructor</TableHead>
                    <TableHead className="text-center">PC Sessions</TableHead>
                    <TableHead className="text-center">PC Attendance</TableHead>
                    <TableHead className="text-center">PC Fill Rate</TableHead>
                    <TableHead className="text-center">Barre Sessions</TableHead>
                    <TableHead className="text-center">Barre Attendance</TableHead>
                    <TableHead className="text-center">Barre Fill Rate</TableHead>
                    <TableHead className="text-center">Total Sessions</TableHead>
                    <TableHead className="text-center">Total Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructorPerformance.slice(0, 15).map((instructor, index) => (
                    <TableRow key={instructor.instructor} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{instructor.instructor}</TableCell>
                      <TableCell className="text-center">{formatNumber(instructor.powerCycleSessions)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {formatNumber(instructor.powerCycleAttendance)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline">
                              {Math.round(instructor.powerCycleFillRate)}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>PowerCycle fill rate: {instructor.powerCycleAttendance}/{instructor.powerCycleCapacity}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-center">{formatNumber(instructor.barreSessions)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {formatNumber(instructor.barreAttendance)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge variant="outline">
                              {Math.round(instructor.barreFillRate)}%
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Barre fill rate: {instructor.barreAttendance}/{instructor.barreCapacity}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">
                          {formatNumber(instructor.powerCycleSessions + instructor.barreSessions)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default">
                          {formatNumber(instructor.powerCycleAttendance + instructor.barreAttendance)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Totals Row for Instructor Table */}
                  <TableRow className="bg-gray-100 font-bold border-t-2">
                    <TableCell>TOTALS</TableCell>
                    <TableCell className="text-center">
                      {formatNumber(instructorPerformance.reduce((sum, i) => sum + i.powerCycleSessions, 0))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-600 text-white">
                        {formatNumber(instructorPerformance.reduce((sum, i) => sum + i.powerCycleAttendance, 0))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">
                      {formatNumber(instructorPerformance.reduce((sum, i) => sum + i.barreSessions, 0))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-600 text-white">
                        {formatNumber(instructorPerformance.reduce((sum, i) => sum + i.barreAttendance, 0))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-gray-600 text-white">
                        {formatNumber(instructorPerformance.reduce((sum, i) => sum + i.powerCycleSessions + i.barreSessions, 0))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-gray-800 text-white">
                        {formatNumber(instructorPerformance.reduce((sum, i) => sum + i.powerCycleAttendance + i.barreAttendance, 0))}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends Table */}
        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Month</TableHead>
                    <TableHead className="text-center">PC Sessions</TableHead>
                    <TableHead className="text-center">PC Attendance</TableHead>
                    <TableHead className="text-center">PC Fill Rate</TableHead>
                    <TableHead className="text-center">Barre Sessions</TableHead>
                    <TableHead className="text-center">Barre Attendance</TableHead>
                    <TableHead className="text-center">Barre Fill Rate</TableHead>
                    <TableHead className="text-center">Total Sessions</TableHead>
                    <TableHead className="text-center">Total Attendance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyTrends.map((month, index) => {
                    const pcFillRate = month.powerCycleCapacity > 0 ? (month.powerCycleAttendance / month.powerCycleCapacity) * 100 : 0;
                    const barreFillRate = month.barreCapacity > 0 ? (month.barreAttendance / month.barreCapacity) * 100 : 0;
                    
                    return (
                      <TableRow key={month.month} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-center">{formatNumber(month.powerCycleSessions)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {formatNumber(month.powerCycleAttendance)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {Math.round(pcFillRate)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{formatNumber(month.barreSessions)}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {formatNumber(month.barreAttendance)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {Math.round(barreFillRate)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">
                            {formatNumber(month.powerCycleSessions + month.barreSessions)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="default">
                            {formatNumber(month.powerCycleAttendance + month.barreAttendance)}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {/* Totals Row for Monthly Table */}
                  <TableRow className="bg-gray-100 font-bold border-t-2">
                    <TableCell>TOTALS</TableCell>
                    <TableCell className="text-center">
                      {formatNumber(monthlyTrends.reduce((sum, m) => sum + m.powerCycleSessions, 0))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-blue-600 text-white">
                        {formatNumber(monthlyTrends.reduce((sum, m) => sum + m.powerCycleAttendance, 0))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">
                      {formatNumber(monthlyTrends.reduce((sum, m) => sum + m.barreSessions, 0))}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-green-600 text-white">
                        {formatNumber(monthlyTrends.reduce((sum, m) => sum + m.barreAttendance, 0))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-gray-600 text-white">
                        {formatNumber(monthlyTrends.reduce((sum, m) => sum + m.powerCycleSessions + m.barreSessions, 0))}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className="bg-gray-800 text-white">
                        {formatNumber(monthlyTrends.reduce((sum, m) => sum + m.powerCycleAttendance + m.barreAttendance, 0))}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
};
