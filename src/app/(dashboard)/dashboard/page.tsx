import DashboardBanner from "@/components/DashboardBanner";
import DashboardStats from "@/components/DashboardStats";


export default function Dashboard() {
  return (

    <main className="bg-[#F9FAFB] text-gray-800">
<DashboardBanner />
<DashboardStats />
    </main>
  );
}