import React, { useState, useMemo, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNewCsvData, NewClientData } from '@/hooks/useNewCsvData';
import { Users, Target, TrendingUp, BarChart3, PieChart, Calendar, DollarSign, Percent, Award, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Calculator } from 'lucide-react';
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/formatters';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { OptimizedTable } from '@/components/ui/OptimizedTable';
import { designTokens } from '@/utils/designTokens';
import { ConversionMetricsSection } from './ConversionMetricsSection';

// Enhanced overview card component with more metrics
const OverviewCard = memo(({ locationData }: { locationData: NewClientData }) => {
  const totalNewMembers = locationData.newMembers.reduce((a, b) => a + b, 0);
  const totalRetained = locationData.retained.reduce((a, b) => a + b, 0);
  const totalConverted = locationData.converted.reduce((a, b) => a + b, 0);
  const totalLtv = locationData.ltv.reduce((a, b) => a + b, 0);
  const totalConversionSpan = locationData.conversionSpan.reduce((a, b) => a + b, 0);
  
  const overallRetentionRate = totalNewMembers > 0 ? (totalRetained / totalNewMembers * 100) : 0;
  const overallConversionRate = totalNewMembers > 0 ? (totalConverted / totalNewMembers * 100) : 0;
  const avgLtvPerMember = totalNewMembers > 0 ? totalLtv / totalNewMembers : 0;
  const avgConversionSpan = totalNewMembers > 0 ? totalConversionSpan / totalNewMembers : 0;

  return (
    <Card className={`bg-gradient-to-br from-white to-blue-50 ${designTokens.card.shadow} hover:shadow-xl transition-all duration-300`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
          <Award className="w-5 h-5" />
          {locationData.location.replace('Kwality House, Kemps Corner', 'Kwality House').replace('Supreme HQ, Bandra', 'Supreme HQ')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg shadow-md">
            <div className="text-2xl font-bold">{formatNumber(totalNewMembers)}</div>
            <div className="text-xs opacity-90">Total New Members</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg shadow-md">
            <div className="text-2xl font-bold">{formatNumber(totalRetained)}</div>
            <div className="text-xs opacity-90">Total Retained</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg shadow-md">
            <div className="text-2xl font-bold">{formatNumber(totalConverted)}</div>
            <div className="text-xs opacity-90">Total Converted</div>
          </div>
          <div className="text-center p-3 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-lg shadow-md">
            <div className="text-2xl font-bold">{formatCurrency(totalLtv)}</div>
            <div className="text-xs opacity-90">Total LTV</div>
          </div>
        </div>
        
        {/* Enhanced Metrics Row */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-blue-200">
          <div className="text-center p-2 bg-white rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-green-600">{overallRetentionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Retention Rate</div>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-purple-600">{overallConversionRate.toFixed(1)}%</div>
            <div className="text-xs text-gray-600">Conversion Rate</div>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-blue-600">{formatCurrency(avgLtvPerMember)}</div>
            <div className="text-xs text-gray-600">Avg LTV/Member</div>
          </div>
          <div className="text-center p-2 bg-white rounded-lg border border-blue-200">
            <div className="text-lg font-bold text-orange-600">{avgConversionSpan.toFixed(1)} days</div>
            <div className="text-xs text-gray-600">Avg Conv. Span</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});


export const NewCsvDataTable: React.FC = () => {
  const {
    data,
    loading,
    error
  } = useNewCsvData();
  const [selectedMetric, setSelectedMetric] = useState<string>('overview');

  // Memoized table columns for performance
  const tableColumns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return [{
      key: 'location' as keyof NewClientData,
      header: 'Location',
      render: (value: string) => <span className="font-medium">
            {value.replace('Kwality House, Kemps Corner', 'Kwality House').replace('Supreme HQ, Bandra', 'Supreme HQ')}
          </span>,
      className: 'sticky left-0 bg-white z-10 border-r'
    }, ...data[0].months.map((month, index) => ({
      key: `month_${index}` as keyof NewClientData,
      header: month.replace('2025-', '').replace('2024-', ''),
      render: (value: any, item: NewClientData) => {
        const metricData = item[selectedMetric as keyof NewClientData] as any[];
        const cellValue = metricData?.[index] || 0;
        if (selectedMetric === 'ltv') {
          return `₹${formatNumber(cellValue)}`;
        }
        if (selectedMetric === 'conversionSpan') {
          return `${cellValue} days`;
        }
        return selectedMetric.includes('retention') || selectedMetric.includes('conversion') ? cellValue : formatNumber(cellValue);
      },
      className: 'text-center'
    }))];
  }, [data, selectedMetric]);
  if (loading) {
    return <LoadingSkeleton type="table" />;
  }
  if (error) {
    return <Card className={`${designTokens.card.background} ${designTokens.card.shadow}`}>
        <CardContent className="text-center p-12">
          <p className="text-red-600">Error loading data: {error}</p>
        </CardContent>
      </Card>;
  }
  const renderOverviewTable = () => <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {data.map(locationData => <OverviewCard key={locationData.location} locationData={locationData} />)}
    </div>;
  const renderMetricTable = (formatValue?: (value: any) => string) => <OptimizedTable data={data} columns={tableColumns} loading={loading} maxHeight="500px" stickyHeader={true} />;
  return <Card className={`${designTokens.card.background} ${designTokens.card.shadow} ${designTokens.card.border}`}>
      <CardHeader className="pb-3 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-slate-100">
        <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          Client Conversion Analytics
        </CardTitle>
      </CardHeader>
      
      <CardContent className={designTokens.card.padding}>
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full">
          <TabsList className="grid w-full grid-cols-9 bg-gradient-to-r from-blue-50 to-blue-100 mb-6">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="conversionAnalytics" className="text-sm">Conversion Analytics</TabsTrigger>
            <TabsTrigger value="newMembers" className="text-sm">New Members</TabsTrigger>
            <TabsTrigger value="retained" className="text-sm">Retained</TabsTrigger>
            <TabsTrigger value="converted" className="text-sm">Converted</TabsTrigger>
            <TabsTrigger value="retention" className="text-sm">Retention %</TabsTrigger>
            <TabsTrigger value="conversion" className="text-sm">Conversion %</TabsTrigger>
            <TabsTrigger value="conversionSpan" className="text-sm">Conv. Span</TabsTrigger>
            <TabsTrigger value="ltv" className="text-sm">LTV</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderOverviewTable()}
          </TabsContent>
          
          <TabsContent value="conversionAnalytics" className="space-y-6">
            <ConversionMetricsSection data={data} />
          </TabsContent>

          <TabsContent value="newMembers" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">New Members by Month</h3>
            </div>
            {renderMetricTable(value => formatNumber(value))}
          </TabsContent>

          <TabsContent value="retained" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="text-lg font-semibold text-green-800">Retained Members by Month</h3>
            </div>
            {renderMetricTable(value => formatNumber(value))}
          </TabsContent>

          <TabsContent value="converted" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-600" />
              <h3 className="text-lg font-semibold text-purple-800">Converted Members by Month</h3>
            </div>
            {renderMetricTable(value => formatNumber(value))}
          </TabsContent>

          <TabsContent value="retention" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-green-100 text-green-800">Retention Rate</Badge>
              <h3 className="text-lg font-semibold text-green-800">Monthly Retention Percentage</h3>
            </div>
            {renderMetricTable()}
          </TabsContent>

          <TabsContent value="conversion" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-100 text-blue-800">Conversion Rate</Badge>
              <h3 className="text-lg font-semibold text-blue-800">Monthly Conversion Percentage</h3>
            </div>
            {renderMetricTable()}
          </TabsContent>
          
          <TabsContent value="conversionSpan" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-purple-100 text-purple-800">Conversion Span</Badge>
              <h3 className="text-lg font-semibold text-purple-800">Days to Conversion by Month</h3>
            </div>
            {renderMetricTable(value => `${value} days`)}
          </TabsContent>

          <TabsContent value="ltv" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-orange-100 text-orange-800">Lifetime Value</Badge>
              <h3 className="text-lg font-semibold text-orange-800">Customer Lifetime Value by Month</h3>
            </div>
            {renderMetricTable(value => `₹${formatNumber(value)}`)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>;
};