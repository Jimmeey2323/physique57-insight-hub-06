import React from 'react';
import { SectionLayout } from '@/components/layout/SectionLayout';
import ExecutiveSummarySection from '@/components/dashboard/ExecutiveSummarySection';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, BarChart3 } from 'lucide-react';
import { Footer } from '@/components/ui/footer';
const ExecutiveSummary = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50/30 to-pink-50/20">
      {/* Simple Header Section - No Animation */}
      <div className="bg-gradient-to-r from-slate-600 via-gray-600 to-slate-700 text-white">
        <div className="px-8 py-8 bg-gradient-to-br indigo-700 to-purple-900 bg-pink-600">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button onClick={() => navigate('/')} variant="outline" size="sm" className="gap-2 bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 hover:border-white/30 transition-all duration-200">
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </div>
            
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-full px-6 py-2 border border-white/20">
                <BarChart3 className="w-5 h-5" />
                <span className="font-medium">Executive Overview</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-slate-100 to-gray-100 bg-clip-text text-transparent">
                Executive Summary
              </h1>
              
              <p className="text-lg text-slate-100 max-w-2xl mx-auto leading-relaxed">
                Strategic performance overview and key business metrics across all operations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <ExecutiveSummarySection />
      </div>
      
      <Footer />
    </div>;
};
export default ExecutiveSummary;