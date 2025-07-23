
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { YearOnYearMetricType } from '@/types/dashboard';

interface YearOnYearMetricTabsProps {
  value: YearOnYearMetricType;
  onValueChange: (value: YearOnYearMetricType) => void;
  className?: string;
}

export const YearOnYearMetricTabs: React.FC<YearOnYearMetricTabsProps> = ({
  value,
  onValueChange,
  className = ""
}) => {
  return (
    <Tabs value={value} onValueChange={onValueChange} className={className}>
      <TabsList className="grid w-full grid-cols-5 lg:grid-cols-9 bg-white border border-gray-200 p-1 rounded-xl shadow-sm h-auto">
        <TabsTrigger
          value="revenue"
          className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          Revenue
        </TabsTrigger>
        <TabsTrigger
          value="transactions"
          className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          Transactions
        </TabsTrigger>
        <TabsTrigger
          value="members"
          className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          Members
        </TabsTrigger>
        <TabsTrigger
          value="units"
          className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          Units
        </TabsTrigger>
        <TabsTrigger
          value="atv"
          className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          ATV
        </TabsTrigger>
        <TabsTrigger
          value="auv"
          className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          AUV
        </TabsTrigger>
        <TabsTrigger
          value="asv"
          className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          ASV
        </TabsTrigger>
        <TabsTrigger
          value="upt"
          className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          UPT
        </TabsTrigger>
        <TabsTrigger
          value="vat"
          className="text-xs px-2 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
        >
          VAT
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
