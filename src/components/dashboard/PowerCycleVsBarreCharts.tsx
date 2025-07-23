
import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { SessionData } from '@/types/dashboard';
import { designTokens } from '@/utils/designTokens';

interface PowerCycleVsBarreChartsProps {
  powerCycleData: SessionData[];
  barreData: SessionData[];
}

// Memoized chart components for better performance
const AttendanceChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis 
        dataKey="month" 
        tick={{ fontSize: 12 }}
        axisLine={{ stroke: '#e5e5e5' }}
      />
      <YAxis 
        tick={{ fontSize: 12 }}
        axisLine={{ stroke: '#e5e5e5' }}
      />
      <Tooltip 
        formatter={(value, name) => [
          `${value} attendees`,
          name === 'powerCycle' ? 'PowerCycle' : 'Barre'
        ]}
        labelFormatter={(label) => `Month: ${label}`}
        contentStyle={{
          backgroundColor: 'white',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      />
      <Legend />
      <Bar 
        dataKey="powerCycle" 
        fill="#3B82F6" 
        name="PowerCycle"
        radius={[2, 2, 0, 0]}
      />
      <Bar 
        dataKey="barre" 
        fill="#10B981" 
        name="Barre"
        radius={[2, 2, 0, 0]}
      />
    </BarChart>
  </ResponsiveContainer>
));

const FillRateChart = memo(({ data }: { data: any[] }) => (
  <ResponsiveContainer width="100%" height={300}>
    <LineChart data={data}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis 
        dataKey="month" 
        tick={{ fontSize: 12 }}
        axisLine={{ stroke: '#e5e5e5' }}
      />
      <YAxis 
        tick={{ fontSize: 12 }}
        axisLine={{ stroke: '#e5e5e5' }}
      />
      <Tooltip 
        formatter={(value, name) => [
          `${Math.round(Number(value))}%`,
          name === 'powerCycleFill' ? 'PowerCycle Fill Rate' : 'Barre Fill Rate'
        ]}
        labelFormatter={(label) => `Month: ${label}`}
        contentStyle={{
          backgroundColor: 'white',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      />
      <Legend />
      <Line 
        type="monotone" 
        dataKey="powerCycleFill" 
        stroke="#3B82F6" 
        name="PowerCycle Fill %" 
        strokeWidth={3}
        dot={{ r: 6, fill: '#3B82F6' }}
        activeDot={{ r: 8, fill: '#1D4ED8' }}
      />
      <Line 
        type="monotone" 
        dataKey="barreFill" 
        stroke="#10B981" 
        name="Barre Fill %" 
        strokeWidth={3}
        dot={{ r: 6, fill: '#10B981' }}
        activeDot={{ r: 8, fill: '#059669' }}
      />
    </LineChart>
  </ResponsiveContainer>
));

export const PowerCycleVsBarreCharts: React.FC<PowerCycleVsBarreChartsProps> = memo(({
  powerCycleData,
  barreData
}) => {
  // Memoized data processing for better performance
  const monthlyData = useMemo(() => {
    const months: Record<string, { 
      month: string; 
      powerCycle: number; 
      barre: number; 
      powerCycleFill: number; 
      barreFill: number;
      powerCycleCapacity: number;
      barreCapacity: number;
      powerCycleCount: number;
      barreCount: number;
    }> = {};
    
    // Process PowerCycle data
    powerCycleData.forEach(session => {
      const monthKey = session.date.substring(0, 7);
      if (!months[monthKey]) {
        months[monthKey] = { 
          month: monthKey, 
          powerCycle: 0, 
          barre: 0, 
          powerCycleFill: 0, 
          barreFill: 0,
          powerCycleCapacity: 0,
          barreCapacity: 0,
          powerCycleCount: 0,
          barreCount: 0
        };
      }
      
      months[monthKey].powerCycle += session.checkedIn;
      months[monthKey].powerCycleCapacity += session.capacity;
      months[monthKey].powerCycleCount += 1;
    });

    // Process Barre data
    barreData.forEach(session => {
      const monthKey = session.date.substring(0, 7);
      if (!months[monthKey]) {
        months[monthKey] = { 
          month: monthKey, 
          powerCycle: 0, 
          barre: 0, 
          powerCycleFill: 0, 
          barreFill: 0,
          powerCycleCapacity: 0,
          barreCapacity: 0,
          powerCycleCount: 0,
          barreCount: 0
        };
      }
      
      months[monthKey].barre += session.checkedIn;
      months[monthKey].barreCapacity += session.capacity;
      months[monthKey].barreCount += 1;
    });

    // Calculate fill percentages
    Object.values(months).forEach(month => {
      month.powerCycleFill = month.powerCycleCapacity > 0 
        ? (month.powerCycle / month.powerCycleCapacity) * 100 
        : 0;
      month.barreFill = month.barreCapacity > 0 
        ? (month.barre / month.barreCapacity) * 100 
        : 0;
    });
    
    return Object.values(months).sort((a, b) => b.month.localeCompare(a.month));
  }, [powerCycleData, barreData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className={`${designTokens.card.background} ${designTokens.card.shadow} ${designTokens.card.border}`}>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            Monthly Attendance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent className={designTokens.card.padding}>
          <AttendanceChart data={monthlyData} />
        </CardContent>
      </Card>

      <Card className={`${designTokens.card.background} ${designTokens.card.shadow} ${designTokens.card.border}`}>
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            Fill Rate Trends
          </CardTitle>
        </CardHeader>
        <CardContent className={designTokens.card.padding}>
          <FillRateChart data={monthlyData} />
        </CardContent>
      </Card>
    </div>
  );
});
