
import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SalesData } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Activity, Filter } from 'lucide-react';

interface SalesInteractiveChartsProps {
  data: SalesData[];
}

interface MonthlyDataPoint {
  month: string;
  revenue: number;
  transactions: number;
  members: number;
  vat: number;
  atv: number;
}

interface CategoryDataPoint {
  name: string;
  value: number;
  count: number;
}

interface ProductDataPoint {
  name: string;
  value: number;
  count: number;
}

export const SalesInteractiveCharts: React.FC<SalesInteractiveChartsProps> = ({ data }) => {
  const [activeChart, setActiveChart] = useState('revenue');
  const [timeRange, setTimeRange] = useState('6months');

  const parseDate = (dateStr: string): Date | null => {
    if (!dateStr) return null;
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    return null;
  };

  const monthlyData = useMemo((): MonthlyDataPoint[] => {
    const months: Record<string, {
      month: string;
      revenue: number;
      transactions: number;
      members: Set<string>;
      vat: number;
    }> = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    data.forEach(item => {
      const date = parseDate(item.paymentDate);
      if (date) {
        const key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        if (!months[key]) {
          months[key] = {
            month: key,
            revenue: 0,
            transactions: 0,
            members: new Set<string>(),
            vat: 0
          };
        }
        months[key].revenue += item.paymentValue || 0;
        months[key].transactions += 1;
        months[key].members.add(item.memberId);
        months[key].vat += item.paymentVAT || 0;
      }
    });

    return Object.values(months).map(month => ({
      month: month.month,
      revenue: month.revenue,
      transactions: month.transactions,
      members: month.members.size,
      vat: month.vat,
      atv: month.revenue / month.transactions || 0
    }));
  }, [data]);

  const categoryData = useMemo((): CategoryDataPoint[] => {
    const categories: Record<string, CategoryDataPoint> = {};
    data.forEach(item => {
      const category = item.cleanedCategory || 'Uncategorized';
      if (!categories[category]) {
        categories[category] = { name: category, value: 0, count: 0 };
      }
      categories[category].value += item.paymentValue || 0;
      categories[category].count += 1;
    });
    return Object.values(categories).sort((a, b) => b.value - a.value);
  }, [data]);

  const productData = useMemo((): ProductDataPoint[] => {
    const products: Record<string, ProductDataPoint> = {};
    data.forEach(item => {
      const product = item.cleanedProduct || 'Uncategorized';
      if (!products[product]) {
        products[product] = { name: product, value: 0, count: 0 };
      }
      products[product].value += item.paymentValue || 0;
      products[product].count += 1;
    });
    return Object.values(products).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [data]);

  const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'];

  const formatTooltipValue = (value: any): string => {
    if (typeof value === 'number') {
      return formatCurrency(value);
    }
    return String(value);
  };

  const formatTooltipNumber = (value: any): string => {
    if (typeof value === 'number') {
      return formatNumber(value);
    }
    return String(value);
  };

  return (
    <div className="space-y-6">
      {/* First Row - Two Small Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Performance */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-purple-600" />
                Category Revenue Distribution
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-1" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatTooltipValue(value)} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Products Performance */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Top 10 Products by Revenue
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Revenue
                </Button>
                <Button variant="ghost" size="sm">
                  Volume
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={productData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis type="number" tickFormatter={formatTooltipValue} className="text-xs" />
                <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                <Tooltip 
                  formatter={(value) => formatTooltipValue(value)}
                  labelClassName="text-sm font-medium"
                  contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Full Width Chart */}
      <div className="grid grid-cols-1 gap-6">
        {/* Monthly Revenue Trend */}
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Monthly Revenue & Performance Trends
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={timeRange === '3months' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('3months')}
                >
                  3M
                </Button>
                <Button
                  variant={timeRange === '6months' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('6months')}
                >
                  6M
                </Button>
                <Button
                  variant={timeRange === 'year' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange('year')}
                >
                  1Y
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-1 mb-4">
              <Button
                variant={activeChart === 'revenue' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveChart('revenue')}
              >
                Revenue
              </Button>
              <Button
                variant={activeChart === 'transactions' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveChart('transactions')}
              >
                Transactions
              </Button>
              <Button
                variant={activeChart === 'members' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveChart('members')}
              >
                Members
              </Button>
            </div>
            <ResponsiveContainer width="100%" height={350}>
              {activeChart === 'revenue' ? (
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={formatTooltipValue} className="text-xs" />
                  <Tooltip 
                    formatter={(value) => [formatTooltipValue(value), 'Revenue']}
                    labelClassName="text-sm font-medium"
                    contentStyle={{ background: 'rgba(255, 255, 255, 0.95)', border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3B82F6" 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              ) : activeChart === 'transactions' ? (
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={formatTooltipNumber} className="text-xs" />
                  <Tooltip formatter={(value) => formatTooltipNumber(value)} />
                  <Line type="monotone" dataKey="transactions" stroke="#8B5CF6" strokeWidth={3} dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }} />
                </LineChart>
              ) : (
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis tickFormatter={formatTooltipNumber} className="text-xs" />
                  <Tooltip formatter={(value) => formatTooltipNumber(value)} />
                  <Line type="monotone" dataKey="members" stroke="#10B981" strokeWidth={3} dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
