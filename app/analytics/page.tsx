'use client';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import SpaceBackground from '../components/SpaceBackground/SpaceBackground';
import AnalyticsPage from '../components/Analytics/AnalyticsPage';
import '../dashboard/dashboard.css';

export default function AnalyticsRoute() {
  return (
    <div className="db-root">
      <SpaceBackground />
      <DashboardHeader />
      <div className="db-dashboard">
        <AnalyticsPage />
      </div>
    </div>
  );
}
