
import { useState, useEffect } from 'react';
import { SalesData } from '@/types/dashboard';

const GOOGLE_CONFIG = {
  CLIENT_ID: "416630995185-g7b0fm679lb4p45p5lou070cqscaalaf.apps.googleusercontent.com",
  CLIENT_SECRET: "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",
  REFRESH_TOKEN: "1//0gT2uoYBlNdGXCgYIARAAGBASNwF-L9IrBK_ijYwpce6-TdqDfji4GxYuc4uxIBKasdgoZBPm-tu_EU0xS34cNirqfLgXbJ8_NMk",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = "1ms082PTG8lt566ndWBf687baIl-knERPL1r2v7-dPxg";

export const useDiscountsData = () => {
  const [data, setData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const fetchDiscountsData = async () => {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/◉ Sales?alt=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch sales data');
      }

      const result = await response.json();
      const rows = result.values || [];
      
      if (rows.length < 2) {
        setData([]);
        return;
      }

      // Parse all columns according to the sheet structure
      const salesData: SalesData[] = rows.slice(1).map((row: any[]) => ({
        memberId: row[0] || '',
        customerName: row[1] || '',
        customerEmail: row[2] || '',
        payingMemberId: row[3] || '',
        saleItemId: row[4] || '',
        paymentCategory: row[5] || '',
        membershipType: row[6] || '',
        paymentDate: row[7] || '',
        paymentValue: parseFloat(row[8]) || 0,
        paidInMoneyCredits: parseFloat(row[9]) || 0,
        paymentVAT: parseFloat(row[10]) || 0,
        paymentItem: row[11] || '',
        paymentStatus: row[12] || '',
        paymentMethod: row[13] || '',
        paymentTransactionId: row[14] || '',
        stripeToken: row[15] || '',
        soldBy: row[16] || '',
        saleReference: row[17] || '',
        calculatedLocation: row[18] || '',
        cleanedProduct: row[19] || '',
        cleanedCategory: row[20] || '',
        // Discount-specific fields
        discountAmount: parseFloat(row[21]) || 0,
        grossRevenue: parseFloat(row[22]) || 0,
        preTaxMrp: parseFloat(row[23]) || 0,
        vat: parseFloat(row[24]) || 0,
        netRevenue: parseFloat(row[25]) || 0,
        postTaxMrp: parseFloat(row[26]) || 0,
        grossDiscountPercent: parseFloat(row[27]?.replace('%', '')) || 0,
        netDiscountPercent: parseFloat(row[28]?.replace('%', '')) || 0,
      }));

      console.log('Sales data loaded for discounts:', salesData.length, 'records');
      console.log('Sample discount data:', salesData.slice(0, 3).map(item => ({
        product: item.cleanedProduct,
        discountAmount: item.discountAmount,
        grossDiscountPercent: item.grossDiscountPercent,
        netDiscountPercent: item.netDiscountPercent,
        grossRevenue: item.grossRevenue,
        netRevenue: item.netRevenue
      })));
      
      setData(salesData);
      setError(null);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscountsData();
  }, []);

  return { data, loading, error, refetch: fetchDiscountsData };
};
