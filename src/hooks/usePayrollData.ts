
import { useQuery } from '@tanstack/react-query';

export interface PayrollData {
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  location: string;
  cycleSessions: number;
  emptyCycleSessions: number;
  nonEmptyCycleSessions: number;
  cycleCustomers: number;
  cyclePaid: number;
  barreSessions: number;
  emptyBarreSessions: number;
  nonEmptyBarreSessions: number;
  barreCustomers: number;
  barrePaid: number;
  totalSessions: number;
  totalEmptySessions: number;
  totalNonEmptySessions: number;
  totalCustomers: number;
  totalPaid: number;
  monthYear: string;
  unique: string;
  new: number;
  retained: number;
  retention: string;
  converted: number;
  conversion: string;
  classAverageInclEmpty: number;
  classAverageExclEmpty: number;
}

const GOOGLE_CONFIG = {
  CLIENT_ID: "416630995185-g7b0fm679lb4p45p5lou070cqscaalaf.apps.googleusercontent.com",
  CLIENT_SECRET: "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",
  REFRESH_TOKEN: "1//0gT2uoYBlNdGXCgYIARAAGBASNwF-L9IrBK_ijYwpce6-TdqDfji4GxYuc4uxIBKasdgoZBPm-tu_EU0xS34cNirqfLgXbJ8_NMk",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = "1ms082PTG8lt566ndWBf687baIl-knERPL1r2v7-dPxg";

const getAccessToken = async () => {
  try {
    const response = await fetch(GOOGLE_CONFIG.TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CONFIG.CLIENT_ID,
        client_secret: GOOGLE_CONFIG.CLIENT_SECRET,
        refresh_token: GOOGLE_CONFIG.REFRESH_TOKEN,
        grant_type: 'refresh_token',
      }),
    });

    const tokenData = await response.json();
    return tokenData.access_token;
  } catch (error) {
    console.error('Error getting access token:', error);
    throw error;
  }
};

const fetchPayrollData = async (): Promise<PayrollData[]> => {
  try {
    console.log('Fetching payroll data from Google Sheets...');
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/◉ Payroll?alt=json`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch payroll data: ${response.status}`);
    }

    const result = await response.json();
    const rows = result.values || [];
    
    if (rows.length < 2) {
      console.log('No payroll data found');
      return [];
    }

    const headers = rows[0];
    console.log('Payroll data headers:', headers);
    
    const payrollData: PayrollData[] = rows.slice(1).map((row: any[], index: number) => {
      try {
        return {
          teacherId: String(row[0] || ''),
          teacherName: String(row[1] || ''),
          teacherEmail: String(row[2] || ''),
          location: String(row[3] || ''),
          cycleSessions: parseInt(row[4]) || 0,
          emptyCycleSessions: parseInt(row[5]) || 0,
          nonEmptyCycleSessions: parseInt(row[6]) || 0,
          cycleCustomers: parseInt(row[7]) || 0,
          cyclePaid: parseFloat(String(row[8]).replace(/,/g, '')) || 0,
          barreSessions: parseInt(row[9]) || 0,
          emptyBarreSessions: parseInt(row[10]) || 0,
          nonEmptyBarreSessions: parseInt(row[11]) || 0,
          barreCustomers: parseInt(row[12]) || 0,
          barrePaid: parseFloat(String(row[13]).replace(/,/g, '')) || 0,
          totalSessions: parseInt(row[14]) || 0,
          totalEmptySessions: parseInt(row[15]) || 0,
          totalNonEmptySessions: parseInt(row[16]) || 0,
          totalCustomers: parseInt(row[17]) || 0,
          totalPaid: parseFloat(String(row[18]).replace(/,/g, '')) || 0,
          monthYear: String(row[19] || ''),
          unique: String(row[20] || ''),
          new: parseInt(row[21]) || 0,
          retained: parseInt(row[22]) || 0,
          retention: String(row[23] || '0%'),
          converted: parseInt(row[24]) || 0,
          conversion: String(row[25] || '0%'),
          classAverageInclEmpty: parseFloat(row[26]) || 0,
          classAverageExclEmpty: parseFloat(row[27]) || 0,
        };
      } catch (error) {
        console.error(`Error parsing payroll data row ${index + 2}:`, error, row);
        return null;
      }
    }).filter((item): item is PayrollData => item !== null);

    console.log(`Successfully parsed ${payrollData.length} payroll records`);
    return payrollData;
  } catch (error) {
    console.error('Error fetching payroll data:', error);
    throw error;
  }
};

export const usePayrollData = () => {
  return useQuery({
    queryKey: ['payroll-data'],
    queryFn: fetchPayrollData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
