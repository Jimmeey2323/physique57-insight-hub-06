import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Percent, TrendingDown, MapPin, Building2, Tag, DollarSign, Users, ShoppingCart, Target, Gift, Zap, Award } from 'lucide-react';
import { useDiscountsData } from '@/hooks/useDiscountsData';
import { MetricCard } from './MetricCard';
import { AutoCloseFilterSection } from './AutoCloseFilterSection';
import { InteractiveChart } from './InteractiveChart';
import { DataTable } from './DataTable';
import { ThemeSelector } from './ThemeSelector';
import { DrillDownModal } from './DrillDownModal';
import { SalesData, FilterOptions, MetricCardData } from '@/types/dashboard';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { cn } from '@/lib/utils';
import { DiscountMonthOnMonthTable } from './DiscountMonthOnMonthTable';
import { DiscountRevenueAnalysis } from './DiscountRevenueAnalysis';
import { DiscountImpactInsights } from './DiscountImpactInsights';
import { DiscountYearOnYearTable } from './DiscountYearOnYearTable';
import { DiscountTopBottomLists } from './DiscountTopBottomLists';

const locations = [{
  id: 'kwality',
  name: 'Kwality House, Kemps Corner',
  fullName: 'Kwality House, Kemps Corner'
}, {
  id: 'supreme',
  name: 'Supreme HQ, Bandra',
  fullName: 'Supreme HQ, Bandra'
}, {
  id: 'kenkere',
  name: 'Kenkere House',
  fullName: 'Kenkere House'
}];

export const DiscountsSection: React.FC = () => {
  const { data, loading, error, refetch } = useDiscountsData();
  const [activeLocation, setActiveLocation] = useState('kwality');
  const [currentTheme, setCurrentTheme] = useState('classic');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [drillDownData, setDrillDownData] = useState<any>(null);
  const [drillDownType, setDrillDownType] = useState<'metric' | 'product' | 'category' | 'member'>('metric');
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      start: '2025-03-01',
      end: '2025-05-31'
    },
    location: [],
    category: [],
    product: [],
    soldBy: [],
    paymentMethod: []
  });

  // Helper function to filter data by date range and other filters
  const applyFilters = (rawData: SalesData[]) => {
    let filtered = rawData;

    // Apply location filter first
    filtered = filtered.filter(item => {
      const locationMatch = activeLocation === 'kwality' 
        ? item.calculatedLocation === 'Kwality House, Kemps Corner'
        : activeLocation === 'supreme' 
        ? item.calculatedLocation === 'Supreme HQ, Bandra'
        : item.calculatedLocation === 'Kenkere House';
      return locationMatch;
    });

    // Apply date range filter with improved date parsing
    if (filters.dateRange.start || filters.dateRange.end) {
      const startDate = filters.dateRange.start ? new Date(filters.dateRange.start) : null;
      const endDate = filters.dateRange.end ? new Date(filters.dateRange.end) : null;
      
      filtered = filtered.filter(item => {
        if (!item.paymentDate) return false;

        // Enhanced date parsing to handle DD/MM/YYYY format
        let itemDate: Date | null = null;
        const ddmmyyyy = item.paymentDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy;
          itemDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        } else {
          const formats = [
            new Date(item.paymentDate),
            new Date(item.paymentDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$3-$2-$1')),
            new Date(item.paymentDate.replace(/(\d{2})\/(\d{2})\/(\d{4})/, '$2/$1/$3'))
          ];
          for (const date of formats) {
            if (!isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2100) {
              itemDate = date;
              break;
            }
          }
        }
        
        if (!itemDate || isNaN(itemDate.getTime())) return false;
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;
        return true;
      });
    }

    // Apply other filters
    if (filters.category?.length) {
      filtered = filtered.filter(item => 
        filters.category!.some(cat => 
          item.cleanedCategory?.toLowerCase().includes(cat.toLowerCase())
        )
      );
    }
    if (filters.paymentMethod?.length) {
      filtered = filtered.filter(item => 
        filters.paymentMethod!.some(method => 
          item.paymentMethod?.toLowerCase().includes(method.toLowerCase())
        )
      );
    }
    if (filters.soldBy?.length) {
      filtered = filtered.filter(item => 
        filters.soldBy!.some(seller => 
          item.soldBy?.toLowerCase().includes(seller.toLowerCase())
        )
      );
    }
    
    return filtered;
  };

  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];
    return applyFilters(data);
  }, [data, activeLocation, filters]);

  const discountMetrics = useMemo((): MetricCardData[] => {
    const totalGrossRevenue = filteredData.reduce((sum, item) => sum + (item.grossRevenue || 0), 0);
    const totalNetRevenue = filteredData.reduce((sum, item) => sum + (item.netRevenue || 0), 0);
    const totalDiscounts = filteredData.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    const discountedTransactions = filteredData.filter(item => (item.discountAmount || 0) > 0).length;
    const totalTransactions = filteredData.length;
    
    const avgGrossDiscountPercent = discountedTransactions > 0 
      ? filteredData.filter(item => (item.discountAmount || 0) > 0)
          .reduce((sum, item) => sum + (item.grossDiscountPercent || 0), 0) / discountedTransactions 
      : 0;
      
    const avgNetDiscountPercent = discountedTransactions > 0 
      ? filteredData.filter(item => (item.discountAmount || 0) > 0)
          .reduce((sum, item) => sum + (item.netDiscountPercent || 0), 0) / discountedTransactions 
      : 0;
      
    const discountPenetration = totalTransactions > 0 ? (discountedTransactions / totalTransactions) * 100 : 0;
    const avgDiscountPerTransaction = discountedTransactions > 0 ? totalDiscounts / discountedTransactions : 0;
    const discountRate = totalGrossRevenue > 0 ? (totalDiscounts / totalGrossRevenue) * 100 : 0;

    return [
      {
        title: 'Total Discounts Given',
        value: formatCurrency(totalDiscounts),
        change: -8.2,
        description: 'Total discount amount provided to customers',
        calculation: 'Sum of all discount amounts',
        icon: 'trending-down',
        rawValue: totalDiscounts
      },
      {
        title: 'Discount Rate',
        value: `${discountRate.toFixed(1)}%`,
        change: -3.1,
        description: 'Percentage of gross revenue given as discounts',
        calculation: 'Total Discounts / Gross Revenue × 100',
        icon: 'percent',
        rawValue: discountRate
      },
      {
        title: 'Avg Gross Discount %',
        value: `${avgGrossDiscountPercent.toFixed(1)}%`,
        change: -2.1,
        description: 'Average gross discount percentage per discounted transaction',
        calculation: 'Average of gross discount percentages',
        icon: 'percent',
        rawValue: avgGrossDiscountPercent
      },
      {
        title: 'Avg Net Discount %',
        value: `${avgNetDiscountPercent.toFixed(1)}%`,
        change: -1.8,
        description: 'Average net discount percentage per discounted transaction',
        calculation: 'Average of net discount percentages',
        icon: 'percent',
        rawValue: avgNetDiscountPercent
      },
      {
        title: 'Discounted Transactions',
        value: formatNumber(discountedTransactions),
        change: 5.7,
        description: 'Number of transactions with discounts applied',
        calculation: 'Count of transactions with discount > 0',
        icon: 'transactions',
        rawValue: discountedTransactions
      },
      {
        title: 'Discount Penetration',
        value: `${discountPenetration.toFixed(1)}%`,
        change: 4.3,
        description: 'Percentage of transactions that received discounts',
        calculation: 'Discounted Transactions / Total Transactions × 100',
        icon: 'percent',
        rawValue: discountPenetration
      },
      {
        title: 'Avg Discount Amount',
        value: formatCurrency(avgDiscountPerTransaction),
        change: -1.8,
        description: 'Average discount amount per discounted transaction',
        calculation: 'Total Discounts / Discounted Transactions',
        icon: 'auv',
        rawValue: avgDiscountPerTransaction
      },
      {
        title: 'Revenue Impact',
        value: formatCurrency(totalNetRevenue),
        change: 8.9,
        description: 'Net revenue after discount deductions',
        calculation: 'Gross Revenue - Total Discounts',
        icon: 'net',
        rawValue: totalNetRevenue
      }
    ];
  }, [filteredData]);

  const getTopDiscountedProducts = () => {
    const productDiscounts = filteredData
      .filter(item => (item.discountAmount || 0) > 0)
      .reduce((acc, item) => {
        const product = item.cleanedProduct || 'Unknown Product';
        if (!acc[product]) {
          acc[product] = {
            product,
            totalDiscount: 0,
            transactions: 0,
            avgDiscount: 0,
            totalGrossRevenue: 0,
            totalNetRevenue: 0,
            avgGrossDiscountPercent: 0
          };
        }
        acc[product].totalDiscount += item.discountAmount || 0;
        acc[product].transactions += 1;
        acc[product].totalGrossRevenue += item.grossRevenue || 0;
        acc[product].totalNetRevenue += item.netRevenue || 0;
        acc[product].avgGrossDiscountPercent += item.grossDiscountPercent || 0;
        return acc;
      }, {} as Record<string, any>);

    return Object.values(productDiscounts)
      .map((item: any) => ({
        ...item,
        avgDiscount: item.totalDiscount / item.transactions,
        discountRate: item.totalGrossRevenue > 0 ? (item.totalDiscount / item.totalGrossRevenue) * 100 : 0,
        avgGrossDiscountPercent: item.avgGrossDiscountPercent / item.transactions
      }))
      .sort((a, b) => b.totalDiscount - a.totalDiscount)
      .slice(0, 10);
  };

  const getDiscountTrends = () => {
    const monthlyData = filteredData
      .filter(item => (item.discountAmount || 0) > 0)
      .reduce((acc, item) => {
        if (!item.paymentDate) return acc;
        
        // Parse DD/MM/YYYY format
        const ddmmyyyy = item.paymentDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (ddmmyyyy) {
          const [, day, month, year] = ddmmyyyy;
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          
          if (!acc[monthKey]) {
            acc[monthKey] = {
              month: monthKey,
              totalDiscounts: 0,
              transactions: 0,
              grossRevenue: 0,
              netRevenue: 0
            };
          }
          
          acc[monthKey].totalDiscounts += item.discountAmount || 0;
          acc[monthKey].transactions += 1;
          acc[monthKey].grossRevenue += item.grossRevenue || 0;
          acc[monthKey].netRevenue += item.netRevenue || 0;
        }
        return acc;
      }, {} as Record<string, any>);

    return Object.values(monthlyData)
      .map((item: any) => ({
        ...item,
        avgDiscount: item.totalDiscounts / item.transactions,
        discountRate: item.grossRevenue > 0 ? (item.totalDiscounts / item.grossRevenue) * 100 : 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));
  };

  const resetFilters = () => {
    setFilters({
      dateRange: {
        start: '2025-03-01',
        end: '2025-05-31'
      },
      location: [],
      category: [],
      product: [],
      soldBy: [],
      paymentMethod: []
    });
  };

  const handleMetricClick = (metric: MetricCardData) => {
    setDrillDownData(metric);
    setDrillDownType('metric');
  };

  const handleTableRowClick = (row: any) => {
    setDrillDownData(row);
    setDrillDownType('product');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-orange-50 flex items-center justify-center">
        <Card className="p-8 bg-white/80 backdrop-blur-sm shadow-xl border-0">
          <CardContent className="flex items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-red-600" />
            <div>
              <p className="text-lg font-semibold text-slate-800">Loading Discount Analytics</p>
              <p className="text-sm text-slate-600">Analyzing discount patterns and revenue impact...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="p-8 bg-white/90 backdrop-blur-sm shadow-xl max-w-md border-0">
          <CardContent className="text-center space-y-4">
            <RefreshCw className="w-12 h-12 text-red-600 mx-auto" />
            <div>
              <p className="text-lg font-semibold text-slate-800">Connection Error</p>
              <p className="text-sm text-slate-600 mt-2">{error}</p>
            </div>
            <Button 
              onClick={refetch} 
              className="gap-2 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const topDiscountedProducts = getTopDiscountedProducts();
  const discountTrends = getDiscountTrends();

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-red-50/30 to-orange-50/20", isDarkMode && "dark")}>
      {/* Enhanced Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-red-900/90 to-orange-900/80">
        <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-orange-600/20 to-red-600/20" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,_rgba(239,68,68,0.3),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(251,146,60,0.2),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,_rgba(220,38,38,0.2),_transparent_50%)]" />
        </div>
        
        <div className="relative px-8 py-16">
          <div className="max-w-7xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
              <Tag className="w-5 h-5 text-red-300" />
              <span className="font-semibold text-white">Discount Analytics</span>
            </div>
            
            <h1 className="text-6xl md:text-7xl font-black bg-gradient-to-r from-white via-red-100 to-orange-200 bg-clip-text text-transparent">
              Discounts & Promotions
            </h1>
            
            <p className="text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
              Comprehensive analysis of discount strategies, promotional effectiveness, and revenue impact across all studio locations
            </p>
            
            {/* Key Discount Insights */}
            {discountMetrics.length > 0 && (
              <div className="flex items-center justify-center gap-12 mt-12">
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {discountMetrics[0]?.value || '₹0'}
                  </div>
                  <div className="text-sm text-slate-300 font-medium">Total Discounts</div>
                </div>
                <div className="w-px h-16 bg-white/20" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {discountMetrics[1]?.value || '0%'}
                  </div>
                  <div className="text-sm text-slate-300 font-medium">Discount Rate</div>
                </div>
                <div className="w-px h-16 bg-white/20" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {discountMetrics[5]?.value || '0%'}
                  </div>
                  <div className="text-sm text-slate-300 font-medium">Penetration Rate</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <ThemeSelector 
          currentTheme={currentTheme} 
          isDarkMode={isDarkMode} 
          onThemeChange={setCurrentTheme} 
          onModeChange={setIsDarkMode} 
        />

        <Tabs value={activeLocation} onValueChange={setActiveLocation} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-slate-100 via-white to-slate-100 p-2 rounded-2xl shadow-lg">
            {locations.map(location => (
              <TabsTrigger 
                key={location.id} 
                value={location.id} 
                className={cn(
                  "relative overflow-hidden rounded-xl px-8 py-4 font-semibold text-sm transition-all duration-500",
                  "data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-orange-600",
                  "data-[state=active]:text-white data-[state=active]:shadow-xl data-[state=active]:scale-105",
                  "hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:scale-102",
                  "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <div className="text-center">
                    <div className="font-bold">{location.name.split(',')[0]}</div>
                    <div className="text-xs opacity-80">{location.name.split(',')[1]?.trim()}</div>
                  </div>
                </span>
                {activeLocation === location.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-red-400/20 to-orange-400/20 animate-pulse" />
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          {locations.map(location => (
            <TabsContent key={location.id} value={location.id} className="space-y-8 mt-8">
              <AutoCloseFilterSection 
                filters={filters} 
                onFiltersChange={setFilters} 
                onReset={resetFilters} 
              />

              {/* Enhanced Metric Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {discountMetrics.map((metric, index) => (
                  <div 
                    key={metric.title} 
                    className="animate-fade-in" 
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <MetricCard 
                      data={metric} 
                      delay={index * 100} 
                      onClick={() => handleMetricClick(metric)} 
                    />
                  </div>
                ))}
              </div>

              {/* Top/Bottom Lists */}
              <DiscountTopBottomLists 
                data={filteredData.filter(item => (item.discountAmount || 0) >= 0)} 
                onItemClick={handleTableRowClick} 
              />

              {/* Enhanced Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InteractiveChart 
                  title="Discount Impact on Revenue" 
                  data={filteredData.filter(item => (item.discountAmount || 0) > 0)} 
                  type="revenue" 
                />
                <InteractiveChart 
                  title="Discount Penetration by Category" 
                  data={filteredData.filter(item => (item.discountAmount || 0) > 0)} 
                  type="performance" 
                />
              </div>

              {/* Enhanced Data Tables and Analysis */}
              <div className="space-y-8">
                <DiscountMonthOnMonthTable 
                  data={filteredData.filter(item => (item.discountAmount || 0) >= 0)} 
                  filters={filters} 
                  onRowClick={handleTableRowClick} 
                />
                
                <DiscountYearOnYearTable 
                  data={filteredData.filter(item => (item.discountAmount || 0) >= 0)} 
                  filters={filters} 
                  onRowClick={handleTableRowClick} 
                />
                
                <DiscountRevenueAnalysis 
                  data={filteredData.filter(item => (item.discountAmount || 0) >= 0)} 
                />
                
                <DiscountImpactInsights 
                  data={filteredData.filter(item => (item.discountAmount || 0) >= 0)} 
                />
                
                <DataTable 
                  title="Monthly Discount Performance Analysis" 
                  data={filteredData.filter(item => (item.discountAmount || 0) > 0)} 
                  type="monthly" 
                  filters={filters} 
                  onRowClick={handleTableRowClick} 
                />
                
                <DataTable 
                  title="Product-wise Discount Breakdown" 
                  data={filteredData.filter(item => (item.discountAmount || 0) > 0)} 
                  type="product" 
                  filters={filters} 
                  onRowClick={handleTableRowClick} 
                />
                
                <DataTable 
                  title="Category Discount Analysis" 
                  data={filteredData.filter(item => (item.discountAmount || 0) > 0)} 
                  type="category" 
                  filters={filters} 
                  onRowClick={handleTableRowClick} 
                />
                
                <DataTable 
                  title="Staff Discount Distribution" 
                  data={filteredData.filter(item => (item.discountAmount || 0) > 0)} 
                  type="yearly" 
                  filters={filters} 
                  onRowClick={handleTableRowClick} 
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <DrillDownModal 
          isOpen={!!drillDownData} 
          onClose={() => setDrillDownData(null)} 
          data={drillDownData} 
          type={drillDownType} 
        />
      </div>
    </div>
  );
};
