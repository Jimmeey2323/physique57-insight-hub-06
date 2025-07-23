
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Users, Target, TrendingUp, CreditCard, MapPin, Building2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNewClientData } from '@/hooks/useNewClientData';
import { NewClientFilterSection } from './NewClientFilterSection';
import { MetricCard } from './MetricCard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { getNewClientMetrics, calculateNewClientMetrics, getUniqueTrainers, getUniqueLocations, getTopBottomTrainers } from '@/utils/newClientMetrics';
import { NewClientFilterOptions } from '@/types/dashboard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { OptimizedTable } from '@/components/ui/OptimizedTable';
import { NewCsvDataTable } from './NewCsvDataTable';

const locations = [{
  id: 'all',
  name: 'All Locations',
  fullName: 'All Locations',
  icon: <Building2 className="w-4 h-4" />,
  gradient: 'from-blue-500 to-indigo-600'
}, {
  id: 'Kwality House, Kemps Corner',
  name: 'Kwality House',
  fullName: 'Kwality House, Kemps Corner',
  icon: <MapPin className="w-4 h-4" />,
  gradient: 'from-emerald-500 to-teal-600'
}, {
  id: 'Supreme HQ, Bandra',
  name: 'Supreme HQ',
  fullName: 'Supreme HQ, Bandra',
  icon: <MapPin className="w-4 h-4" />,
  gradient: 'from-purple-500 to-violet-600'
}, {
  id: 'Kenkere House',
  name: 'Kenkere House',
  fullName: 'Kenkere House',
  icon: <MapPin className="w-4 h-4" />,
  gradient: 'from-orange-500 to-red-600'
}];

export const NewClientSection: React.FC = () => {
  const {
    data,
    loading,
    error,
    refetch
  } = useNewClientData();
  const [activeLocation, setActiveLocation] = useState('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [filters, setFilters] = useState<NewClientFilterOptions>({
    dateRange: {
      start: '',
      end: ''
    },
    location: [],
    homeLocation: [],
    trainer: [],
    paymentMethod: [],
    retentionStatus: [],
    conversionStatus: [],
    isNew: []
  });

  const filteredData = useMemo(() => {
    if (!data) return [];
    let filtered = data;
    if (activeLocation !== 'all') {
      filtered = filtered.filter(item => item.homeLocation === activeLocation);
    }

    // Apply additional filters
    if (filters.location.length > 0) {
      filtered = filtered.filter(item => filters.location.includes(item.firstVisitLocation));
    }
    if (filters.trainer.length > 0) {
      filtered = filtered.filter(item => filters.trainer.includes(item.trainerName));
    }
    if (filters.retentionStatus.length > 0) {
      filtered = filtered.filter(item => filters.retentionStatus.includes(item.retentionStatus));
    }
    if (filters.conversionStatus.length > 0) {
      filtered = filtered.filter(item => filters.conversionStatus.includes(item.conversionStatus));
    }
    return filtered;
  }, [data, activeLocation, filters]);

  const metrics = useMemo(() => {
    return getNewClientMetrics(filteredData);
  }, [filteredData]);

  const calculatedMetrics = useMemo(() => {
    return calculateNewClientMetrics(filteredData);
  }, [filteredData]);

  const topBottomTrainers = useMemo(() => {
    return getTopBottomTrainers(calculatedMetrics, 'newMembers', 5);
  }, [calculatedMetrics]);

  // Month-on-Month analysis
  const monthOnMonthData = useMemo(() => {
    const monthlyData = filteredData.reduce((acc, item) => {
      if (!item.firstVisitDate) return acc;
      const date = new Date(item.firstVisitDate);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[month]) {
        acc[month] = {
          newClients: 0,
          conversions: 0,
          retained: 0,
          totalLtv: 0
        };
      }
      acc[month].newClients++;
      if (item.conversionStatus === 'Converted') acc[month].conversions++;
      if (item.retentionStatus === 'Retained') acc[month].retained++;
      acc[month].totalLtv += item.ltv;
      return acc;
    }, {} as Record<string, any>);
    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      newClients: data.newClients,
      conversions: data.conversions,
      retained: data.retained,
      conversionRate: (data.conversions / data.newClients * 100).toFixed(1),
      retentionRate: (data.retained / data.newClients * 100).toFixed(1),
      avgLtv: (data.totalLtv / data.newClients).toFixed(0)
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [filteredData]);

  // Year-on-Year comparison
  const yearOnYearData = useMemo(() => {
    const yearlyData = filteredData.reduce((acc, item) => {
      if (!item.firstVisitDate) return acc;
      const year = new Date(item.firstVisitDate).getFullYear().toString();
      if (!acc[year]) {
        acc[year] = {
          newClients: 0,
          conversions: 0,
          retained: 0,
          totalLtv: 0
        };
      }
      acc[year].newClients++;
      if (item.conversionStatus === 'Converted') acc[year].conversions++;
      if (item.retentionStatus === 'Retained') acc[year].retained++;
      acc[year].totalLtv += item.ltv;
      return acc;
    }, {} as Record<string, any>);
    return Object.entries(yearlyData).map(([year, data]) => ({
      year,
      newClients: data.newClients,
      conversions: data.conversions,
      retained: data.retained,
      conversionRate: (data.conversions / data.newClients * 100).toFixed(1),
      retentionRate: (data.retained / data.newClients * 100).toFixed(1),
      avgLtv: (data.totalLtv / data.newClients).toFixed(0)
    })).sort((a, b) => a.year.localeCompare(b.year));
  }, [filteredData]);

  // Trainer Performance Table
  const trainerPerformanceData = useMemo(() => {
    const trainerStats = filteredData.reduce((acc, item) => {
      const trainer = item.trainerName || 'Unknown';
      if (!acc[trainer]) {
        acc[trainer] = {
          newClients: 0,
          conversions: 0,
          retained: 0,
          totalLtv: 0
        };
      }
      acc[trainer].newClients++;
      if (item.conversionStatus === 'Converted') acc[trainer].conversions++;
      if (item.retentionStatus === 'Retained') acc[trainer].retained++;
      acc[trainer].totalLtv += item.ltv;
      return acc;
    }, {} as Record<string, any>);
    return Object.entries(trainerStats).map(([trainer, data]) => ({
      trainer,
      newClients: data.newClients,
      conversions: data.conversions,
      retained: data.retained,
      conversionRate: (data.conversions / data.newClients * 100).toFixed(1),
      retentionRate: (data.retained / data.newClients * 100).toFixed(1),
      avgLtv: (data.totalLtv / data.newClients).toFixed(0),
      totalLtv: data.totalLtv
    })).sort((a, b) => b.newClients - a.newClients);
  }, [filteredData]);

  if (loading) {
    return <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
        <Card className="p-8 bg-white shadow-lg">
          <CardContent className="flex items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
            <div>
              <p className="text-lg font-semibold text-gray-800">Loading New Client Data</p>
              <p className="text-sm text-gray-600">Analyzing customer acquisition...</p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }

  if (error) {
    return <div className="min-h-screen bg-gray-50/30 flex items-center justify-center p-4">
        <Card className="p-8 bg-white shadow-lg max-w-md">
          <CardContent className="text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-red-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-gray-800">Connection Error</p>
              <p className="text-sm text-gray-600 mt-2">{error}</p>
            </div>
            <Button onClick={refetch} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>;
  }

  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-slate-600">No new client data available</p>
        </div>
      </div>;
  }

  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/30 to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Location Tabs at the Top */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-xl border-0 overflow-hidden">
          <CardContent className="p-2">
            <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gradient-to-r from-slate-100 to-slate-200 p-2 rounded-2xl h-auto gap-2">
                {locations.map(location => <TabsTrigger key={location.id} value={location.id} className={`
                      relative group overflow-hidden rounded-xl px-6 py-4 font-semibold text-sm 
                      transition-all duration-300 ease-out hover:scale-105
                      data-[state=active]:bg-gradient-to-r data-[state=active]:${location.gradient}
                      data-[state=active]:text-white data-[state=active]:shadow-lg
                      data-[state=active]:border-0 hover:bg-white/80
                    `}>
                    <div className="flex items-center gap-3">
                      <div className="relative z-10">
                        {location.icon}
                      </div>
                      <div className="relative z-10 text-left">
                        <div className="font-bold">{location.name}</div>
                        <div className="text-xs opacity-75">{location.fullName}</div>
                      </div>
                    </div>
                  </TabsTrigger>)}
              </TabsList>

              {/* Tab Content */}
              {locations.map(location => <TabsContent key={location.id} value={location.id} className="space-y-8 mt-8">
                  {/* Collapsible Filter Section */}
                  <Card className="bg-white shadow-sm border border-gray-200">
                    <Collapsible open={isFilterExpanded} onOpenChange={setIsFilterExpanded}>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-gray-800 text-xl flex items-center gap-2">
                              <Target className="w-5 h-5 text-green-600" />
                              Advanced Filters
                              {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f) && <Badge variant="secondary" className="ml-2">Active</Badge>}
                            </CardTitle>
                            {isFilterExpanded ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent>
                          <NewClientFilterSection filters={filters} onFiltersChange={setFilters} data={data || []} />
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  </Card>

                  {/* Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {metrics.map((metric, index) => <MetricCard key={metric.title} data={metric} delay={index * 100} />)}
                  </div>

                  {/* Enhanced Top/Bottom Trainers Performance */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <Card className="bg-white shadow-xl border-0 overflow-hidden">
                      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
                        <CardTitle className="text-gray-800 text-xl flex items-center gap-2">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                          Top Performing Trainers
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {topBottomTrainers.top.slice(0, 5).map((trainer, index) => <div key={trainer.trainerName} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-xl shadow-lg border border-gray-700">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-lg">{trainer.trainerName}</div>
                                  <div className="text-sm text-gray-300">
                                    {trainer.totalNewMembers} new members • {trainer.averageConversionRate.toFixed(1)}% conversion
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-green-400 text-lg">{formatCurrency(trainer.averageLtv)}</div>
                                <div className="text-xs text-gray-400">Avg LTV</div>
                              </div>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-white shadow-xl border-0 overflow-hidden">
                      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-orange-50 to-red-50">
                        <CardTitle className="text-gray-800 text-xl flex items-center gap-2">
                          <Target className="w-5 h-5 text-orange-600" />
                          Trainers Needing Support
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {topBottomTrainers.bottom.slice(0, 5).map((trainer, index) => <div key={trainer.trainerName} className="flex items-center justify-between p-5 bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 rounded-xl shadow-lg border border-gray-700">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">
                                  {index + 1}
                                </div>
                                <div>
                                  <div className="font-bold text-yellow-300 text-lg">{trainer.trainerName}</div>
                                  <div className="text-sm text-gray-300">
                                    {trainer.totalNewMembers} new members • {trainer.averageConversionRate.toFixed(1)}% conversion
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-bold text-red-400 text-lg">{formatCurrency(trainer.averageLtv)}</div>
                                <div className="text-xs text-gray-400">Avg LTV</div>
                              </div>
                            </div>)}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Premium Month-on-Month Performance Table */}
                  <Card className="bg-white shadow-xl border-0 overflow-hidden">
                    <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
                      <CardTitle className="text-gray-800 text-xl text-center font-bold">Month-on-Month Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <OptimizedTable
                        data={[
                          ...monthOnMonthData,
                          {
                            month: 'Total',
                            newClients: monthOnMonthData.reduce((sum, row) => sum + row.newClients, 0),
                            conversions: monthOnMonthData.reduce((sum, row) => sum + row.conversions, 0),
                            retained: monthOnMonthData.reduce((sum, row) => sum + row.retained, 0),
                            conversionRate: '-',
                            retentionRate: '-',
                            avgLtv: formatCurrency(monthOnMonthData.reduce((sum, row) => sum + parseFloat(row.avgLtv), 0) / monthOnMonthData.length)
                          }
                        ]}
                        columns={[
                          { key: 'month', header: 'Month', align: 'left' },
                          { key: 'newClients', header: 'New Clients', align: 'center' },
                          { key: 'conversions', header: 'Conversions', align: 'center' },
                          { key: 'retained', header: 'Retained', align: 'center' },
                          { 
                            key: 'conversionRate', 
                            header: 'Conversion Rate', 
                            align: 'center',
                            render: (value) => value === '-' ? '-' : (
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                parseFloat(value) >= 60 ? 'bg-green-100 text-green-800' : 
                                parseFloat(value) >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {value}%
                              </span>
                            )
                          },
                          { 
                            key: 'retentionRate', 
                            header: 'Retention Rate', 
                            align: 'center',
                            render: (value) => value === '-' ? '-' : (
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                parseFloat(value) >= 70 ? 'bg-green-100 text-green-800' : 
                                parseFloat(value) >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {value}%
                              </span>
                            )
                          },
                          { 
                            key: 'avgLtv', 
                            header: 'Avg LTV', 
                            align: 'right',
                            render: (value) => <span className="font-bold text-green-600">{typeof value === 'number' ? formatCurrency(value) : value}</span>
                          }
                        ]}
                        showFooter={false}
                        stickyHeader={true}
                        maxHeight="500px"
                      />
                    </CardContent>
                  </Card>

                  {/* Premium Year-on-Year Comparison Table */}
                  <Card className="bg-white shadow-xl border-0 overflow-hidden">
                    <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
                      <CardTitle className="text-gray-800 text-xl text-center font-bold">Year-on-Year Comparison</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <OptimizedTable
                        data={[
                          ...yearOnYearData,
                          {
                            year: 'Total',
                            newClients: yearOnYearData.reduce((sum, row) => sum + row.newClients, 0),
                            conversions: yearOnYearData.reduce((sum, row) => sum + row.conversions, 0),
                            retained: yearOnYearData.reduce((sum, row) => sum + row.retained, 0),
                            conversionRate: '-',
                            retentionRate: '-',
                            avgLtv: formatCurrency(yearOnYearData.reduce((sum, row) => sum + parseFloat(row.avgLtv), 0) / yearOnYearData.length)
                          }
                        ]}
                        columns={[
                          { key: 'year', header: 'Year', align: 'left' },
                          { key: 'newClients', header: 'New Clients', align: 'center' },
                          { key: 'conversions', header: 'Conversions', align: 'center' },
                          { key: 'retained', header: 'Retained', align: 'center' },
                          { 
                            key: 'conversionRate', 
                            header: 'Conversion Rate', 
                            align: 'center',
                            render: (value) => value === '-' ? '-' : (
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                parseFloat(value) >= 60 ? 'bg-green-100 text-green-800' : 
                                parseFloat(value) >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {value}%
                              </span>
                            )
                          },
                          { 
                            key: 'retentionRate', 
                            header: 'Retention Rate', 
                            align: 'center',
                            render: (value) => value === '-' ? '-' : (
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                parseFloat(value) >= 70 ? 'bg-green-100 text-green-800' : 
                                parseFloat(value) >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {value}%
                              </span>
                            )
                          },
                          { 
                            key: 'avgLtv', 
                            header: 'Avg LTV', 
                            align: 'right',
                            render: (value) => <span className="font-bold text-green-600">{typeof value === 'number' ? formatCurrency(value) : value}</span>
                          }
                        ]}
                        showFooter={false}
                        stickyHeader={true}
                        maxHeight="500px"
                      />
                    </CardContent>
                  </Card>

                  {/* Premium Trainer Performance Detail Table */}
                  <Card className="bg-white shadow-xl border-0 overflow-hidden">
                    <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
                      <CardTitle className="text-gray-800 text-xl text-center font-bold">Trainer Performance Analysis</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      <OptimizedTable
                        data={[
                          ...trainerPerformanceData,
                          {
                            trainer: 'Total',
                            newClients: trainerPerformanceData.reduce((sum, row) => sum + row.newClients, 0),
                            conversions: trainerPerformanceData.reduce((sum, row) => sum + row.conversions, 0),
                            retained: trainerPerformanceData.reduce((sum, row) => sum + row.retained, 0),
                            conversionRate: '-',
                            retentionRate: '-',
                            avgLtv: '-',
                            totalLtv: trainerPerformanceData.reduce((sum, row) => sum + row.totalLtv, 0)
                          }
                        ]}
                        columns={[
                          { key: 'trainer', header: 'Trainer', align: 'left' },
                          { key: 'newClients', header: 'New Clients', align: 'center' },
                          { key: 'conversions', header: 'Conversions', align: 'center' },
                          { key: 'retained', header: 'Retained', align: 'center' },
                          { 
                            key: 'conversionRate', 
                            header: 'Conversion Rate', 
                            align: 'center',
                            render: (value) => value === '-' ? '-' : (
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                parseFloat(value) >= 60 ? 'bg-green-100 text-green-800' : 
                                parseFloat(value) >= 40 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {value}%
                              </span>
                            )
                          },
                          { 
                            key: 'retentionRate', 
                            header: 'Retention Rate', 
                            align: 'center',
                            render: (value) => value === '-' ? '-' : (
                              <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                                parseFloat(value) >= 70 ? 'bg-green-100 text-green-800' : 
                                parseFloat(value) >= 50 ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'
                              }`}>
                                {value}%
                              </span>
                            )
                          },
                          { 
                            key: 'avgLtv', 
                            header: 'Avg LTV', 
                            align: 'right',
                            render: (value) => value === '-' ? '-' : <span className="font-bold">{formatCurrency(parseFloat(value))}</span>
                          },
                          { 
                            key: 'totalLtv', 
                            header: 'Total LTV', 
                            align: 'right',
                            render: (value) => <span className="font-bold text-green-600">{formatCurrency(value)}</span>
                          }
                        ]}
                        showFooter={false}
                        stickyHeader={true}
                        stickyFirstColumn={true}
                        maxHeight="600px"
                      />
                    </CardContent>
                  </Card>
                </TabsContent>)}
            </Tabs>
          </CardContent>
        </Card>

        {/* Add the CSV Data Table at the end */}
        <NewCsvDataTable />
      </div>
    </div>;
};
