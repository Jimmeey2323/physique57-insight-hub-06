
import { useState, useEffect } from 'react';
import { NewClientData } from '@/types/dashboard';

const GOOGLE_CONFIG = {
  CLIENT_ID: "416630995185-g7b0fm679lb4p45p5lou070cqscaalaf.apps.googleusercontent.com",
  CLIENT_SECRET: "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",
  REFRESH_TOKEN: "1//0gT2uoYBlNdGXCgYIARAAGBASNwF-L9IrBK_ijYwpce6-TdqDfji4GxYuc4uxIBKasdgoZBPm-tu_EU0xS34cNirqfLgXbJ8_NMk",
  TOKEN_URL: "https://oauth2.googleapis.com/token"
};

const SPREADSHEET_ID = "1ms082PTG8lt566ndWBf687baIl-knERPL1r2v7-dPxg";

export const useNewClientData = () => {
  const [data, setData] = useState<NewClientData[]>([]);
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

  const fetchNewClientData = async () => {
    try {
      setLoading(true);
      const accessToken = await getAccessToken();
      
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/◉ New?alt=json`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch new client data');
      }

      const result = await response.json();
      const rows = result.values || [];
      
      if (rows.length < 2) {
        setData([]);
        return;
      }

      const newClientData: NewClientData[] = rows.slice(1).map((row: any[]) => ({
        memberId: row[0] || '',
        firstName: row[1] || '',
        lastName: row[2] || '',
        email: row[3] || '',
        phoneNumber: row[4] || '',
        firstVisitDate: row[5] || '',
        firstVisitEntityName: row[6] || '',
        firstVisitType: row[7] || '',
        firstVisitLocation: row[8] || '',
        paymentMethod: row[9] || '',
        membershipUsed: row[10] || '',
        homeLocation: row[11] || '',
        classNo: parseFloat(row[12]) || 0,
        trainerName: row[13] || '',
        isNew: row[14] || '',
        visitsPostTrial: parseFloat(row[15]) || 0,
        membershipsBoughtPostTrial: row[16] || '',
        purchaseCountPostTrial: parseFloat(row[17]) || 0,
        ltv: parseFloat(row[18]) || 0,
        retentionStatus: row[19] || '',
        conversionStatus: row[20] || '',
        period: row[21] || '',
        unique: row[22] || '',
        firstPurchase: row[23] || '',
        conversionSpan: parseFloat(row[24]) || 0,
      }));

      console.log('New client data loaded:', newClientData.length, 'records');
      setData(newClientData);
      setError(null);
    } catch (err) {
      console.error('Error fetching new client data:', err);
      setError('Failed to load new client data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNewClientData();
  }, []);

  return { data, loading, error, refetch: fetchNewClientData };
};
