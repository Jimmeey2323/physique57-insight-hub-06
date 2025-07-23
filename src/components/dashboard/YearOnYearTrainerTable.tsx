
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import { TrainerMetricType } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { cn } from '@/lib/utils';

interface YearOnYearTrainerTableProps {
  data: Record<string, Record<string, number>>;
  months: string[];
  trainers: string[];
  defaultMetric: TrainerMetricType;
}

export const YearOnYearTrainerTable = ({ 
  data, 
  months, 
  trainers, 
  defaultMetric 
}: YearOnYearTrainerTableProps) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Process months for year-on-year comparison
  const processMonthsForYoY = () => {
    const monthsByYear: Record<string, Record<string, string>> = {};
    
    months.forEach(month => {
      const [monthName, year] = month.split('-');
      if (!monthsByYear[year]) {
        monthsByYear[year] = {};
      }
      monthsByYear[year][monthName] = month;
    });

    const years = Object.keys(monthsByYear).sort().reverse(); // 2025, 2024, etc.
    const uniqueMonthNames = ['Jun', 'May', 'Apr', 'Mar', 'Feb', 'Jan', 'Dec', 'Nov', 'Oct', 'Sep', 'Aug', 'Jul'];
    
    // Create alternating structure: Jun-2025, Jun-2024, May-2025, May-2024, etc.
    const alternatingColumns: Array<{monthName: string, year: string, fullMonth: string}> = [];
    
    uniqueMonthNames.forEach(monthName => {
      years.forEach(year => {
        const fullMonth = monthsByYear[year]?.[monthName];
        if (fullMonth) {
          alternatingColumns.push({
            monthName,
            year,
            fullMonth
          });
        }
      });
    });

    return { alternatingColumns, years, uniqueMonthNames };
  };

  const { alternatingColumns, years } = processMonthsForYoY();

  const sortedTrainers = [...trainers].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' ? a.localeCompare(b) : b.localeCompare(a);
    }
    // Sort by latest month value
    const latestColumn = alternatingColumns[0];
    const aValue = data[a]?.[latestColumn?.fullMonth] || 0;
    const bValue = data[b]?.[latestColumn?.fullMonth] || 0;
    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
  });

  // Calculate totals for each column
  const columnTotals = alternatingColumns.reduce((acc, col) => {
    acc[col.fullMonth] = trainers.reduce((sum, trainer) => sum + (data[trainer]?.[col.fullMonth] || 0), 0);
    return acc;
  }, {} as Record<string, number>);

  // Calculate grand total
  const grandTotal = Object.values(columnTotals).reduce((sum, val) => sum + val, 0);

  if (!trainers.length || years.length < 2) {
    return (
      <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Year-on-Year {getMetricTitle(defaultMetric)} Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-600">Insufficient data for year-on-year comparison (need at least 2 years)</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-white via-slate-50/30 to-white border-0 shadow-xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Year-on-Year {getMetricTitle(defaultMetric)} Comparison
        </CardTitle>
      </CardHeader>
      <CardContent>
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
                {alternatingColumns.map((col) => (
                  <TableHead key={`${col.monthName}-${col.year}`} className="text-center font-bold text-slate-700 min-w-[120px]">
                    <div className="text-center">
                      <div className="font-bold">{col.monthName}</div>
                      <div className={cn(
                        "text-xs font-medium",
                        col.year === '2025' ? 'text-blue-600' : 'text-purple-600'
                      )}>
                        {col.year}
                      </div>
                    </div>
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">YoY Change</TableHead>
                <TableHead className="text-center font-bold text-slate-700 min-w-[100px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Totals Row */}
              <TableRow className="bg-gradient-to-r from-blue-50 to-purple-50 border-b-2 font-bold">
                <TableCell className="font-bold text-blue-800 sticky left-0 bg-gradient-to-r from-blue-50 to-purple-50 z-10 border-r">
                  TOTAL
                </TableCell>
                {alternatingColumns.map((col) => (
                  <TableCell key={`total-${col.monthName}-${col.year}`} className="text-center font-bold text-blue-800">
                    {formatValue(columnTotals[col.fullMonth] || 0, defaultMetric)}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                    {years.length >= 2 ? 'Total YoY' : 'N/A'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-bold text-blue-800">
                  {formatValue(grandTotal, defaultMetric)}
                </TableCell>
              </TableRow>

              {/* Trainer Rows */}
              {sortedTrainers.map((trainer) => {
                const trainerData = data[trainer] || {};
                const isExpanded = expandedRows.has(trainer);
                
                // Calculate YoY change (comparing same months across years)
                const currentYearData = alternatingColumns.filter(col => col.year === years[0]);
                const previousYearData = alternatingColumns.filter(col => col.year === years[1]);
                
                let yoyChange = 0;
                let trainerTotal = 0;
                
                if (currentYearData.length > 0 && previousYearData.length > 0) {
                  const currentTotal = currentYearData.reduce((sum, col) => sum + (trainerData[col.fullMonth] || 0), 0);
                  const previousTotal = previousYearData.reduce((sum, col) => sum + (trainerData[col.fullMonth] || 0), 0);
                  yoyChange = getChangePercentage(currentTotal, previousTotal);
                  trainerTotal = alternatingColumns.reduce((sum, col) => sum + (trainerData[col.fullMonth] || 0), 0);
                }
                
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
                      {alternatingColumns.map((col) => (
                        <TableCell key={`${trainer}-${col.monthName}-${col.year}`} className="text-center font-mono">
                          {formatValue(trainerData[col.fullMonth] || 0, defaultMetric)}
                        </TableCell>
                      ))}
                      <TableCell className="text-center">
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
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-700">
                        {formatValue(trainerTotal, defaultMetric)}
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded Row Details */}
                    {isExpanded && (
                      <TableRow className="bg-slate-50">
                        <TableCell colSpan={alternatingColumns.length + 3} className="p-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {years.map(year => {
                              const yearData = alternatingColumns.filter(col => col.year === year);
                              const yearTotal = yearData.reduce((sum, col) => sum + (trainerData[col.fullMonth] || 0), 0);
                              const yearAverage = yearTotal / Math.max(yearData.length, 1);
                              const yearBest = Math.max(...yearData.map(col => trainerData[col.fullMonth] || 0));
                              
                              return (
                                <div key={year} className="bg-white p-3 rounded-lg shadow-sm border">
                                  <p className="text-slate-600 text-xs font-medium">{year} Performance</p>
                                  <p className={cn(
                                    "font-bold text-lg",
                                    year === years[0] ? "text-blue-600" : "text-purple-600"
                                  )}>
                                    {formatValue(yearTotal, defaultMetric)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Avg: {formatValue(yearAverage, defaultMetric)}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    Best: {formatValue(yearBest, defaultMetric)}
                                  </p>
                                </div>
                              );
                            })}
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">YoY Growth</p>
                              <p className={cn(
                                "font-bold text-lg",
                                yoyChange >= 0 ? "text-green-600" : "text-red-600"
                              )}>
                                {yoyChange >= 0 ? '+' : ''}{yoyChange.toFixed(1)}%
                              </p>
                              <p className="text-xs text-slate-500">
                                {years[0]} vs {years[1]}
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-lg shadow-sm border">
                              <p className="text-slate-600 text-xs font-medium">Overall Trend</p>
                              <p className="font-bold text-slate-800 text-lg">
                                {yoyChange >= 10 ? 'Excellent' : yoyChange >= 0 ? 'Growing' : yoyChange >= -10 ? 'Declining' : 'Concerning'}
                              </p>
                              <p className="text-xs text-slate-500">Performance Rating</p>
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
