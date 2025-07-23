
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronRight, Target } from 'lucide-react';
import { SalesData, FilterOptions } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface DiscountYearOnYearTableProps {
  data: SalesData[];
  filters: FilterOptions;
  onRowClick: (row: any) => void;
}

type DiscountMetricType = 'discountAmount' | 'discountRate' | 'penetration' | 'avgDiscount' | 'transactions' | 'revenue';

export const DiscountYearOnYearTable: React.FC<DiscountYearOnYearTableProps> = ({
  data,
  filters,
  onRowClick
}) => {
  const [selectedMetric, setSelectedMetric] = useState<DiscountMetricType>('discountAmount');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { tableData, months, summary } = useMemo(() => {
    // Group data by product and month
    const productMonthGroups = data.reduce((acc, item) => {
      if (!item.paymentDate || !item.cleanedProduct) return acc;
      
      const ddmmyyyy = item.paymentDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (!ddmmyyyy) return acc;
      
      const [, day, month, year] = ddmmyyyy;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const monthKey = `${date.toLocaleDateString('en-US', { month: 'short' })}-${date.getFullYear()}`;
      const productKey = item.cleanedProduct;
      
      if (!acc[productKey]) {
        acc[productKey] = {};
      }
      if (!acc[productKey][monthKey]) {
        acc[productKey][monthKey] = {
          discountAmount: 0,
          grossRevenue: 0,
          netRevenue: 0,
          transactions: 0,
          discountedTransactions: 0,
          totalGrossDiscountPercent: 0,
          totalNetDiscountPercent: 0
        };
      }
      
      const group = acc[productKey][monthKey];
      group.discountAmount += item.discountAmount || 0;
      group.grossRevenue += item.grossRevenue || 0;
      group.netRevenue += item.netRevenue || 0;
      group.transactions += 1;
      
      if ((item.discountAmount || 0) > 0) {
        group.discountedTransactions += 1;
        group.totalGrossDiscountPercent += item.grossDiscountPercent || 0;
        group.totalNetDiscountPercent += item.netDiscountPercent || 0;
      }
      
      return acc;
    }, {} as Record<string, Record<string, any>>);

    // Get unique months and sort them
    const allMonths = new Set<string>();
    Object.values(productMonthGroups).forEach(productData => {
      Object.keys(productData).forEach(month => allMonths.add(month));
    });
    const sortedMonths = Array.from(allMonths).sort((a, b) => {
      const [monthA, yearA] = a.split('-');
      const [monthB, yearB] = b.split('-');
      const dateA = new Date(`${monthA} 1, ${yearA}`);
      const dateB = new Date(`${monthB} 1, ${yearB}`);
      return dateA.getTime() - dateB.getTime();
    });

    // Calculate processed data for each product
    const processedData = Object.entries(productMonthGroups).map(([product, monthData]) => {
      const productRow: any = { product };
      let totalDiscountAmount = 0;
      let totalRevenue = 0;
      let totalTransactions = 0;
      let totalDiscountedTransactions = 0;

      sortedMonths.forEach(month => {
        const monthStats = monthData[month] || {
          discountAmount: 0,
          grossRevenue: 0,
          netRevenue: 0,
          transactions: 0,
          discountedTransactions: 0,
          totalGrossDiscountPercent: 0,
          totalNetDiscountPercent: 0
        };

        const discountRate = monthStats.grossRevenue > 0 ? (monthStats.discountAmount / monthStats.grossRevenue) * 100 : 0;
        const penetration = monthStats.transactions > 0 ? (monthStats.discountedTransactions / monthStats.transactions) * 100 : 0;
        const avgDiscount = monthStats.discountedTransactions > 0 ? monthStats.discountAmount / monthStats.discountedTransactions : 0;

        productRow[month] = {
          discountAmount: monthStats.discountAmount,
          discountRate,
          penetration,
          avgDiscount,
          transactions: monthStats.discountedTransactions,
          revenue: monthStats.grossRevenue
        };

        totalDiscountAmount += monthStats.discountAmount;
        totalRevenue += monthStats.grossRevenue;
        totalTransactions += monthStats.transactions;
        totalDiscountedTransactions += monthStats.discountedTransactions;
      });

      productRow.totals = {
        discountAmount: totalDiscountAmount,
        discountRate: totalRevenue > 0 ? (totalDiscountAmount / totalRevenue) * 100 : 0,
        penetration: totalTransactions > 0 ? (totalDiscountedTransactions / totalTransactions) * 100 : 0,
        avgDiscount: totalDiscountedTransactions > 0 ? totalDiscountAmount / totalDiscountedTransactions : 0,
        transactions: totalDiscountedTransactions,
        revenue: totalRevenue
      };

      return productRow;
    });

    // Calculate summary
    const summaryData = sortedMonths.reduce((acc, month) => {
      acc[month] = processedData.reduce((monthSum, product) => {
        const monthData = product[month] || { discountAmount: 0, revenue: 0, transactions: 0 };
        return {
          discountAmount: monthSum.discountAmount + monthData.discountAmount,
          revenue: monthSum.revenue + monthData.revenue,
          transactions: monthSum.transactions + monthData.transactions
        };
      }, { discountAmount: 0, revenue: 0, transactions: 0 });
      return acc;
    }, {} as Record<string, any>);

    return {
      tableData: processedData.sort((a, b) => b.totals[selectedMetric] - a.totals[selectedMetric]),
      months: sortedMonths,
      summary: summaryData
    };
  }, [data, selectedMetric]);

  const formatValue = (value: number, metric: DiscountMetricType) => {
    switch (metric) {
      case 'discountAmount':
      case 'avgDiscount':
      case 'revenue':
        return formatCurrency(value);
      case 'discountRate':
      case 'penetration':
        return `${value.toFixed(1)}%`;
      case 'transactions':
        return formatNumber(value);
      default:
        return value.toString();
    }
  };

  const getMetricTitle = (metric: DiscountMetricType) => {
    switch (metric) {
      case 'discountAmount': return 'Total Discounts';
      case 'discountRate': return 'Discount Rate (%)';
      case 'penetration': return 'Penetration (%)';
      case 'avgDiscount': return 'Avg Discount';
      case 'transactions': return 'Discounted Transactions';
      case 'revenue': return 'Gross Revenue';
      default: return 'Metric';
    }
  };

  const toggleRowExpansion = (product: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(product)) {
      newExpanded.delete(product);
    } else {
      newExpanded.add(product);
    }
    setExpandedRows(newExpanded);
  };

  const getYearOnYearChange = (product: any, metric: DiscountMetricType) => {
    const currentYearMonths = months.filter(m => m.includes('2025'));
    const previousYearMonths = months.filter(m => m.includes('2024'));
    
    if (currentYearMonths.length === 0 || previousYearMonths.length === 0) return null;
    
    const currentValue = currentYearMonths.reduce((sum, month) => sum + (product[month]?.[metric] || 0), 0);
    const previousValue = previousYearMonths.reduce((sum, month) => sum + (product[month]?.[metric] || 0), 0);
    
    if (previousValue === 0) return currentValue > 0 ? 100 : 0;
    return ((currentValue - previousValue) / previousValue) * 100;
  };

  return (
    <Card className="bg-gradient-to-br from-white via-red-50/30 to-orange-50/20 border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold bg-gradient-to-r from-red-700 to-orange-700 bg-clip-text text-transparent flex items-center gap-2">
          <Calendar className="w-6 h-6 text-red-600" />
          Year-on-Year Discount Analysis
        </CardTitle>
        
        <div className="mt-4">
          <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as DiscountMetricType)}>
            <TabsList className="grid w-full grid-cols-6 bg-white border border-red-200 p-1 rounded-xl shadow-sm h-auto">
              <TabsTrigger value="discountAmount" className="text-xs px-2 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Amount
              </TabsTrigger>
              <TabsTrigger value="discountRate" className="text-xs px-2 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Rate %
              </TabsTrigger>
              <TabsTrigger value="penetration" className="text-xs px-2 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Penetration
              </TabsTrigger>
              <TabsTrigger value="avgDiscount" className="text-xs px-2 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Avg Discount
              </TabsTrigger>
              <TabsTrigger value="transactions" className="text-xs px-2 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Transactions
              </TabsTrigger>
              <TabsTrigger value="revenue" className="text-xs px-2 py-2 data-[state=active]:bg-red-600 data-[state=active]:text-white">
                Revenue
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-red-50 to-orange-50 border-b-2">
                <TableHead className="font-bold text-red-700 sticky left-0 bg-gradient-to-r from-red-50 to-orange-50 z-10 min-w-[200px]">
                  Product
                </TableHead>
                {months.map((month) => (
                  <TableHead key={month} className="text-center font-bold text-red-700 min-w-[120px]">
                    <div className="text-center">
                      <div className="font-bold">{month.split('-')[0]}</div>
                      <div className="text-xs text-red-600">{month.split('-')[1]}</div>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold text-red-700 min-w-[100px]">YoY Change</TableHead>
                <TableHead className="text-center font-bold text-red-700 min-w-[120px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Summary Row */}
              <TableRow className="bg-gradient-to-r from-red-100 to-orange-100 border-b-2 font-bold">
                <TableCell className="font-bold text-red-800 sticky left-0 bg-gradient-to-r from-red-100 to-orange-100 z-10 border-r">
                  TOTAL
                </TableCell>
                {months.map((month) => (
                  <TableCell key={`total-${month}`} className="text-center font-bold text-red-800">
                    {formatValue(summary[month]?.[selectedMetric] || 0, selectedMetric)}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                    Total YoY
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-bold text-red-800">
                  {formatValue(Object.values(summary).reduce((sum: number, month: any) => sum + (month[selectedMetric] || 0), 0), selectedMetric)}
                </TableCell>
              </TableRow>

              {/* Product Rows */}
              {tableData.map((product) => {
                const isExpanded = expandedRows.has(product.product);
                const yoyChange = getYearOnYearChange(product, selectedMetric);
                
                return (
                  <React.Fragment key={product.product}>
                    <TableRow 
                      className="hover:bg-red-50/50 transition-colors border-b cursor-pointer"
                      onClick={() => onRowClick(product)}
                    >
                      <TableCell className="font-medium text-slate-800 sticky left-0 bg-white z-10 border-r">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpansion(product.product);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </Button>
                          <span className="text-sm">{product.product}</span>
                        </div>
                      </TableCell>
                      {months.map((month) => (
                        <TableCell key={`${product.product}-${month}`} className="text-center font-mono text-sm">
                          {formatValue(product[month]?.[selectedMetric] || 0, selectedMetric)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        {yoyChange !== null && (
                          <Badge
                            variant={yoyChange >= 0 ? "default" : "destructive"}
                            className={cn(
                              "flex items-center gap-1 w-fit mx-auto",
                              yoyChange >= 0 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-red-100 text-red-800 hover:bg-red-200'
                            )}
                          >
                            {yoyChange >= 0 ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {Math.abs(yoyChange).toFixed(1)}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700">
                        {formatValue(product.totals[selectedMetric], selectedMetric)}
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <TableRow className="bg-red-50/30">
                        <TableCell colSpan={months.length + 3} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Total Discount Amount</p>
                              <p className="font-bold text-red-600 text-lg">
                                {formatCurrency(product.totals.discountAmount)}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Avg Discount Rate</p>
                              <p className="font-bold text-orange-600 text-lg">
                                {product.totals.discountRate.toFixed(1)}%
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Penetration Rate</p>
                              <p className="font-bold text-purple-600 text-lg">
                                {product.totals.penetration.toFixed(1)}%
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Discounted Transactions</p>
                              <p className="font-bold text-blue-600 text-lg">
                                {formatNumber(product.totals.transactions)}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
