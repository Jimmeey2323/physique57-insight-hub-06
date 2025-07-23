
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { TrainerMetricType } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface MonthOnMonthTrainerTableProps {
  data: Record<string, Record<string, number>>;
  months: string[];
  trainers: string[];
  defaultMetric: TrainerMetricType;
}

export const MonthOnMonthTrainerTable = ({ 
  data, 
  months, 
  trainers, 
  defaultMetric 
}: MonthOnMonthTrainerTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Sort months in descending order (most recent first)
  const sortedMonths = [...months].sort((a, b) => {
    const parseMonth = (monthStr: string) => {
      const [month, year] = monthStr.split('-');
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month);
      return new Date(parseInt(year), monthIndex);
    };
    
    return parseMonth(b).getTime() - parseMonth(a).getTime();
  });

  const formatValue = (value: number, metric: TrainerMetricType) => {
    switch (metric) {
      case 'totalPaid':
        return formatCurrency(value);
      case 'retention':
      case 'conversion':
        return `${value.toFixed(1)}%`;
      case 'classAverage':
      case 'classAverageInclEmpty':
      case 'classAverageExclEmpty':
        return value.toFixed(1);
      default:
        return formatNumber(value);
    }
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getMetricTitle = (metric: TrainerMetricType) => {
    switch (metric) {
      case 'totalSessions':
        return 'Total Sessions';
      case 'totalCustomers':
        return 'Total Students';
      case 'totalPaid':
        return 'Total Revenue';
      case 'classAverage':
      case 'classAverageExclEmpty':
        return 'Class Average (Excl Empty)';
      case 'classAverageInclEmpty':
        return 'Class Average (Incl Empty)';
      case 'retention':
        return 'Retention Rate';
      case 'conversion':
        return 'Conversion Rate';
      case 'emptySessions':
        return 'Empty Sessions';
      case 'newMembers':
        return 'New Members';
      default:
        return 'Metric';
    }
  };

  const toggleRowExpansion = (trainer: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(trainer)) {
      newExpanded.delete(trainer);
    } else {
      newExpanded.add(trainer);
    }
    setExpandedRows(newExpanded);
  };

  const sortedTrainers = [...trainers].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }
    // Sort by latest month value
    const latestMonth = sortedMonths[0];
    const aValue = data[a]?.[latestMonth] || 0;
    const bValue = data[b]?.[latestMonth] || 0;
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Calculate totals for each month
  const monthlyTotals = sortedMonths.reduce((acc, month) => {
    acc[month] = trainers.reduce((sum, trainer) => sum + (data[trainer]?.[month] || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  // Calculate grand total across all months and trainers
  const grandTotal = Object.values(monthlyTotals).reduce((sum, val) => sum + val, 0);

  if (!trainers.length || !sortedMonths.length) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardContent className="p-6">
          <p className="text-center text-slate-600">No data available for month-on-month comparison</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2">
                <TableHead className="font-bold text-slate-700 sticky left-0 bg-gradient-to-r from-slate-50 to-slate-100 z-10 min-w-[200px]">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortBy === 'name' && sortOrder === 'asc' ? 'desc' : 'asc');
                    }}
                    className="font-bold text-slate-700 p-0 h-auto"
                  >
                    Trainer
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <TrendingUp className="w-3 h-3 ml-1" /> : <TrendingDown className="w-3 h-3 ml-1" />
                    )}
                  </Button>
                </TableHead>
                {sortedMonths.map((month) => (
                  <TableHead key={month} className="text-center font-bold text-slate-700 min-w-[120px]">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSortBy(month);
                        setSortOrder(sortBy === month && sortOrder === 'desc' ? 'asc' : 'desc');
                      }}
                      className="font-bold text-slate-700 p-0 h-auto"
                    >
                      {month}
                      {sortBy === month && (
                        sortOrder === 'desc' ? <TrendingDown className="w-3 h-3 ml-1" /> : <TrendingUp className="w-3 h-3 ml-1" />
                      )}
                    </Button>
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">Change</TableHead>
                <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Totals Row */}
              <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 font-bold">
                <TableCell className="font-bold text-blue-800 sticky left-0 bg-gradient-to-r from-blue-50 to-purple-50 z-10">
                  TOTAL
                </TableCell>
                {sortedMonths.map((month) => (
                  <TableCell key={month} className="text-center font-bold text-blue-800">
                    {formatValue(monthlyTotals[month] || 0, defaultMetric)}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {sortedMonths.length >= 2 ? 
                      `${getChangePercentage(monthlyTotals[sortedMonths[0]] || 0, monthlyTotals[sortedMonths[1]] || 0).toFixed(1)}%` 
                      : 'N/A'
                    }
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-bold text-blue-800">
                  {formatValue(grandTotal, defaultMetric)}
                </TableCell>
              </TableRow>

              {/* Trainer Rows */}
              {sortedTrainers.map((trainer) => {
                const trainerData = data[trainer] || {};
                const values = sortedMonths.map(month => trainerData[month] || 0);
                const lastValue = values[0] || 0; // Most recent month
                const secondLastValue = values[1] || 0;
                const change = getChangePercentage(lastValue, secondLastValue);
                const trainerTotal = values.reduce((sum, val) => sum + val, 0);
                const isExpanded = expandedRows.has(trainer);
                
                return (
                  <React.Fragment key={trainer}>
                    <TableRow className="hover:bg-slate-50/50 transition-colors border-b">
                      <TableCell className="font-medium text-slate-800 sticky left-0 bg-white z-10 border-r">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleRowExpansion(trainer)}
                            className="p-1 h-6 w-6"
                          >
                            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          </Button>
                          {trainer}
                        </div>
                      </TableCell>
                      {sortedMonths.map((month) => (
                        <TableCell key={month} className="text-center font-mono">
                          {formatValue(trainerData[month] || 0, defaultMetric)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
                        <Badge
                          variant={change >= 0 ? "default" : "destructive"}
                          className={cn(
                            "flex items-center gap-1 w-fit mx-auto",
                            change >= 0 
                              ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                              : 'bg-red-100 text-red-800 hover:bg-red-200'
                          )}
                        >
                          {change >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {Math.abs(change).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700">
                        {formatValue(trainerTotal, defaultMetric)}
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <TableRow className="bg-slate-50">
                        <TableCell colSpan={sortedMonths.length + 3} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Average per Month</p>
                              <p className="font-bold text-slate-800 text-lg">
                                {formatValue(trainerTotal / sortedMonths.length, defaultMetric)}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Best Month</p>
                              <p className="font-bold text-green-600 text-lg">
                                {formatValue(Math.max(...values), defaultMetric)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {sortedMonths[values.indexOf(Math.max(...values))]}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Worst Month</p>
                              <p className="font-bold text-red-600 text-lg">
                                {formatValue(Math.min(...values), defaultMetric)}
                              </p>
                              <p className="text-xs text-slate-500">
                                {sortedMonths[values.indexOf(Math.min(...values))]}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Growth Trend</p>
                              <p className={cn(
                                "font-bold text-lg",
                                change >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                              </p>
                              <p className="text-xs text-slate-500">vs Previous Month</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Consistency Score</p>
                              <p className="font-bold text-blue-600 text-lg">
                                {values.length > 1 ? 
                                  (100 - (values.reduce((acc, val, i) => {
                                    if (i === 0) return acc;
                                    const change = Math.abs((val - values[i-1]) / Math.max(values[i-1], 1)) * 100;
                                    return acc + change;
                                  }, 0) / (values.length - 1))).toFixed(0) 
                                  : '100'
                                }%
                              </p>
                              <p className="text-xs text-slate-500">Lower variance = higher score</p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Peak Performance</p>
                              <p className="font-bold text-purple-600 text-lg">
                                {((Math.max(...values) / Math.max(trainerTotal / sortedMonths.length, 1)) * 100).toFixed(0)}%
                              </p>
                              <p className="text-xs text-slate-500">Peak vs Average</p>
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
      </div>
    </div>
  );
};
