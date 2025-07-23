import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Users, Target, TrendingUp, CreditCard, Home } from 'lucide-react';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { PowerCycleVsBarreCharts } from './PowerCycleVsBarreCharts';
import { PowerCycleVsBarreTables } from './PowerCycleVsBarreTables';
import { PowerCycleVsBarreTopBottomLists } from './PowerCycleVsBarreTopBottomLists';
import { FilterSection } from './FilterSection';
import { MetricCard } from './MetricCard';
import { formatNumber } from '@/utils/formatters';
import { useNavigate } from 'react-router-dom';
import type { SessionData, SalesData, FilterOptions } from '@/types/dashboard';

export const PowerCycleVsBarreSection: React.FC = () => {
  const { data: payrollData, isLoading: payrollLoading, error: payrollError } = usePayrollData();
  const { data: sessionsData, loading: sessionsLoading, error: sessionsError } = useSessionsData();
  const { data: salesData, loading: salesLoading, error: salesError } = useGoogleSheets();
  const navigate = useNavigate();
  
  const [activeLocation, setActiveLocation] = useState('all');
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: { start: '', end: '' },
    location: [],
    category: [],
    product: [],
    soldBy: [],
    paymentMethod: []
  });

  // Get unique locations from sessions data
  const locations = useMemo(() => {
    if (!sessionsData || sessionsData.length === 0) {
      return [{ id: 'all', name: 'All Locations', fullName: 'All Locations' }];
    }

    const uniqueLocations = Array.from(new Set(sessionsData.map(session => session.location)))
      .filter(location => location && location.trim() !== '')
      .map((location, index) => ({
        id: location.toLowerCase().replace(/\s+/g, '-'),
        name: location.length > 15 ? location.substring(0, 15) + '...' : location,
        fullName: location
      }));

    return [
      { id: 'all', name: 'All Locations', fullName: 'All Locations' },
      ...uniqueLocations
    ];
  }, [sessionsData]);

  // Transform sessions data to match dashboard types and filter by location
  const transformedSessionsData: SessionData[] = useMemo(() => {
    if (!sessionsData) return [];
    
    const filteredByLocation = activeLocation === 'all' 
      ? sessionsData 
      : sessionsData.filter(session => 
          session.location.toLowerCase().replace(/\s+/g, '-') === activeLocation
        );
    
    return filteredByLocation.map(session => ({
      sessionId: session.sessionId,
      date: session.date,
      time: session.time,
      classType: session.classType,
      cleanedClass: session.cleanedClass,
      instructor: session.trainerName,
      location: session.location,
      capacity: session.capacity,
      booked: session.bookedCount,
      checkedIn: session.checkedInCount,
      checkedInCount: session.checkedInCount,
      sessionCount: 1,
      fillPercentage: session.fillPercentage || 0,
      waitlist: 0,
      noShows: session.bookedCount - session.checkedInCount
    }));
  }, [sessionsData, activeLocation]);

  // Filter data by class type with more comprehensive matching
  const powerCycleData = useMemo(() => {
    return transformedSessionsData.filter(session => {
      const className = session.cleanedClass?.toLowerCase() || '';
      const sessionName = session.classType?.toLowerCase() || '';
      
      return className.includes('power') || 
             className.includes('cycle') || 
             className.includes('spinning') ||
             sessionName.includes('power') || 
             sessionName.includes('cycle') ||
             sessionName.includes('spinning');
    });
  }, [transformedSessionsData]);

  const barreData = useMemo(() => {
    return transformedSessionsData.filter(session => {
      const className = session.cleanedClass?.toLowerCase() || '';
      const sessionName = session.classType?.toLowerCase() || '';
      
      return className.includes('barre') || sessionName.includes('barre');
    });
  }, [transformedSessionsData]);

  // Calculate enhanced metrics for both class types
  const powerCycleMetrics = useMemo(() => {
    const totalSessions = powerCycleData.length;
    const totalAttendance = powerCycleData.reduce((sum, session) => sum + session.checkedIn, 0);
    const totalCapacity = powerCycleData.reduce((sum, session) => sum + session.capacity, 0);
    const totalBookings = powerCycleData.reduce((sum, session) => sum + session.booked, 0);
    const emptySessions = powerCycleData.filter(session => session.checkedIn === 0).length;
    const nonEmptySessions = totalSessions - emptySessions;
    
    const avgFillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    const avgSessionSize = totalSessions > 0 ? totalAttendance / totalSessions : 0;
    const avgSessionSizeExclEmpty = nonEmptySessions > 0 ? totalAttendance / nonEmptySessions : 0;
    
    return {
      totalSessions,
      totalAttendance,
      totalCapacity,
      totalBookings,
      emptySessions,
      avgFillRate,
      avgSessionSize,
      avgSessionSizeExclEmpty,
      noShows: totalBookings - totalAttendance
    };
  }, [powerCycleData]);

  const barreMetrics = useMemo(() => {
    const totalSessions = barreData.length;
    const totalAttendance = barreData.reduce((sum, session) => sum + session.checkedIn, 0);
    const totalCapacity = barreData.reduce((sum, session) => sum + session.capacity, 0);
    const totalBookings = barreData.reduce((sum, session) => sum + session.booked, 0);
    const emptySessions = barreData.filter(session => session.checkedIn === 0).length;
    const nonEmptySessions = totalSessions - emptySessions;
    
    const avgFillRate = totalCapacity > 0 ? (totalAttendance / totalCapacity) * 100 : 0;
    const avgSessionSize = totalSessions > 0 ? totalAttendance / totalSessions : 0;
    const avgSessionSizeExclEmpty = nonEmptySessions > 0 ? totalAttendance / nonEmptySessions : 0;
    
    return {
      totalSessions,
      totalAttendance,
      totalCapacity,
      totalBookings,
      emptySessions,
      avgFillRate,
      avgSessionSize,
      avgSessionSizeExclEmpty,
      noShows: totalBookings - totalAttendance
    };
  }, [barreData]);

  const loading = payrollLoading || sessionsLoading || salesLoading;
  const error = payrollError || sessionsError || salesError;

  // Handler function that properly accepts FilterOptions only
  const handleFiltersChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  console.log('PowerCycle vs Barre Debug:', {
    totalSessions: sessionsData?.length || 0,
    powerCycleSessions: powerCycleData.length,
    barreSessions: barreData.length,
    activeLocation,
    locations: locations.map(l => ({ id: l.id, name: l.name })),
    powerCycleMetrics,
    barreMetrics
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Card className="p-8 bg-white shadow-lg">
          <CardContent className="flex items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <div>
              <p className="text-lg font-semibold text-gray-800">Loading Analysis Data</p>
              <p className="text-sm text-gray-600">Comparing PowerCycle vs Barre performance...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-4">
        <Card className="p-8 bg-white shadow-lg max-w-md">
          <CardContent className="text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-red-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-800">Connection Error</p>
              <p className="text-sm text-gray-600 mt-2">{error?.toString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      {/* Animated Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-20 right-10 w-24 h-24 bg-pink-300/20 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute bottom-10 left-20 w-40 h-40 bg-purple-300/10 rounded-full animate-pulse delay-500"></div>
        </div>
        
        <div className="relative px-8 py-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <Button 
                onClick={() => navigate('/')} 
                variant="outline" 
                size="sm" 
                className="gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
            
            <div className="text-center space-y-4">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 border border-white/20 animate-fade-in-up">
                <Target className="w-5 h-5" />
                <span className="font-medium">Class Format Comparison</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent animate-fade-in-up delay-200">
                PowerCycle vs Barre
              </h1>
              
              <p className="text-xl text-purple-100 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-300">
                Comprehensive performance analysis between PowerCycle and Barre class formats
              </p>
              
              <div className="flex items-center justify-center gap-8 mt-8 animate-fade-in-up delay-500">
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{formatNumber(powerCycleMetrics.totalSessions)}</div>
                  <div className="text-sm text-purple-200">PowerCycle Sessions</div>
                </div>
                <div className="w-px h-12 bg-white/30" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">{formatNumber(barreMetrics.totalSessions)}</div>
                  <div className="text-sm text-purple-200">Barre Sessions</div>
                </div>
                <div className="w-px h-12 bg-white/30" />
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {Math.round(powerCycleMetrics.avgFillRate)}% vs {Math.round(barreMetrics.avgFillRate)}%
                  </div>
                  <div className="text-sm text-purple-200">Avg Fill Rates</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Location Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
          <CardContent className="p-2">
            <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
              <TabsList className={`grid w-full grid-cols-${Math.min(locations.length, 4)} bg-gradient-to-r from-slate-100 to-slate-200 p-2 rounded-2xl h-auto gap-2`}>
                {locations.map((location) => (
                  <TabsTrigger
                    key={location.id}
                    value={location.id}
                    className="rounded-xl px-6 py-4 font-semibold text-sm transition-all duration-300"
                  >
                    <div className="text-center">
                      <div className="font-bold">{location.name}</div>
                      <div className="text-xs opacity-75">{location.fullName}</div>
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab Content */}
              {locations.map((location) => (
                <TabsContent key={location.id} value={location.id} className="space-y-8 mt-8">
                  {/* Filters Section */}
                  <FilterSection
                    data={salesData || []}
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    type="sales"
                  />

                  {/* Enhanced Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                      data={{
                        title: "PowerCycle Capacity",
                        value: formatNumber(powerCycleMetrics.totalCapacity),
                        change: 0,
                        description: "Total PowerCycle capacity",
                        calculation: "Sum of all PowerCycle session capacities",
                        icon: "sessions"
                      }}
                    />
                    <MetricCard
                      data={{
                        title: "Barre Capacity",
                        value: formatNumber(barreMetrics.totalCapacity),
                        change: 0,
                        description: "Total Barre capacity",
                        calculation: "Sum of all Barre session capacities",
                        icon: "sessions"
                      }}
                    />
                    <MetricCard
                      data={{
                        title: "PowerCycle Bookings",
                        value: formatNumber(powerCycleMetrics.totalBookings),
                        change: 0,
                        description: "Total PowerCycle bookings",
                        calculation: "Sum of all PowerCycle bookings",
                        icon: "users"
                      }}
                    />
                    <MetricCard
                      data={{
                        title: "Barre Bookings",
                        value: formatNumber(barreMetrics.totalBookings),
                        change: 0,
                        description: "Total Barre bookings",
                        calculation: "Sum of all Barre bookings",
                        icon: "users"
                      }}
                    />
                  </div>

                  {/* Second Row of Enhanced Metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <MetricCard
                      data={{
                        title: "PowerCycle Empty Classes",
                        value: formatNumber(powerCycleMetrics.emptySessions),
                        change: 0,
                        description: "PowerCycle sessions with 0 attendance",
                        calculation: "Count of sessions with no check-ins",
                        icon: "sessions"
                      }}
                    />
                    <MetricCard
                      data={{
                        title: "Barre Empty Classes",
                        value: formatNumber(barreMetrics.emptySessions),
                        change: 0,
                        description: "Barre sessions with 0 attendance",
                        calculation: "Count of sessions with no check-ins",
                        icon: "sessions"
                      }}
                    />
                    <MetricCard
                      data={{
                        title: "PowerCycle Avg (Excl Empty)",
                        value: Math.round(powerCycleMetrics.avgSessionSizeExclEmpty).toString(),
                        change: 0,
                        description: "Average PowerCycle size excluding empty",
                        calculation: "Average attendees per non-empty session",
                        icon: "average"
                      }}
                    />
                    <MetricCard
                      data={{
                        title: "Barre Avg (Excl Empty)",
                        value: Math.round(barreMetrics.avgSessionSizeExclEmpty).toString(),
                        change: 0,
                        description: "Average Barre size excluding empty",
                        calculation: "Average attendees per non-empty session",
                        icon: "average"
                      }}
                    />
                  </div>

                  {/* Charts Section */}
                  <PowerCycleVsBarreCharts 
                    powerCycleData={powerCycleData} 
                    barreData={barreData}
                  />

                  {/* Enhanced Tables Section */}
                  <PowerCycleVsBarreTables 
                    powerCycleData={powerCycleData} 
                    barreData={barreData}
                    salesData={salesData || []}
                    payrollData={payrollData || []}
                  />

                  {/* Top/Bottom Lists */}
                  <PowerCycleVsBarreTopBottomLists 
                    powerCycleData={powerCycleData} 
                    barreData={barreData}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
};
