
import React, { useMemo, useState } from 'react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { YearOnYearMetricTabs } from './YearOnYearMetricTabs';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { CreditCard, TrendingUp, TrendingDown, Edit3, Save, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface PaymentMethodMonthOnMonthTableProps {
  data: SalesData[];
  onRowClick: (row: any) => void;
  selectedMetric?: YearOnYearMetricType;
}

export const PaymentMethodMonthOnMonthTable: React.FC<PaymentMethodMonthOnMonthTableProps> = ({
  data,
  onRowClick,
  selectedMetric: initialMetric = 'revenue'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('• Digital payment methods showing strong adoption\n• Credit card transactions dominate premium services\n• Cash payments declining as expected in digital transformation');

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  };

  const getMetricValue = (items: SalesData[], metric: YearOnYearMetricType) => {
    if (!items.length) return 0;
    switch (metric) {
      case 'revenue':
        return items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
      case 'transactions':
        return items.length;
      case 'members':
        return new Set(items.map(item => item.memberId)).size;
      case 'atv':
        const totalRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
        return items.length > 0 ? totalRevenue / items.length : 0;
      case 'auv':
        const revenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
        const units = items.length; // Each sale item is one unit
        return units > 0 ? revenue / units : 0;
      default:
        return 0;
    }
  };

  const formatMetricValue = (value: number, metric: YearOnYearMetricType) => {
    switch (metric) {
      case 'revenue':
      case 'auv':
      case 'atv':
        return formatCurrency(value);
      case 'transactions':
      case 'members':
        return formatNumber(value);
      default:
        return formatNumber(value);
    }
  };

  const monthlyData = useMemo(() => {
    const months = [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 5; i >= 0; i--) {
      const monthName = monthNames[i];
      const monthNum = i + 1;
      months.push({
        key: `2025-${String(monthNum).padStart(2, '0')}`,
        display: `${monthName} 2025`,
        year: 2025,
        month: monthNum,
        quarter: Math.ceil(monthNum / 3)
      });
    }
    
    for (let i = 11; i >= 0; i--) {
      const monthName = monthNames[i];
      const monthNum = i + 1;
      months.push({
        key: `2024-${String(monthNum).padStart(2, '0')}`,
        display: `${monthName} 2024`,
        year: 2024,
        month: monthNum,
        quarter: Math.ceil(monthNum / 3)
      });
    }
    
    return months;
  }, []);

  const processedData = useMemo(() => {
    const paymentMethodGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
      const paymentMethod = item.paymentMethod || 'Unknown';
      if (!acc[paymentMethod]) {
        acc[paymentMethod] = [];
      }
      acc[paymentMethod].push(item);
      return acc;
    }, {});

    const paymentMethodData = Object.entries(paymentMethodGroups).map(([paymentMethod, items]) => {
      const monthlyValues: Record<string, number> = {};

      monthlyData.forEach(({ key, year, month }) => {
        const monthItems = items.filter(item => {
          const itemDate = parseDate(item.paymentDate);
          return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        });
        monthlyValues[key] = getMetricValue(monthItems, selectedMetric);
      });

      const metricValue = getMetricValue(items, selectedMetric);
      const totalRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
      const totalTransactions = items.length;
      const uniqueMembers = new Set(items.map(item => item.memberId)).size;
      const units = items.length; // Each sale item is one unit
      
      // Calculate correct metrics
      const asv = uniqueMembers > 0 ? totalRevenue / uniqueMembers : 0; // ASV = Revenue/Members
      const upt = totalTransactions > 0 ? units / totalTransactions : 0; // UPT = Units/Transactions
      const atv = totalTransactions > 0 ? totalRevenue / totalTransactions : 0; // ATV = Revenue/Transactions
      const auv = units > 0 ? totalRevenue / units : 0; // AUV = Revenue/Units
      
      return {
        paymentMethod,
        metricValue,
        totalRevenue,
        totalTransactions,
        uniqueMembers,
        asv,
        upt,
        atv,
        auv,
        units,
        monthlyValues,
        rawData: items
      };
    });

    return paymentMethodData.sort((a, b) => b.metricValue - a.metricValue);
  }, [data, selectedMetric, monthlyData]);

  const getGrowthIndicator = (current: number, previous: number) => {
    if (previous === 0 && current === 0) return null;
    if (previous === 0) return <TrendingUp className="w-3 h-3 text-green-500 inline ml-1" />;
    const growth = ((current - previous) / previous) * 100;
    if (growth > 5) {
      return <TrendingUp className="w-3 h-3 text-green-500 inline ml-1" />;
    } else if (growth < -5) {
      return <TrendingDown className="w-3 h-3 text-red-500 inline ml-1" />;
    }
    return null;
  };

  const getPaymentMethodBadge = (method: string) => {
    const color = method.toLowerCase().includes('card') ? 'bg-blue-100 text-blue-800' :
                  method.toLowerCase().includes('cash') ? 'bg-green-100 text-green-800' :
                  method.toLowerCase().includes('digital') ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800';
    return (
      <Badge className={`${color} text-xs`}>
        {method}
      </Badge>
    );
  };

  // Calculate totals row with proper averages for ATV, ASV, AUV
  const totalsRow = useMemo(() => {
    const monthlyTotals: Record<string, number> = {};
    monthlyData.forEach(({ key }) => {
      monthlyTotals[key] = processedData.reduce((sum, item) => sum + (item.monthlyValues[key] || 0), 0);
    });
    
    const totalRevenue = processedData.reduce((sum, item) => sum + item.totalRevenue, 0);
    const totalTransactions = processedData.reduce((sum, item) => sum + item.totalTransactions, 0);
    const totalMembers = new Set(data.map(item => item.memberId)).size;
    const totalUnits = processedData.reduce((sum, item) => sum + item.units, 0);
    
    // Calculate averages for ATV, ASV, AUV (weighted averages)
    const avgAsv = totalMembers > 0 ? totalRevenue / totalMembers : 0;
    const avgUpt = totalTransactions > 0 ? totalUnits / totalTransactions : 0;
    const avgAtv = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    const avgAuv = totalUnits > 0 ? totalRevenue / totalUnits : 0;
    
    return {
      paymentMethod: 'TOTAL',
      metricValue: processedData.reduce((sum, item) => sum + item.metricValue, 0),
      totalRevenue,
      totalTransactions,
      asv: avgAsv,
      upt: avgUpt,
      atv: avgAtv,
      auv: avgAuv,
      monthlyValues: monthlyTotals
    };
  }, [processedData, monthlyData, data]);

  const saveSummary = () => {
    setIsEditingSummary(false);
    localStorage.setItem('paymentMethodMonthOnMonthSummary', summaryText);
  };

  const cancelEdit = () => {
    setIsEditingSummary(false);
    const saved = localStorage.getItem('paymentMethodMonthOnMonthSummary');
    if (saved) setSummaryText(saved);
  };

  const groupedMonths = useMemo(() => {
    const quarters: Record<string, typeof monthlyData> = {};
    monthlyData.forEach(month => {
      const quarterKey = `${month.year}-Q${month.quarter}`;
      if (!quarters[quarterKey]) quarters[quarterKey] = [];
      quarters[quarterKey].push(month);
    });
    return quarters;
  }, [monthlyData]);

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Payment Method Month-on-Month Analysis
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Monthly performance metrics by payment method (Jun 2025 - Jan 2024)
              </p>
            </div>
          </div>
          
          <YearOnYearMetricTabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full bg-white border-t border-gray-200 rounded-lg">
            <thead className="bg-gradient-to-r from-blue-700 to-blue-900 text-white font-semibold text-sm uppercase tracking-wider sticky top-0 z-20">
              <tr>
                <th rowSpan={2} className="text-white font-semibold uppercase tracking-wider px-6 py-3 text-left rounded-tl-lg sticky left-0 bg-blue-800 z-30">Payment Method</th>
                <th rowSpan={2} className="text-white font-semibold uppercase tracking-wider px-4 py-3 text-center">ATV</th>
                <th rowSpan={2} className="text-white font-semibold uppercase tracking-wider px-4 py-3 text-center">ASV</th>
                <th rowSpan={2} className="text-white font-semibold uppercase tracking-wider px-4 py-3 text-center">AUV</th>
                <th rowSpan={2} className="text-white font-semibold uppercase tracking-wider px-4 py-3 text-center">UPT</th>
                <th rowSpan={2} className="text-white font-semibold uppercase tracking-wider px-4 py-3 text-center">Transactions</th>
                {Object.entries(groupedMonths).map(([quarterKey, months]) => (
                  <th key={quarterKey} colSpan={months.length} className="text-white font-semibold text-sm uppercase tracking-wider px-4 py-2 text-center border-l border-blue-600">
                    {quarterKey}
                  </th>
                ))}
              </tr>
              <tr>
                {monthlyData.map(({ key, display }) => (
                  <th key={key} className="text-white font-semibold text-xs uppercase tracking-wider px-3 py-2 bg-blue-800 border-l border-blue-600">
                    <div className="flex flex-col">
                      <span className="text-sm">{display.split(' ')[0]}</span>
                      <span className="text-blue-200 text-xs">{display.split(' ')[1]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.map((item, index) => (
                <tr 
                  key={item.paymentMethod} 
                  className="hover:bg-blue-50 cursor-pointer border-b border-gray-100 transition-colors duration-200" 
                  onClick={() => onRowClick(item.rawData)}
                >
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 max-w-48">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700">#{index + 1}</span>
                      {getPaymentMethodBadge(item.paymentMethod)}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900 font-mono">
                    {formatCurrency(item.atv)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900 font-mono">
                    {formatCurrency(item.asv)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900 font-mono">
                    {formatCurrency(item.auv)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900 font-mono">
                    {item.upt.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-gray-900 font-mono">
                    {formatNumber(item.totalTransactions)}
                  </td>
                  {monthlyData.map(({ key }, monthIndex) => {
                    const current = item.monthlyValues[key] || 0;
                    const previous = monthIndex > 0 ? item.monthlyValues[monthlyData[monthIndex - 1].key] || 0 : 0;
                    return (
                      <td key={key} className="px-3 py-3 text-center text-sm text-gray-900 font-mono border-l border-gray-100">
                        <div className="flex items-center justify-center">
                          {formatMetricValue(current, selectedMetric)}
                          {getGrowthIndicator(current, previous)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Totals Row */}
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 border-t-2 border-blue-200 font-bold">
                <td className="px-6 py-3 text-sm font-bold text-blue-900 sticky left-0 bg-blue-100 border-r border-blue-200">
                  TOTAL
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-900 font-mono font-bold">
                  {formatCurrency(totalsRow.atv)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-900 font-mono font-bold">
                  {formatCurrency(totalsRow.asv)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-900 font-mono font-bold">
                  {formatCurrency(totalsRow.auv)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-900 font-mono font-bold">
                  {totalsRow.upt.toFixed(2)}
                </td>
                <td className="px-4 py-3 text-center text-sm text-blue-900 font-mono font-bold">
                  {formatNumber(totalsRow.totalTransactions)}
                </td>
                {monthlyData.map(({ key }) => (
                  <td key={key} className="px-3 py-3 text-center text-sm text-blue-900 font-mono font-bold border-l border-blue-200">
                    {formatMetricValue(totalsRow.monthlyValues[key] || 0, selectedMetric)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary/Insights Section */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-white rounded-b-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Method Insights
            </h4>
            {!isEditingSummary ? (
              <Button variant="outline" size="sm" onClick={() => setIsEditingSummary(true)} className="gap-2">
                <Edit3 className="w-4 h-4" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={saveSummary} className="gap-2 text-green-600">
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={cancelEdit} className="gap-2 text-red-600">
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
          
          {isEditingSummary ? (
            <Textarea
              value={summaryText}
              onChange={(e) => setSummaryText(e.target.value)}
              placeholder="Enter payment method insights using bullet points (• )"
              className="min-h-32 text-sm"
            />
          ) : (
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="text-sm text-gray-700 whitespace-pre-line">
                {summaryText}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
