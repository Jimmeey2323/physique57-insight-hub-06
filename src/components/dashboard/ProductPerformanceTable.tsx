import React, { useMemo, useState, useCallback } from 'react';
import { SalesData, YearOnYearMetricType } from '@/types/dashboard';
import { YearOnYearMetricTabs } from './YearOnYearMetricTabs';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Package, TrendingUp, TrendingDown, Edit3, Save, X, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ProductPerformanceTableProps {
  data: SalesData[];
  onRowClick: (row: any) => void;
  selectedMetric?: YearOnYearMetricType;
}

export const ProductPerformanceTable: React.FC<ProductPerformanceTableProps> = ({
  data,
  onRowClick,
  selectedMetric: initialMetric = 'revenue'
}) => {
  const [selectedMetric, setSelectedMetric] = useState<YearOnYearMetricType>(initialMetric);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [summaryText, setSummaryText] = useState('• Top performing products driving majority of revenue\n• Clear category leaders emerging in each segment\n• Opportunity for portfolio optimization identified');
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('grossRevenue');

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
      case 'units':
        return items.length;
      case 'atv':
        const totalRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
        return items.length > 0 ? totalRevenue / items.length : 0;
      case 'auv':
        const revenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
        const units = items.length;
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
      case 'units':
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
    const productGroups = data.reduce((acc: Record<string, SalesData[]>, item) => {
      const product = item.cleanedProduct || 'Unknown';
      if (!acc[product]) {
        acc[product] = [];
      }
      acc[product].push(item);
      return acc;
    }, {});

    const productData = Object.entries(productGroups).map(([product, items]) => {
      const monthlyValues: Record<string, any> = {};

      monthlyData.forEach(({ key, year, month }) => {
        const monthItems = items.filter(item => {
          const itemDate = parseDate(item.paymentDate);
          return itemDate && itemDate.getFullYear() === year && itemDate.getMonth() + 1 === month;
        });
        
        const grossRevenue = monthItems.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
        const vat = monthItems.reduce((sum, item) => sum + (item.paymentVAT || 0), 0);
        const transactions = monthItems.length;
        const uniqueMembers = new Set(monthItems.map(item => item.memberId)).size;
        const units = monthItems.length;

        const monthName = new Date(year, month - 1).toLocaleDateString('en-IN', {
          month: 'short',
          year: '2-digit'
        });

        monthlyValues[`${monthName}_grossRevenue`] = grossRevenue;
        monthlyValues[`${monthName}_vat`] = vat;
        monthlyValues[`${monthName}_netRevenue`] = grossRevenue - vat;
        monthlyValues[`${monthName}_transactions`] = transactions;
        monthlyValues[`${monthName}_uniqueMembers`] = uniqueMembers;
        monthlyValues[`${monthName}_units`] = units;
        monthlyValues[`${monthName}_atv`] = transactions > 0 ? Math.round(grossRevenue / transactions) : 0;
        monthlyValues[`${monthName}_auv`] = units > 0 ? Math.round(grossRevenue / units) : 0;
        monthlyValues[`${monthName}_asv`] = uniqueMembers > 0 ? Math.round(grossRevenue / uniqueMembers) : 0;
        monthlyValues[`${monthName}_upt`] = transactions > 0 ? (units / transactions).toFixed(1) : '0.0';
        monthlyValues[`${monthName}_rawData`] = monthItems;
      });

      const totalRevenue = items.reduce((sum, item) => sum + (item.paymentValue || 0), 0);
      const totalTransactions = items.length;
      const uniqueMembers = new Set(items.map(item => item.memberId)).size;
      const totalUnits = items.length;
      
      return {
        name: product,
        category: items[0]?.cleanedCategory || 'Unknown',
        totalRevenue,
        totalTransactions,
        uniqueMembers,
        totalUnits,
        ...monthlyValues,
        rawData: items
      };
    });

    return productData.sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [data, monthlyData]);

  // Group by category
  const groupedData = useMemo(() => {
    const groups = processedData.reduce((acc, item) => {
      const category = item.category || 'Unknown';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(item);
      return acc;
    }, {} as Record<string, any[]>);
    return groups;
  }, [processedData]);

  // Get unique month-years for headers (in descending order)
  const monthYears = useMemo(() => {
    const monthsSet = new Set(data.map(item => {
      const date = parseDate(item.paymentDate);
      if (!date) return null;
      return new Date(date.getFullYear(), date.getMonth()).toLocaleDateString('en-IN', {
        month: 'short',
        year: '2-digit'
      });
    }).filter(Boolean));
    const months = Array.from(monthsSet) as string[];
    months.sort((a, b) => {
      const dateA = new Date(parseInt('20' + a.split(' ')[1]), ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(a.split(' ')[0]));
      const dateB = new Date(parseInt('20' + b.split(' ')[1]), ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(b.split(' ')[0]));
      return dateB.getTime() - dateA.getTime();
    });
    return months;
  }, [data]);

  // Group months into quarters
  const quarterGroups = useMemo(() => {
    const quarters: Record<string, string[]> = {};
    monthYears.forEach(month => {
      const [monthName, year] = month.split(' ');
      const quarterMap: Record<string, string> = {
        'Jan': 'Q1', 'Feb': 'Q1', 'Mar': 'Q1',
        'Apr': 'Q2', 'May': 'Q2', 'Jun': 'Q2',
        'Jul': 'Q3', 'Aug': 'Q3', 'Sep': 'Q3',
        'Oct': 'Q4', 'Nov': 'Q4', 'Dec': 'Q4'
      };
      const quarter = `${quarterMap[monthName]} ${year}`;
      if (!quarters[quarter]) quarters[quarter] = [];
      quarters[quarter].push(month);
    });
    return quarters;
  }, [monthYears]);

  // Calculate totals
  const totals = useMemo(() => {
    const monthTotals: any = {};
    monthYears.forEach(month => {
      monthTotals[`${month}_grossRevenue`] = 0;
      monthTotals[`${month}_netRevenue`] = 0;
      monthTotals[`${month}_vat`] = 0;
      monthTotals[`${month}_transactions`] = 0;
      monthTotals[`${month}_uniqueMembers`] = 0;
      monthTotals[`${month}_units`] = 0;
    });
    
    processedData.forEach(item => {
      monthYears.forEach(month => {
        monthTotals[`${month}_grossRevenue`] += item[`${month}_grossRevenue`] || 0;
        monthTotals[`${month}_netRevenue`] += item[`${month}_netRevenue`] || 0;
        monthTotals[`${month}_vat`] += item[`${month}_vat`] || 0;
        monthTotals[`${month}_transactions`] += item[`${month}_transactions`] || 0;
        monthTotals[`${month}_uniqueMembers`] += item[`${month}_uniqueMembers`] || 0;
        monthTotals[`${month}_units`] += item[`${month}_units`] || 0;
      });
    });
    
    return monthTotals;
  }, [processedData, monthYears]);

  const handleQuickFilter = useCallback((days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    console.log(`Quick filter applied: ${days} days from ${startDate.toDateString()} to ${endDate.toDateString()}`);
  }, []);

  const toggleGroupCollapse = (category: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedGroups(newCollapsed);
  };

  const saveSummary = () => {
    setIsEditingSummary(false);
    localStorage.setItem('productPerformanceSummary', summaryText);
  };

  const cancelEdit = () => {
    setIsEditingSummary(false);
    const saved = localStorage.getItem('productPerformanceSummary');
    if (saved) setSummaryText(saved);
  };

  const handleRowClick = (row: any) => {
    const enrichedRow = {
      ...row,
      transactionData: row.rawData || [],
      monthlyTransactionData: monthYears.reduce((acc, month) => {
        acc[month] = row[`${month}_rawData`] || [];
        return acc;
      }, {} as Record<string, any[]>)
    };
    onRowClick?.(enrichedRow);
  };

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl rounded-xl">
      <CardHeader className="pb-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Product Performance Analysis
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Comprehensive product performance metrics
              </p>
            </div>
            
            {/* Quick Filter Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleQuickFilter(7)}>
                Last 7 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickFilter(30)}>
                Last 30 Days
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleQuickFilter(90)}>
                Last 90 Days
              </Button>
            </div>
          </div>
          
          <YearOnYearMetricTabs value={selectedMetric} onValueChange={setSelectedMetric} className="w-full" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="rounded-3xl border border-slate-200/30 bg-white shadow-2xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-slate-200/50 p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-8 bg-gradient-to-r from-blue-50 via-purple-50 to-blue-50 p-2 rounded-2xl shadow-lg border border-slate-200/30">
                <TabsTrigger value="grossRevenue" className="text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl">
                  Gross Revenue
                </TabsTrigger>
                <TabsTrigger value="netRevenue" className="text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl">
                  Net Revenue
                </TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl">
                  Transactions
                </TabsTrigger>
                <TabsTrigger value="uniqueMembers" className="text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl">
                  Members
                </TabsTrigger>
                <TabsTrigger value="units" className="text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl">
                  Units
                </TabsTrigger>
                <TabsTrigger value="atv" className="text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl">
                  ATV
                </TabsTrigger>
                <TabsTrigger value="auv" className="text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl">
                  AUV
                </TabsTrigger>
                <TabsTrigger value="asv" className="text-xs font-bold transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-xl">
                  ASV
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Table */}
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-gradient-to-r from-blue-500 via-purple-600 to-blue-500 z-10 shadow-lg">
                <TableRow className="border-0">
                  <TableHead className="font-bold text-white text-sm sticky left-0 bg-gradient-to-r from-blue-500 to-purple-600 backdrop-blur-sm border-r border-white/20 min-w-[200px] shadow-lg">
                    Product
                  </TableHead>
                  {Object.entries(quarterGroups).map(([quarter, months]) => (
                    <TableHead key={quarter} colSpan={months.length} className="text-center font-bold text-white text-sm border-r border-white/20">
                      {quarter}
                    </TableHead>
                  ))}
                </TableRow>
                <TableRow className="bg-gradient-to-r from-blue-400 via-purple-500 to-blue-400 border-0">
                  <TableHead className="font-bold text-white text-sm sticky left-0 bg-gradient-to-r from-blue-400 to-purple-500 backdrop-blur-sm border-r border-white/20">
                    &nbsp;
                  </TableHead>
                  {monthYears.map(month => (
                    <TableHead key={month} className="text-center font-bold text-white text-sm min-w-[120px] border-r border-white/10">
                      {month}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {Object.entries(groupedData).map(([category, items]) => (
                  <React.Fragment key={category}>
                    <TableRow 
                      className="bg-gradient-to-r from-slate-100/60 to-slate-200/60 font-bold border-b border-slate-300/50 cursor-pointer hover:from-slate-200/70 hover:to-slate-300/70 transition-all duration-300" 
                      onClick={() => toggleGroupCollapse(category)}
                    >
                      <TableCell className="font-bold text-slate-800 sticky left-0 bg-gradient-to-r from-slate-100/90 to-slate-200/90 backdrop-blur-sm border-r border-slate-300/50 shadow-sm">
                        <div className="flex items-center gap-2">
                          <ChevronDown className={cn("w-4 h-4 transition-transform", collapsedGroups.has(category) && "rotate-180")} />
                          {category} ({items.length} items)
                        </div>
                      </TableCell>
                      {monthYears.map(month => {
                        const categoryTotal = items.reduce((sum, item) => sum + (item[`${month}_${activeTab}`] || 0), 0);
                        return (
                          <TableCell key={month} className="text-center font-bold text-blue-700 border-r border-slate-200/30 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                            {activeTab.includes('Revenue') || activeTab === 'atv' || activeTab === 'auv' || activeTab === 'asv' ? 
                              formatCurrency(categoryTotal) : 
                              activeTab === 'upt' ? 
                                (categoryTotal / items.length).toFixed(1) : 
                                formatNumber(categoryTotal)
                            }
                          </TableCell>
                        );
                      })}
                    </TableRow>
                    {!collapsedGroups.has(category) && items.map((row: any, index: number) => (
                      <TableRow 
                        key={`${category}-${index}`} 
                        className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 cursor-pointer transition-all duration-300 border-b border-slate-200/20 bg-white" 
                        onClick={() => handleRowClick(row)}
                      >
                        <TableCell className="font-semibold text-slate-800 sticky left-0 bg-white backdrop-blur-sm border-r border-slate-200/30 text-sm pl-8 shadow-sm">
                          {row.name}
                        </TableCell>
                        {monthYears.map(month => (
                          <TableCell key={month} className="text-center font-medium text-sm border-r border-slate-200/10">
                            {activeTab === 'grossRevenue' && formatCurrency(row[`${month}_grossRevenue`] || 0)}
                            {activeTab === 'netRevenue' && formatCurrency(row[`${month}_netRevenue`] || 0)}
                            {activeTab === 'transactions' && formatNumber(row[`${month}_transactions`] || 0)}
                            {activeTab === 'uniqueMembers' && formatNumber(row[`${month}_uniqueMembers`] || 0)}
                            {activeTab === 'units' && formatNumber(row[`${month}_units`] || 0)}
                            {activeTab === 'atv' && `₹${row[`${month}_atv`] || 0}`}
                            {activeTab === 'auv' && `₹${row[`${month}_auv`] || 0}`}
                            {activeTab === 'asv' && `₹${row[`${month}_asv`] || 0}`}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
              <TableFooter className="sticky bottom-0 bg-gradient-to-r from-emerald-500 via-teal-600 to-emerald-500 shadow-lg">
                <TableRow className="border-0">
                  <TableCell className="font-bold text-white sticky left-0 bg-gradient-to-r from-emerald-500 to-teal-600 backdrop-blur-sm border-r border-white/20">
                    GRAND TOTALS
                  </TableCell>
                  {monthYears.map(month => (
                    <TableCell key={month} className="text-center font-bold text-white border-r border-white/10">
                      {activeTab === 'grossRevenue' && formatCurrency(totals[`${month}_grossRevenue`] || 0)}
                      {activeTab === 'netRevenue' && formatCurrency(totals[`${month}_netRevenue`] || 0)}
                      {activeTab === 'transactions' && formatNumber(totals[`${month}_transactions`] || 0)}
                      {activeTab === 'uniqueMembers' && formatNumber(totals[`${month}_uniqueMembers`] || 0)}
                      {activeTab === 'units' && formatNumber(totals[`${month}_units`] || 0)}
                      {(activeTab === 'atv' || activeTab === 'auv' || activeTab === 'asv') && '-'}
                    </TableCell>
                  ))}
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </div>

        {/* Summary/Insights Section */}
        <div className="p-6 border-t border-gray-200 bg-gradient-to-r from-slate-50 to-white rounded-b-lg">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Product Performance Insights
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
              placeholder="Enter product performance insights using bullet points (• )"
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
