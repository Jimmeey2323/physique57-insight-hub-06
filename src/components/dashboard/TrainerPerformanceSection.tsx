import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, BarChart3, Calendar, Target, Award, DollarSign, Activity, Building2, MapPin, Crown, Trophy, Star } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { TrainerFilterSection } from './TrainerFilterSection';
import { TopBottomSellers } from './TopBottomSellers';
import { MonthOnMonthTrainerTable } from './MonthOnMonthTrainerTable';
import { YearOnYearTrainerTable } from './YearOnYearTrainerTable';
import { TrainerQuickFilters } from './TrainerQuickFilters';
import { TrainerInsights } from './TrainerInsights';
import { TrainerWordCloud } from './TrainerWordCloud';
import { usePayrollData, PayrollData } from '@/hooks/usePayrollData';
import { TrainerMetricType } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';
const LOCATION_MAPPING = [{
  id: 'kwality',
  name: 'Kwality House, Kemps Corner',
  fullName: 'Kwality House, Kemps Corner'
}, {
  id: 'supreme',
  name: 'Supreme HQ, Bandra',
  fullName: 'Supreme HQ, Bandra'
}, {
  id: 'kenkere',
  name: 'Kenkere House',
  fullName: 'Kenkere House'
}];
export const TrainerPerformanceSection = () => {
  const {
    data: rawData,
    isLoading,
    error
  } = usePayrollData();
  const [activeLocation, setActiveLocation] = useState<string>('all');
  const [activeMetric, setActiveMetric] = useState<TrainerMetricType>('totalSessions');
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(false);
  const [quickFilters, setQuickFilters] = useState<Record<string, string[]>>({});
  const [filters, setFilters] = useState({
    location: '',
    trainer: '',
    month: ''
  });
  const filteredData = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return [];
    }
    let filtered = rawData;

    // Apply location filter
    if (activeLocation !== 'all') {
      const activeLocationName = LOCATION_MAPPING.find(loc => loc.id === activeLocation)?.fullName;
      if (activeLocationName) {
        filtered = filtered.filter(item => item.location === activeLocationName);
      }
    }

    // Apply additional filters
    if (filters.location) {
      filtered = filtered.filter(item => item.location === filters.location);
    }
    if (filters.trainer) {
      filtered = filtered.filter(item => item.teacherName === filters.trainer);
    }
    if (filters.month) {
      filtered = filtered.filter(item => item.monthYear === filters.month);
    }
    return filtered;
  }, [rawData, activeLocation, filters]);
  const processedData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return null;
    }
    const totalSessions = filteredData.reduce((sum, item) => sum + (item.totalSessions || 0), 0);
    const totalCustomers = filteredData.reduce((sum, item) => sum + (item.totalCustomers || 0), 0);
    const totalRevenue = filteredData.reduce((sum, item) => sum + (item.totalPaid || 0), 0);
    const totalEmptySessions = filteredData.reduce((sum, item) => sum + (item.totalEmptySessions || 0), 0);
    const totalNonEmptySessions = filteredData.reduce((sum, item) => sum + (item.totalNonEmptySessions || 0), 0);
    const avgClassSize = totalNonEmptySessions > 0 ? totalCustomers / totalNonEmptySessions : 0;

    // Fix NaN issues by properly parsing and validating retention/conversion values
    const validRetentionData = filteredData.filter(item => {
      const retentionValue = typeof item.retention === 'string' ? parseFloat(item.retention.replace('%', '') || '0') : item.retention || 0;
      return !isNaN(retentionValue) && isFinite(retentionValue);
    });
    const validConversionData = filteredData.filter(item => {
      const conversionValue = typeof item.conversion === 'string' ? parseFloat(item.conversion.replace('%', '') || '0') : item.conversion || 0;
      return !isNaN(conversionValue) && isFinite(conversionValue);
    });
    const avgRetention = validRetentionData.length > 0 ? validRetentionData.reduce((sum, item) => {
      const retentionValue = typeof item.retention === 'string' ? parseFloat(item.retention.replace('%', '') || '0') : item.retention || 0;
      return sum + retentionValue;
    }, 0) / validRetentionData.length : 0;
    const avgConversion = validConversionData.length > 0 ? validConversionData.reduce((sum, item) => {
      const conversionValue = typeof item.conversion === 'string' ? parseFloat(item.conversion.replace('%', '') || '0') : item.conversion || 0;
      return sum + conversionValue;
    }, 0) / validConversionData.length : 0;
    const totalNewMembers = filteredData.reduce((sum, item) => sum + (item.new || 0), 0);
    const totalRetained = filteredData.reduce((sum, item) => sum + (item.retained || 0), 0);
    const totalConverted = filteredData.reduce((sum, item) => sum + (item.converted || 0), 0);

    // Top performer by revenue
    const topPerformer = filteredData.reduce((max, item) => (item.totalPaid || 0) > (max.totalPaid || 0) ? item : max, filteredData[0]);

    // Most popular trainer by customers
    const mostPopular = filteredData.reduce((max, item) => (item.totalCustomers || 0) > (max.totalCustomers || 0) ? item : max, filteredData[0]);
    const result = {
      totalSessions,
      totalCustomers,
      totalRevenue,
      totalEmptySessions,
      totalNonEmptySessions,
      avgClassSize,
      avgRetention: isNaN(avgRetention) || !isFinite(avgRetention) ? 0 : avgRetention,
      avgConversion: isNaN(avgConversion) || !isFinite(avgConversion) ? 0 : avgConversion,
      totalNewMembers,
      totalRetained,
      totalConverted,
      topPerformer,
      mostPopular,
      trainerCount: new Set(filteredData.map(item => item.teacherName)).size
    };
    return result;
  }, [filteredData]);
  const getMetricCards = () => {
    if (!processedData) {
      return [];
    }
    return [{
      title: 'Total Sessions',
      value: formatNumber(processedData.totalSessions),
      change: 12.5,
      icon: 'sessions' as const,
      description: 'Total classes conducted across all trainers',
      calculation: 'Sum of all cycle and barre sessions'
    }, {
      title: 'Total Students',
      value: formatNumber(processedData.totalCustomers),
      change: 8.3,
      icon: 'members' as const,
      description: 'Total unique students trained',
      calculation: 'Sum of all cycle and barre customers'
    }, {
      title: 'Total Revenue',
      value: formatCurrency(processedData.totalRevenue),
      change: 15.7,
      icon: 'revenue' as const,
      description: 'Total revenue generated by trainers',
      calculation: 'Sum of all cycle and barre payments'
    }, {
      title: 'Empty Sessions',
      value: formatNumber(processedData.totalEmptySessions),
      change: -5.2,
      icon: 'sessions' as const,
      description: 'Total classes with no attendees',
      calculation: 'Sum of all empty sessions'
    }, {
      title: 'Avg Class Size',
      value: processedData.avgClassSize.toFixed(1),
      change: -2.1,
      icon: 'members' as const,
      description: 'Average number of students per non-empty class',
      calculation: 'Total customers / Total non-empty sessions'
    }, {
      title: 'New Members',
      value: formatNumber(processedData.totalNewMembers),
      change: 18.3,
      icon: 'members' as const,
      description: 'Total new members acquired',
      calculation: 'Sum of new members across trainers'
    }, {
      title: 'Avg Retention',
      value: `${processedData.avgRetention.toFixed(1)}%`,
      change: 5.2,
      icon: 'members' as const,
      description: 'Average retention rate across trainers',
      calculation: 'Average of individual trainer retention rates'
    }, {
      title: 'Avg Conversion',
      value: `${processedData.avgConversion.toFixed(1)}%`,
      change: 3.8,
      icon: 'transactions' as const,
      description: 'Average conversion rate across trainers',
      calculation: 'Average of individual trainer conversion rates'
    }];
  };

  // Enhanced conversion chart data
  const getConversionChartData = () => {
    if (!filteredData.length) return [];
    return filteredData.map(trainer => {
      const conversionValue = typeof trainer.conversion === 'string' ? parseFloat(trainer.conversion.replace('%', '') || '0') : trainer.conversion || 0;
      const retentionValue = typeof trainer.retention === 'string' ? parseFloat(trainer.retention.replace('%', '') || '0') : trainer.retention || 0;
      return {
        name: trainer.teacherName,
        conversion: isNaN(conversionValue) || !isFinite(conversionValue) ? 0 : conversionValue,
        retention: isNaN(retentionValue) || !isFinite(retentionValue) ? 0 : retentionValue,
        revenue: trainer.totalPaid || 0,
        sessions: trainer.totalSessions || 0,
        customers: trainer.totalCustomers || 0
      };
    }).sort((a, b) => b.conversion - a.conversion);
  };
  const getMonthOnMonthData = () => {
    if (!filteredData.length) return {
      data: {},
      months: [],
      trainers: []
    };
    const data: Record<string, Record<string, number>> = {};
    const months = Array.from(new Set(filteredData.map(item => item.monthYear))).sort((a, b) => {
      // Sort months in descending order (most recent first)
      const parseMonth = (monthStr: string) => {
        const [month, year] = monthStr.split('-');
        const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
        return new Date(parseInt(year), monthIndex);
      };
      return parseMonth(b).getTime() - parseMonth(a).getTime();
    });
    const trainers = Array.from(new Set(filteredData.map(item => item.teacherName))).sort();
    trainers.forEach(trainer => {
      data[trainer] = {};
      months.forEach(month => {
        const trainerData = filteredData.find(item => item.teacherName === trainer && item.monthYear === month);
        switch (activeMetric) {
          case 'totalSessions':
            data[trainer][month] = trainerData?.totalSessions || 0;
            break;
          case 'totalCustomers':
            data[trainer][month] = trainerData?.totalCustomers || 0;
            break;
          case 'totalPaid':
            data[trainer][month] = trainerData?.totalPaid || 0;
            break;
          case 'classAverage':
          case 'classAverageExclEmpty':
            data[trainer][month] = trainerData?.classAverageExclEmpty || 0;
            break;
          case 'classAverageInclEmpty':
            data[trainer][month] = trainerData?.classAverageInclEmpty || 0;
            break;
          case 'retention':
            const retentionValue = typeof trainerData?.retention === 'string' ? parseFloat(trainerData.retention.replace('%', '') || '0') : trainerData?.retention || 0;
            data[trainer][month] = isNaN(retentionValue) || !isFinite(retentionValue) ? 0 : retentionValue;
            break;
          case 'conversion':
            const conversionValue = typeof trainerData?.conversion === 'string' ? parseFloat(trainerData.conversion.replace('%', '') || '0') : trainerData?.conversion || 0;
            data[trainer][month] = isNaN(conversionValue) || !isFinite(conversionValue) ? 0 : conversionValue;
            break;
          case 'emptySessions':
            data[trainer][month] = trainerData?.totalEmptySessions || 0;
            break;
          case 'newMembers':
            data[trainer][month] = trainerData?.new || 0;
            break;
          case 'cycleSessions':
            data[trainer][month] = trainerData?.cycleSessions || 0;
            break;
          case 'barreSessions':
            data[trainer][month] = trainerData?.barreSessions || 0;
            break;
          case 'retainedMembers':
            data[trainer][month] = trainerData?.retained || 0;
            break;
          case 'convertedMembers':
            data[trainer][month] = trainerData?.converted || 0;
            break;
          default:
            data[trainer][month] = trainerData?.totalSessions || 0;
        }
      });
    });
    return {
      data,
      months,
      trainers
    };
  };
  const getTopBottomTrainers = () => {
    if (!filteredData.length) return [];
    return filteredData.map(trainer => ({
      name: trainer.teacherName,
      totalValue: trainer.totalPaid || 0,
      unitsSold: trainer.totalSessions || 0,
      transactions: trainer.totalSessions || 0,
      uniqueMembers: trainer.totalCustomers || 0,
      atv: (trainer.totalPaid || 0) / Math.max(trainer.totalSessions || 1, 1),
      auv: (trainer.totalPaid || 0) / Math.max(trainer.totalSessions || 1, 1),
      asv: (trainer.totalPaid || 0) / Math.max(trainer.totalCustomers || 1, 1),
      upt: trainer.totalSessions || 0
    }));
  };
  const getInsightsData = () => {
    if (!filteredData.length) return [];
    return filteredData.map(trainer => ({
      name: trainer.teacherName,
      totalValue: trainer.totalPaid || 0,
      conversion: typeof trainer.conversion === 'string' ? parseFloat(trainer.conversion.replace('%', '') || '0') : trainer.conversion || 0,
      sessions: trainer.totalSessions || 0,
      uniqueMembers: trainer.totalCustomers || 0
    }));
  };
  const getWordCloudData = () => {
    return filteredData.map(trainer => ({
      name: trainer.teacherName,
      conversion: typeof trainer.conversion === 'string' ? parseFloat(trainer.conversion.replace('%', '') || '0') : trainer.conversion || 0,
      totalValue: trainer.totalPaid || 0,
      sessions: trainer.totalSessions || 0
    }));
  };
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading trainer performance data...</p>
        </div>
      </div>;
  }
  if (error) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600">Error loading trainer performance data: {error?.message || 'Unknown error'}</p>
        </div>
      </div>;
  }
  if (!rawData || rawData.length === 0) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-600">No trainer performance data available</p>
        </div>
      </div>;
  }
  const metricCards = getMetricCards();
  const {
    data: monthOnMonthData,
    months,
    trainers
  } = getMonthOnMonthData();
  const topBottomData = getTopBottomTrainers();
  const insightsData = getInsightsData();
  const wordCloudData = getWordCloudData();
  const conversionChartData = getConversionChartData();
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-indigo-600/20" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(120,119,198,0.3),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,255,255,0.1),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(120,119,198,0.2),_transparent_50%)]" />
        </div>
        
        
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Location Tabs */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
          <CardContent className="p-2">
            <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-100 to-slate-200 p-2 rounded-2xl h-auto gap-2">
                <TabsTrigger value="all" className="rounded-xl px-6 py-4 font-semibold text-sm transition-all duration-300">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    <div className="text-center">
                      <div className="font-bold">All Locations</div>
                      <div className="text-xs opacity-80">Combined</div>
                    </div>
                  </div>
                </TabsTrigger>
                {LOCATION_MAPPING.map(location => <TabsTrigger key={location.id} value={location.id} className="rounded-xl px-6 py-4 font-semibold text-sm transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <div className="text-center">
                        <div className="font-bold">{location.name}</div>
                        <div className="text-xs opacity-80">Studio</div>
                      </div>
                    </div>
                  </TabsTrigger>)}
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        {/* Quick Filters */}
        {processedData && <TrainerQuickFilters activeFilters={quickFilters} onFilterChange={(key, values) => setQuickFilters(prev => ({ ...prev, [key]: values }))} trainerCount={processedData.trainerCount} totalRevenue={processedData.totalRevenue} avgPerformance={processedData.avgConversion} />}

        {/* Filter Section */}
        <TrainerFilterSection data={filteredData} onFiltersChange={setFilters} isCollapsed={isFilterCollapsed} onToggleCollapse={() => setIsFilterCollapsed(!isFilterCollapsed)} />

        {/* Metric Cards */}
        {metricCards.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {metricCards.map((card, index) => <MetricCard key={card.title} data={card} delay={index * 200} />)}
          </div>}

        {/* Enhanced Conversion & Performance Chart */}
        {conversionChartData.length > 0 && <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent flex items-center gap-2">
                <Trophy className="w-6 h-6 text-yellow-600" />
                Trainer Performance Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Top 3 Performers */}
                <div className="lg:col-span-1">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    Top Performers
                  </h3>
                  <div className="space-y-3">
                    {conversionChartData.slice(0, 3).map((trainer, index) => <div key={trainer.name} className={cn("p-4 rounded-lg border-2 transition-all duration-300", index === 0 && "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200", index === 1 && "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200", index === 2 && "bg-gradient-to-r from-orange-50 to-red-50 border-orange-200")}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {index === 0 && <Crown className="w-4 h-4 text-yellow-500" />}
                            {index === 1 && <Star className="w-4 h-4 text-gray-500" />}
                            {index === 2 && <Star className="w-4 h-4 text-orange-500" />}
                            <span className="font-semibold text-sm">{trainer.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            #{index + 1}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-600">Conversion:</span>
                            <span className="font-bold ml-1">{trainer.conversion.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Revenue:</span>
                            <span className="font-bold ml-1">{formatCurrency(trainer.revenue)}</span>
                          </div>
                        </div>
                      </div>)}
                  </div>
                </div>

                {/* Performance Metrics Grid */}
                <div className="lg:col-span-2">
                  <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                  <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto">
                    {conversionChartData.map((trainer, index) => <div key={trainer.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{trainer.name}</p>
                            <p className="text-xs text-gray-600">{trainer.sessions} sessions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">{trainer.conversion.toFixed(1)}%</div>
                          <div className="text-xs text-gray-600">{formatCurrency(trainer.revenue)}</div>
                        </div>
                      </div>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* Insights and Word Cloud */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <TrainerInsights data={insightsData} />
          </div>
          <div className="lg:col-span-1">
            <TrainerWordCloud data={wordCloudData} />
          </div>
        </div>

        {/* Top/Bottom Performers */}
        {topBottomData.length > 0 && <TopBottomSellers data={topBottomData} type="trainers" title="Trainer Performance" />}

        {/* Month-on-Month Analysis */}
        {months.length > 0 && trainers.length > 0 && <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                  Month-on-Month Performance Analysis
                </CardTitle>
                <Tabs value={activeMetric} onValueChange={value => setActiveMetric(value as TrainerMetricType)}>
                  <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200 p-2 rounded-2xl shadow-lg grid grid-cols-4 gap-1">
                    {[{
                  key: 'totalSessions' as const,
                  label: 'Sessions',
                  icon: Calendar,
                  color: 'from-blue-500 to-cyan-600'
                }, {
                  key: 'totalCustomers' as const,
                  label: 'Students',
                  icon: Users,
                  color: 'from-green-500 to-emerald-600'
                }, {
                  key: 'totalPaid' as const,
                  label: 'Revenue',
                  icon: DollarSign,
                  color: 'from-purple-500 to-violet-600'
                }, {
                  key: 'retention' as const,
                  label: 'Retention',
                  icon: Award,
                  color: 'from-pink-500 to-rose-600'
                }].map(metric => {
                  const IconComponent = metric.icon;
                  return <TabsTrigger key={metric.key} value={metric.key} className={cn("rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-300", "data-[state=active]:bg-gradient-to-r data-[state=active]:text-white data-[state=active]:shadow-lg", "hover:bg-white/60", `data-[state=active]:${metric.color}`)}>
                          <IconComponent className="w-3 h-3 mr-1" />
                          {metric.label}
                        </TabsTrigger>;
                })}
                  </TabsList>
                </Tabs>
              </div>
              <div className="mt-4">
                <Tabs value={activeMetric} onValueChange={value => setActiveMetric(value as TrainerMetricType)}>
                  <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200 p-2 rounded-2xl shadow-lg flex flex-wrap gap-1">
                    {[{
                  key: 'conversion' as const,
                  label: 'Conversion',
                  icon: Target
                }, {
                  key: 'emptySessions' as const,
                  label: 'Empty Classes',
                  icon: Calendar
                }, {
                  key: 'newMembers' as const,
                  label: 'New Members',
                  icon: Users
                }, {
                  key: 'classAverageExclEmpty' as const,
                  label: 'Class Avg',
                  icon: BarChart3
                }, {
                  key: 'cycleSessions' as const,
                  label: 'Cycle Sessions',
                  icon: Activity
                }, {
                  key: 'barreSessions' as const,
                  label: 'Barre Sessions',
                  icon: Activity
                }, {
                  key: 'retainedMembers' as const,
                  label: 'Retained',
                  icon: Award
                }, {
                  key: 'convertedMembers' as const,
                  label: 'Converted',
                  icon: Target
                }].map(metric => {
                  const IconComponent = metric.icon;
                  return <TabsTrigger key={metric.key} value={metric.key} className="rounded-lg px-2 py-1 text-xs font-semibold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-white/60">
                          <IconComponent className="w-3 h-3 mr-1" />
                          {metric.label}
                        </TabsTrigger>;
                })}
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <MonthOnMonthTrainerTable data={monthOnMonthData} months={months} trainers={trainers} defaultMetric={activeMetric} />
            </CardContent>
          </Card>}

        {/* Year-on-Year Comparison */}
        {months.length > 0 && trainers.length > 0 && <YearOnYearTrainerTable data={monthOnMonthData} months={months} trainers={trainers} defaultMetric={activeMetric} />}
      </div>
    </div>;
};