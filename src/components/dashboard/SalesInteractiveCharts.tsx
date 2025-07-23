
import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Calendar, Package, Users, DollarSign, Filter, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { SalesData, FilterOptions } from '@/types/dashboard';
import { formatCurrency, formatNumber } from '@/utils/formatters';

interface SalesInteractiveChartsProps {
  data: SalesData[];
  filters: FilterOptions;
}

export const SalesInteractiveCharts: React.FC<SalesInteractiveChartsProps> = ({ data, filters }) => {
  const [timeRange, setTimeRange] = useState<'3m' | '6m' | '12m' | 'ytd'>('6m');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [productMetric, setProductMetric] = useState<'revenue' | 'volume'>('revenue');

  const parseDate = useCallback((dateStr: string): Date | null => {
    if (!dateStr) return null;
    
    // Handle DD/MM/YYYY format
    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (ddmmyyyy) {
      const [, day, month, year] = ddmmyyyy;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    
    // Handle DD/MM/YYYY HH:MM:SS format
    const ddmmyyyyTime = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2}):(\d{1,2})$/);
    if (ddmmyyyyTime) {
      const [, day, month, year, hour, minute, second] = ddmmyyyyTime;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    }
    
    return null;
  }, []);

  // Filter data based on time range - memoize with stable dependencies
  const filteredData = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case '3m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case '6m':
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
        break;
      case '12m':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    }
    
    return data.filter(item => {
      const itemDate = parseDate(item.paymentDate);
      if (!itemDate) return false;
      return itemDate >= startDate && itemDate <= now;
    });
  }, [data, timeRange]);

  // Monthly revenue trend
  const monthlyRevenue = useMemo(() => {
    if (!filteredData.length) return [];
    
    const monthlyData: Record<string, number> = {};
    
    filteredData.forEach(item => {
      const date = parseDate(item.paymentDate);
      if (date && item.paymentValue) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + item.paymentValue;
      }
    });

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, revenue]) => ({
        month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: revenue,
        formattedRevenue: formatCurrency(revenue)
      }));
  }, [filteredData]);

  // Top 10 products by revenue or volume
  const topProducts = useMemo(() => {
    if (!filteredData.length) return [];
    
    const productData: Record<string, { revenue: number; volume: number }> = {};
    
    filteredData.forEach(item => {
      const product = item.cleanedProduct || item.paymentItem || 'Unknown';
      if (product && product.trim()) {
        if (!productData[product]) {
          productData[product] = { revenue: 0, volume: 0 };
        }
        productData[product].revenue += item.paymentValue || 0;
        productData[product].volume += 1;
      }
    });

    const sortKey = productMetric === 'revenue' ? 'revenue' : 'volume';
    return Object.entries(productData)
      .filter(([, data]) => data[sortKey] > 0)
      .sort(([, a], [, b]) => b[sortKey] - a[sortKey])
      .slice(0, 10)
      .map(([product, data]) => ({
        product: product.length > 20 ? product.substring(0, 20) + '...' : product,
        fullProduct: product,
        revenue: data.revenue,
        volume: data.volume,
        value: data[sortKey],
        formattedValue: productMetric === 'revenue' ? formatCurrency(data.revenue) : formatNumber(data.volume)
      }));
  }, [filteredData, productMetric]);

  // Category distribution
  const categoryDistribution = useMemo(() => {
    if (!filteredData.length) return [];
    
    const categoryData: Record<string, number> = {};
    
    filteredData.forEach(item => {
      const category = item.cleanedCategory || item.paymentCategory || 'Unknown';
      if (category && category.trim() && item.paymentValue) {
        categoryData[category] = (categoryData[category] || 0) + item.paymentValue;
      }
    });

    return Object.entries(categoryData)
      .filter(([, revenue]) => revenue > 0)
      .sort(([, a], [, b]) => b - a)
      .map(([category, revenue]) => ({
        category,
        revenue,
        formattedRevenue: formatCurrency(revenue)
      }));
  }, [filteredData]);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff', '#00ffff', '#ffff00', '#ff0000', '#0000ff'];

  // Stable callback functions to prevent re-renders
  const handleTimeRangeChange = useCallback((range: '3m' | '6m' | '12m' | 'ytd') => {
    setTimeRange(range);
  }, []);

  const handleChartTypeChange = useCallback((type: 'bar' | 'line' | 'pie') => {
    setChartType(type);
  }, []);

  const handleProductMetricChange = useCallback((metric: 'revenue' | 'volume') => {
    setProductMetric(metric);
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Revenue Trend */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-100">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-blue-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Monthly Revenue Trend
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={timeRange === '3m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeRangeChange('3m')}
              >
                3M
              </Button>
              <Button
                variant={timeRange === '6m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeRangeChange('6m')}
              >
                6M
              </Button>
              <Button
                variant={timeRange === '12m' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeRangeChange('12m')}
              >
                12M
              </Button>
              <Button
                variant={timeRange === 'ytd' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleTimeRangeChange('ytd')}
              >
                YTD
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <LineChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="revenue" fill="#8884d8" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center mt-4 gap-2">
            <Button
              variant={chartType === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartTypeChange('bar')}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Bar
            </Button>
            <Button
              variant={chartType === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleChartTypeChange('line')}
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Line
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Top 10 Products */}
      <Card className="bg-gradient-to-br from-green-50 to-emerald-100">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-green-800 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Top 10 Products
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={productMetric === 'revenue' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProductMetricChange('revenue')}
              >
                <DollarSign className="w-4 h-4 mr-1" />
                Revenue
              </Button>
              <Button
                variant={productMetric === 'volume' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleProductMetricChange('volume')}
              >
                <Users className="w-4 h-4 mr-1" />
                Volume
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => 
                    productMetric === 'revenue' ? formatCurrency(value) : formatNumber(value)
                  } 
                />
                <YAxis type="category" dataKey="product" width={100} />
                <Tooltip 
                  formatter={(value) => 
                    productMetric === 'revenue' ? formatCurrency(Number(value)) : formatNumber(Number(value))
                  } 
                />
                <Bar dataKey="value" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {topProducts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No product data available for the selected time range</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution */}
      <Card className="bg-gradient-to-br from-purple-50 to-violet-100 lg:col-span-2">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-purple-800 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Category Distribution
            </CardTitle>
            <Badge variant="outline" className="text-purple-700">
              {categoryDistribution.length} Categories
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {categoryDistribution.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Filter className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>No category data available for the selected time range</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
