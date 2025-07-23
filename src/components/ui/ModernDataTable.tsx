
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ModernDataTableProps {
  headers: string[];
  data: any[];
  title?: string;
  className?: string;
}

export const ModernDataTable: React.FC<ModernDataTableProps> = ({
  headers,
  data,
  title,
  className
}) => {
  const formatCellValue = (value: any) => {
    if (typeof value === 'number') {
      if (value > 1000) {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      return value.toLocaleString();
    }
    
    if (typeof value === 'string' && value.includes('%')) {
      return <Badge variant="secondary" className="font-medium">{value}</Badge>;
    }
    
    return value || '-';
  };

  const getCellClassName = (value: any) => {
    if (typeof value === 'number') {
      if (value > 0) return 'text-green-600 font-semibold';
      if (value < 0) return 'text-red-600 font-semibold';
    }
    return 'text-slate-700';
  };

  return (
    <Card className={cn("bg-white shadow-xl border-0 overflow-hidden", className)}>
      {title && (
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        </div>
      )}
      
      <div className="overflow-auto max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
              {headers.map((header, index) => (
                <TableHead 
                  key={index} 
                  className="font-bold text-slate-700 py-4 px-6 text-sm uppercase tracking-wide"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, rowIndex) => (
              <TableRow 
                key={rowIndex} 
                className="hover:bg-slate-50/50 transition-colors duration-200 border-b border-slate-100"
              >
                {headers.map((header, cellIndex) => (
                  <TableCell 
                    key={cellIndex} 
                    className={cn(
                      "py-4 px-6 text-sm",
                      getCellClassName(row[header])
                    )}
                  >
                    {formatCellValue(row[header])}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
};
