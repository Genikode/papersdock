import { TrendingUp } from 'lucide-react';

export default function DashboardBanner() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl p-6 flex justify-between items-center mb-6 shadow-sm">
      {/* Left text */}
      <div>
        <h2 className="text-2xl font-bold">Welcome back, John!</h2>
        <p className="text-white/80 mt-1 text-sm">
          You have <span className="font-semibold">5 new papers</span> in your research areas and <span className="font-semibold">12 pending reviews</span>.
        </p>
      </div>

      {/* Right progress box */}
      <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl flex flex-col items-start w-48">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp size={20} />
          <span className="text-lg font-semibold">94%</span>
        </div>
        <p className="text-sm text-white/80 mb-2">Research Progress</p>
        <div className="w-full h-2 bg-white/30 rounded-full overflow-hidden">
          <div className="h-full bg-white w-[94%] rounded-full" />
        </div>
      </div>
    </div>
  );
}
