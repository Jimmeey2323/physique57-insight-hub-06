
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { TrendingUp, TrendingDown, Users, ShoppingCart, Calendar, MapPin, BarChart3, DollarSign, Activity } from 'lucide-react';

interface DrillDownModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: any;
  type: 'metric' | 'product' | 'category' | 'member';
}

export const DrillDownModal: React.FC<DrillDownModalProps> = ({
  isOpen,
  onClose,
  data,
  type
}) => {
  if (!data) return null;

  // Helper function to safely convert to number
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  const renderMetricDetails = () => {
    const breakdown = data.breakdown || {};
    const currentValue = data.rawValue || 0;
    const change = data.change || 0;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{data.value}</div>
              <div className="text-sm text-blue-600">Current Value</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-700">
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </div>
              <div className="text-sm text-green-600">Growth Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">
                {formatCurrency((currentValue * (100 - Math.abs(change))) / 100)}
              </div>
              <div className="text-sm text-purple-600">Previous Period</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">
                {formatCurrency(currentValue * 1.15)}
              </div>
              <div className="text-sm text-orange-600">Target</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Performance Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.title === 'Gross Revenue' && (
                <>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Net Revenue</span>
                    <span className="font-bold text-blue-600">{formatCurrency(breakdown.net || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">VAT Amount</span>
                    <span className="font-bold text-red-600">{formatCurrency(breakdown.vat || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Total Transactions</span>
                    <span className="font-bold text-purple-600">{formatNumber(breakdown.transactions || 0)}</span>
                  </div>
                </>
              )}
              
              {data.title === 'Total Transactions' && (
                <>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Total Revenue</span>
                    <span className="font-bold text-blue-600">{formatCurrency(breakdown.revenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Unique Members</span>
                    <span className="font-bold text-green-600">{formatNumber(breakdown.uniqueMembers || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Average Value</span>
                    <span className="font-bold text-purple-600">{formatCurrency(breakdown.avgValue || 0)}</span>
                  </div>
                </>
              )}

              {data.title === 'Average Ticket Value' && (
                <>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Total Revenue</span>
                    <span className="font-bold text-blue-600">{formatCurrency(breakdown.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Total Transactions</span>
                    <span className="font-bold text-green-600">{formatNumber(breakdown.totalTransactions || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Compare to AUV</span>
                    <span className="font-bold text-purple-600">{formatCurrency(breakdown.comparison || 0)}</span>
                  </div>
                </>
              )}

              {data.title === 'Unique Members' && (
                <>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Total Revenue</span>
                    <span className="font-bold text-blue-600">{formatCurrency(breakdown.totalRevenue || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Total Transactions</span>
                    <span className="font-bold text-green-600">{formatNumber(breakdown.totalTransactions || 0)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                    <span className="font-medium text-slate-700">Avg Spend per Member</span>
                    <span className="font-bold text-purple-600">{formatCurrency(breakdown.avgSpend || 0)}</span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                <span className="font-medium text-slate-700">Performance Score</span>
                <Badge className={`${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {change >= 15 ? 'Excellent' : change >= 5 ? 'Good' : change >= 0 ? 'Fair' : 'Needs Improvement'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <BarChart3 className="w-5 h-5" />
              Calculation & Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-indigo-700 space-y-2">
              <p>• <strong>Calculation:</strong> {data.calculation}</p>
              <p>• <strong>Current Value:</strong> {formatCurrency(currentValue)}</p>
              <p>• <strong>Growth Rate:</strong> {change > 0 ? '+' : ''}{change.toFixed(1)}%</p>
              <p>• <strong>Trend:</strong> {change >= 5 ? 'Strong upward trend' : change >= 0 ? 'Positive momentum' : 'Declining performance'}</p>
              <p>• <strong>Description:</strong> {data.description}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProductDetails = () => {
    const grossRevenue = safeNumber(data.grossRevenue || data.totalValue || data.totalCurrent, 0);
    const transactions = safeNumber(data.transactions || data.totalTransactions, 0);
    const uniqueMembers = safeNumber(data.uniqueMembers || data.totalCustomers, 0);
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Revenue</span>
              </div>
              <div className="text-xl font-bold text-blue-700">{formatCurrency(grossRevenue)}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Customers</span>
              </div>
              <div className="text-xl font-bold text-green-700">{formatNumber(uniqueMembers)}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Transactions</span>
              </div>
              <div className="text-xl font-bold text-purple-700">{formatNumber(transactions)}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Growth</span>
              </div>
              <div className="text-xl font-bold text-orange-700">
                {data.totalChange ? `${data.totalChange > 0 ? '+' : ''}${data.totalChange.toFixed(1)}%` : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="performance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>
          
          <TabsContent value="performance" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
              <CardHeader>
                <CardTitle className="text-slate-800">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-slate-600">Total Revenue</span>
                    <span className="font-bold text-blue-600">{formatCurrency(grossRevenue)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-slate-600">Average per Transaction</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(transactions > 0 ? grossRevenue / transactions : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-slate-600">Average per Customer</span>
                    <span className="font-bold text-purple-600">
                      {formatCurrency(uniqueMembers > 0 ? grossRevenue / uniqueMembers : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                    <span className="text-slate-600">Performance Rating</span>
                    <Badge className={`${grossRevenue > 50000 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                      {grossRevenue > 100000 ? 'Excellent' : grossRevenue > 50000 ? 'Good' : 'Average'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
              <CardHeader>
                <CardTitle className="text-slate-800">Monthly Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                {data.months ? (
                  <div className="space-y-3">
                    {Object.entries(data.months).map(([month, monthData]: [string, any]) => (
                      <div key={month} className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                        <span className="font-medium text-slate-800">{month}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-blue-600">{formatCurrency(monthData.current || 0)}</span>
                          <Badge className={`${monthData.change >= 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {monthData.change > 0 ? '+' : ''}{monthData.change?.toFixed(1) || 0}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-slate-600">No monthly data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100">
              <CardHeader>
                <CardTitle className="text-slate-800">Performance Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-slate-700">
                  <div className="p-3 bg-white rounded-lg border-l-4 border-blue-400">
                    <strong className="text-blue-600">Performance:</strong> 
                    {grossRevenue > 100000 
                      ? ' Exceptional performance with high revenue generation'
                      : grossRevenue > 50000 
                      ? ' Good performance showing steady growth'
                      : ' Moderate performance with room for improvement'
                    }
                  </div>
                  <div className="p-3 bg-white rounded-lg border-l-4 border-green-400">
                    <strong className="text-green-600">Customer Engagement:</strong> 
                    {uniqueMembers > 50 
                      ? ' Strong customer base with good engagement'
                      : uniqueMembers > 20 
                      ? ' Moderate customer engagement'
                      : ' Limited customer base - focus on acquisition'
                    }
                  </div>
                  <div className="p-3 bg-white rounded-lg border-l-4 border-purple-400">
                    <strong className="text-purple-600">Transaction Volume:</strong> 
                    {transactions > 100 
                      ? ' High transaction volume indicating strong sales activity'
                      : transactions > 50 
                      ? ' Moderate transaction activity'
                      : ' Low transaction volume - consider promotional strategies'
                    }
                  </div>
                  <div className="p-3 bg-white rounded-lg border-l-4 border-orange-400">
                    <strong className="text-orange-600">Recommendation:</strong> 
                    {data.totalChange && data.totalChange > 0 
                      ? ' Continue current strategies and consider scaling successful initiatives'
                      : ' Review pricing strategy and focus on customer retention programs'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-slate-50/50 to-white">
        <DialogHeader className="pb-4 border-b">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
            {type === 'metric' ? `${data.title} - Detailed Analysis` : `${data.name || data.trainer} - Performance Breakdown`}
          </DialogTitle>
          <p className="text-slate-600 mt-2">
            {type === 'metric' 
              ? 'Comprehensive performance analysis with real-time data insights'
              : 'Detailed breakdown of performance metrics and growth trends'
            }
          </p>
        </DialogHeader>
        
        <div className="pt-4">
          {type === 'metric' ? renderMetricDetails() : renderProductDetails()}
        </div>
      </DialogContent>
    </Dialog>
  );
};
