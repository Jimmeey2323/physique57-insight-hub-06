import React, { useEffect } from 'react';
import { SectionLayout } from '@/components/layout/SectionLayout';
import { TrainerPerformanceSection } from '@/components/dashboard/TrainerPerformanceSection';
import { RefinedLoader } from '@/components/ui/RefinedLoader';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, UserCheck } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
const TrainerPerformance = () => {
  const {
    isLoading
  } = usePayrollData();
  const {
    isLoading: globalLoading,
    setLoading
  } = useGlobalLoading();
  const navigate = useNavigate();
  useEffect(() => {
    setLoading(isLoading, 'Analyzing trainer performance metrics and insights...');
  }, [isLoading, setLoading]);
  if (globalLoading) {
    return <RefinedLoader subtitle="Analyzing trainer performance metrics and insights..." />;
  }
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-purple-900 to-indigo-900">
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-6 py-16">
          {/* Dashboard Button - Top Left */}
          <div className="absolute top-6 left-6">
            <Button onClick={() => navigate('/')} variant="outline" size="sm" className="gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200">
              <Home className="w-4 h-4" />
              Dashboard
            </Button>
          </div>

          <div className="text-center space-y-4 pt-8">
            <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 border border-white/20 animate-fade-in-up">
              <UserCheck className="w-5 h-5 bg-transparent border-white text-yellow-400 " />
              <span className="font-medium text-gray-50 uppercase ">Trainer Analytics</span>
            </div>
            
            <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-teal-100 to-cyan-100 bg-clip-text text-transparent animate-fade-in-up delay-200 md:text-7xl">
              Trainer Performance & Analytics
            </h1>
            
            <p className="text-xl text-teal-100 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-300">
              Instructor productivity analysis and engagement metrics across all studio locations
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <main className="space-y-8">
          <TrainerPerformanceSection />
        </main>
      </div>
      
      <Footer />

      <style>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
    </div>;
};
export default TrainerPerformance;