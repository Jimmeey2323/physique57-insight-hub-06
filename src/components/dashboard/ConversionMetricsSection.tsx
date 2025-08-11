import React, { useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { OptimizedTable } from '@/components/ui/OptimizedTable';
import { TrendingUp, TrendingDown, Target, BarChart3, Calendar, DollarSign, Clock, Users, Award, AlertCircle, Activity } from 'lucide-react';
import { NewClientData } from '@/hooks/useNewCsvData';

interface ConversionMetricsSectionProps {
  data: NewClientData[];
}

// Enhanced Location performance comparison with premium styling
const LocationConversionComparison = memo(({ data }: { data: NewClientData[] }) => {
  const locationComparison = useMemo(() => {
    return data.map(location => {
      const totalNewMembers = location.newMembers.reduce((a, b) => a + b, 0);
      const totalRetained = location.retained.reduce((a, b) => a + b, 0);
      const totalConverted = location.converted.reduce((a, b) => a + b, 0);
      const totalLtv = location.ltv.reduce((a, b) => a + b, 0);
      const totalConversionSpan = location.conversionSpan.reduce((a, b) => a + b, 0);
      
      return {
        location: location.location.replace('Kwality House, Kemps Corner', 'Kwality House').replace('Supreme HQ, Bandra', 'Supreme HQ'),
        newMembers: totalNewMembers,
        retained: totalRetained,
        converted: totalConverted,
        retentionRate: totalNewMembers > 0 ? (totalRetained / totalNewMembers * 100) : 0,
        conversionRate: totalNewMembers > 0 ? (totalConverted / totalNewMembers * 100) : 0,
        avgLtv: totalNewMembers > 0 ? totalLtv / totalNewMembers : 0,
        avgConversionSpan: totalNewMembers > 0 ? totalConversionSpan / totalNewMembers : 0,
        efficiency: totalNewMembers > 0 ? ((totalConverted / totalNewMembers) * (totalLtv / totalNewMembers)) / 1000 : 0
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);
  }, [data]);

  return (
    <Card className="bg-white shadow-2xl border-0 overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-800 via-slate-900 to-black text-white">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-purple-400" />
          Location Performance Benchmarking
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <OptimizedTable
          data={locationComparison}
          columns={[
            { 
              key: 'location', 
              header: 'Location', 
              align: 'left',
              render: (value) => <span className="font-bold text-slate-800">{value}</span>
            },
            { key: 'newMembers', header: 'New Members', align: 'center' },
            { key: 'retained', header: 'Retained', align: 'center' },
            { key: 'converted', header: 'Converted', align: 'center' },
            { 
              key: 'retentionRate', 
              header: 'Retention Rate', 
              align: 'center',
              render: (value) => (
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  value >= 70 ? 'bg-emerald-100 text-emerald-800 shadow-md' : 
                  value >= 50 ? 'bg-amber-100 text-amber-800 shadow-md' : 
                  'bg-red-100 text-red-800 shadow-md'
                }`}>
                  {value.toFixed(1)}%
                </span>
              )
            },
            { 
              key: 'conversionRate', 
              header: 'Conversion Rate', 
              align: 'center',
              render: (value) => (
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                  value >= 60 ? 'bg-emerald-100 text-emerald-800 shadow-md' : 
                  value >= 40 ? 'bg-amber-100 text-amber-800 shadow-md' : 
                  'bg-red-100 text-red-800 shadow-md'
                }`}>
                  {value.toFixed(1)}%
                </span>
              )
            },
            { 
              key: 'avgLtv', 
              header: 'Avg LTV', 
              align: 'right',
              render: (value) => <span className="font-bold text-emerald-600">{formatCurrency(value)}</span>
            },
            { 
              key: 'avgConversionSpan', 
              header: 'Avg Conv. Days', 
              align: 'center',
              render: (value) => (
                <span className={`font-medium ${
                  value <= 30 ? 'text-emerald-600' :
                  value <= 60 ? 'text-amber-600' :
                  'text-red-600'
                }`}>
                  {value.toFixed(0)} days
                </span>
              )
            },
            { 
              key: 'efficiency', 
              header: 'Efficiency Score', 
              align: 'center',
              render: (value) => (
                <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-lg shadow-sm ${
                  value >= 5 ? 'bg-emerald-200 text-emerald-900' : 
                  value >= 2 ? 'bg-amber-200 text-amber-900' : 
                  'bg-red-200 text-red-900'
                }`}>
                  {value.toFixed(1)}
                </span>
              )
            }
          ]}
          showFooter={false}
          stickyHeader={true}
          maxHeight="500px"
        />
      </CardContent>
    </Card>
  );
});

// Enhanced Conversion trends with premium styling
const ConversionTrends = memo(({ data }: { data: NewClientData[] }) => {
  const monthlyTrends = useMemo(() => {
    if (!data || data.length === 0 || !data[0].months) return [];
    
    const months = data[0].months;
    
    return months.map((month, index) => {
      const monthData = data.reduce((acc, location) => {
        acc.newMembers += location.newMembers[index] || 0;
        acc.retained += location.retained[index] || 0;
        acc.converted += location.converted[index] || 0;
        acc.ltv += location.ltv[index] || 0;
        acc.conversionSpan += location.conversionSpan[index] || 0;
        return acc;
      }, { newMembers: 0, retained: 0, converted: 0, ltv: 0, conversionSpan: 0 });
      
      const retentionRate = monthData.newMembers > 0 ? (monthData.retained / monthData.newMembers * 100) : 0;
      const conversionRate = monthData.newMembers > 0 ? (monthData.converted / monthData.newMembers * 100) : 0;
      const avgLtv = monthData.newMembers > 0 ? monthData.ltv / monthData.newMembers : 0;
      const avgSpan = monthData.newMembers > 0 ? monthData.conversionSpan / monthData.newMembers : 0;
      
      return {
        month: month.replace('2025-', '').replace('2024-', ''),
        newMembers: monthData.newMembers,
        retentionRate,
        conversionRate,
        avgLtv,
        avgConversionSpan: avgSpan,
        // Performance indicator based on conversion rate and LTV
        performance: (conversionRate * avgLtv) / 10000 || 0
      };
    }).filter(item => item.newMembers > 0); // Only show months with data
  }, [data]);

  return (
    <Card className="bg-white shadow-2xl border-0 overflow-hidden">
      <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-slate-800 via-slate-900 to-black text-white">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Calendar className="w-6 h-6 text-blue-400" />
          Monthly Conversion Performance Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <OptimizedTable
          data={monthlyTrends}
          columns={[
            { key: 'month', header: 'Month', align: 'left' },
            { key: 'newMembers', header: 'New Members', align: 'center' },
            { 
              key: 'retentionRate', 
              header: 'Retention Rate', 
              align: 'center',
              render: (value) => (
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-md ${
                  value >= 70 ? 'bg-emerald-100 text-emerald-800' : 
                  value >= 50 ? 'bg-amber-100 text-amber-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {value.toFixed(1)}%
                </span>
              )
            },
            { 
              key: 'conversionRate', 
              header: 'Conversion Rate', 
              align: 'center',
              render: (value) => (
                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full shadow-md ${
                  value >= 60 ? 'bg-emerald-100 text-emerald-800' : 
                  value >= 40 ? 'bg-amber-100 text-amber-800' : 
                  'bg-red-100 text-red-800'
                }`}>
                  {value.toFixed(1)}%
                </span>
              )
            },
            { 
              key: 'avgLtv', 
              header: 'Avg LTV', 
              align: 'right',
              render: (value) => <span className="font-bold text-emerald-600">{formatCurrency(value)}</span>
            },
            { 
              key: 'avgConversionSpan', 
              header: 'Avg Conv. Days', 
              align: 'center',
              render: (value) => (
                <span className={`font-medium ${
                  value <= 30 ? 'text-emerald-600' : 
                  value <= 60 ? 'text-amber-600' : 
                  'text-red-600'
                }`}>
                  {value.toFixed(0)} days
                </span>
              )
            },
            { 
              key: 'performance', 
              header: 'Performance Index', 
              align: 'center',
              render: (value) => (
                <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-lg shadow-sm ${
                  value >= 10 ? 'bg-emerald-200 text-emerald-900' : 
                  value >= 5 ? 'bg-amber-200 text-amber-900' : 
                  'bg-red-200 text-red-900'
                }`}>
                  {value.toFixed(1)}
                </span>
              )
            }
          ]}
          showFooter={false}
          stickyHeader={true}
          maxHeight="500px"
        />
      </CardContent>
    </Card>
  );
});

// Premium Conversion Funnel Visualization with sophisticated styling
const ConversionFunnelViz = memo(({ data }: { data: NewClientData[] }) => {
  const funnelData = useMemo(() => {
    const newMembers = data.reduce((sum, location) => 
      sum + location.newMembers.reduce((a, b) => a + b, 0), 0);
    const retained = data.reduce((sum, location) => 
      sum + location.retained.reduce((a, b) => a + b, 0), 0);
    const converted = data.reduce((sum, location) => 
      sum + location.converted.reduce((a, b) => a + b, 0), 0);
    
    const retentionRate = newMembers > 0 ? (retained / newMembers * 100) : 0;
    const conversionRate = newMembers > 0 ? (converted / newMembers * 100) : 0;
    const conversionFromRetained = retained > 0 ? (converted / retained * 100) : 0;
    
    return { newMembers, retained, converted, retentionRate, conversionRate, conversionFromRetained };
  }, [data]);

  return (
    <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white shadow-2xl border-0 overflow-hidden">
      <CardHeader className="border-b border-slate-700">
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-blue-400" />
          Conversion Funnel Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Funnel Visualization */}
          <div className="relative">
            <h3 className="text-lg font-semibold mb-6 text-slate-200">Customer Journey Funnel</h3>
            <div className="relative h-80 mx-auto">
              {/* New Members */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-5/6 h-20 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl flex items-center justify-center shadow-lg animate-pulse">
                <div className="text-center">
                  <div className="text-sm font-medium opacity-90">New Members</div>
                  <div className="text-2xl font-bold">{formatNumber(funnelData.newMembers)}</div>
                </div>
              </div>
              
              {/* Retained */}
              <div className="absolute top-24 left-1/2 transform -translate-x-1/2 w-4/6 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-sm font-medium opacity-90">Retained</div>
                  <div className="text-2xl font-bold">{formatNumber(funnelData.retained)}</div>
                  <div className="text-xs opacity-75">{funnelData.retentionRate.toFixed(1)}% retention</div>
                </div>
              </div>
              
              {/* Converted */}
              <div className="absolute top-48 left-1/2 transform -translate-x-1/2 w-3/6 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-b-2xl flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-sm font-medium opacity-90">Converted</div>
                  <div className="text-2xl font-bold">{formatNumber(funnelData.converted)}</div>
                  <div className="text-xs opacity-75">{funnelData.conversionRate.toFixed(1)}% conversion</div>
                </div>
              </div>
              
              {/* Connecting flow lines */}
              <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-0 h-4 border-l-2 border-dashed border-slate-400 opacity-60"></div>
              <div className="absolute top-44 left-1/2 transform -translate-x-1/2 w-0 h-4 border-l-2 border-dashed border-slate-400 opacity-60"></div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-6 text-slate-200">Key Performance Indicators</h3>
            
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-2xl border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Overall Retention Rate</p>
                  <p className="text-3xl font-bold text-emerald-400">{funnelData.retentionRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-emerald-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-2xl border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Overall Conversion Rate</p>
                  <p className="text-3xl font-bold text-purple-400">{funnelData.conversionRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-6 rounded-2xl border border-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-300">Retained-to-Converted Rate</p>
                  <p className="text-3xl font-bold text-blue-400">{funnelData.conversionFromRetained.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Premium Key Metrics Cards with sophisticated styling
const ConversionInsights = memo(({ data }: { data: NewClientData[] }) => {
  const insights = useMemo(() => {
    // Calculate overall metrics
    const totals = data.reduce((acc, location) => {
      acc.newMembers += location.newMembers.reduce((a, b) => a + b, 0);
      acc.retained += location.retained.reduce((a, b) => a + b, 0);
      acc.converted += location.converted.reduce((a, b) => a + b, 0);
      acc.ltv += location.ltv.reduce((a, b) => a + b, 0);
      acc.conversionSpan += location.conversionSpan.reduce((a, b) => a + b, 0);
      return acc;
    }, { newMembers: 0, retained: 0, converted: 0, ltv: 0, conversionSpan: 0 });

    const overallRetentionRate = totals.newMembers > 0 ? (totals.retained / totals.newMembers * 100) : 0;
    const overallConversionRate = totals.newMembers > 0 ? (totals.converted / totals.newMembers * 100) : 0;
    const avgLtv = totals.newMembers > 0 ? totals.ltv / totals.newMembers : 0;
    const avgConversionSpan = totals.newMembers > 0 ? totals.conversionSpan / totals.newMembers : 0;

    // Find best and worst performing locations
    const locationPerformance = data.map(location => {
      const totalNewMembers = location.newMembers.reduce((a, b) => a + b, 0);
      const totalConverted = location.converted.reduce((a, b) => a + b, 0);
      return {
        location: location.location.replace('Kwality House, Kemps Corner', 'Kwality House').replace('Supreme HQ, Bandra', 'Supreme HQ'),
        conversionRate: totalNewMembers > 0 ? (totalConverted / totalNewMembers * 100) : 0
      };
    }).sort((a, b) => b.conversionRate - a.conversionRate);

    const bestLocation = locationPerformance[0];
    const worstLocation = locationPerformance[locationPerformance.length - 1];

    return {
      totals,
      overallRetentionRate,
      overallConversionRate,
      avgLtv,
      avgConversionSpan,
      bestLocation,
      worstLocation
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Overall Conversion Rate - Premium Design */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 text-white shadow-2xl border-0 hover:scale-105 transition-all duration-300">
        <div className="absolute inset-0 bg-black/10"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75 uppercase tracking-wider">Conversion Rate</p>
              <p className="text-3xl font-black">{insights.overallConversionRate.toFixed(1)}%</p>
            </div>
          </div>
          <div className="text-xs opacity-80">
            <span className="font-semibold">{formatNumber(insights.totals.converted)}</span> converted from <span className="font-semibold">{formatNumber(insights.totals.newMembers)}</span> new members
          </div>
          <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/5 rounded-full"></div>
        </CardContent>
      </Card>

      {/* Average LTV - Premium Design */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-500 to-emerald-700 text-white shadow-2xl border-0 hover:scale-105 transition-all duration-300">
        <div className="absolute inset-0 bg-black/10"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75 uppercase tracking-wider">Average LTV</p>
              <p className="text-2xl font-black">{formatCurrency(insights.avgLtv)}</p>
            </div>
          </div>
          <div className="text-xs opacity-80">
            Revenue per converted member
          </div>
          <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/5 rounded-full"></div>
        </CardContent>
      </Card>

      {/* Average Conversion Time - Premium Design */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-purple-700 text-white shadow-2xl border-0 hover:scale-105 transition-all duration-300">
        <div className="absolute inset-0 bg-black/10"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75 uppercase tracking-wider">Conversion Time</p>
              <p className="text-3xl font-black">{insights.avgConversionSpan.toFixed(0)}</p>
              <p className="text-sm opacity-90">days</p>
            </div>
          </div>
          <div className="text-xs opacity-80">
            Average time to convert
          </div>
          <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/5 rounded-full"></div>
        </CardContent>
      </Card>

      {/* Best Performing Location - Premium Design */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-500 to-orange-700 text-white shadow-2xl border-0 hover:scale-105 transition-all duration-300">
        <div className="absolute inset-0 bg-black/10"></div>
        <CardContent className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="text-right">
              <p className="text-xs opacity-75 uppercase tracking-wider">Top Performer</p>
              <p className="text-lg font-bold truncate">{insights.bestLocation.location}</p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-3xl font-black">{insights.bestLocation.conversionRate.toFixed(1)}%</p>
            <p className="text-xs opacity-80">conversion rate</p>
          </div>
          <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-white/5 rounded-full"></div>
        </CardContent>
      </Card>
    </div>
  );
});

export const ConversionMetricsSection: React.FC<ConversionMetricsSectionProps> = ({ data }) => {
  return (
    <div className="space-y-8">
      {/* Premium Key Metrics Overview */}
      <ConversionInsights data={data} />

      {/* Premium Conversion Funnel */}
      <ConversionFunnelViz data={data} />

      {/* Enhanced Location Comparison */}
      <LocationConversionComparison data={data} />

      {/* Enhanced Monthly Trends */}
      <ConversionTrends data={data} />

      {/* Premium Actionable Insights Section */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-800 to-black text-white shadow-2xl border-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"></div>
        <CardHeader className="relative border-b border-slate-700">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-blue-400" />
            Strategic Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="relative p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                </div>
                <h4 className="text-xl font-bold text-emerald-400">Key Strengths</h4>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl border border-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-slate-200">Retention Excellence</p>
                      <p className="text-sm text-slate-400 mt-1">Strong retention rates indicate exceptional onboarding and member experience</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl border border-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-slate-200">High Customer Value</p>
                      <p className="text-sm text-slate-400 mt-1">Premium LTV demonstrates strong value proposition and pricing strategy</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl border border-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-slate-200">Multi-Location Success</p>
                      <p className="text-sm text-slate-400 mt-1">Consistent performance across locations shows scalable business model</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-orange-400" />
                </div>
                <h4 className="text-xl font-bold text-orange-400">Growth Opportunities</h4>
              </div>
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl border border-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-slate-200">Conversion Timeline Optimization</p>
                      <p className="text-sm text-slate-400 mt-1">Reduce average conversion time through targeted follow-up strategies</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl border border-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-slate-200">Location Performance Alignment</p>
                      <p className="text-sm text-slate-400 mt-1">Replicate best practices from top-performing locations to underperformers</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-slate-800 to-slate-700 p-4 rounded-xl border border-slate-600">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="font-semibold text-slate-200">Personalized Conversion Paths</p>
                      <p className="text-sm text-slate-400 mt-1">Develop targeted conversion strategies based on member behavior patterns</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ConversionMetricsSection;
