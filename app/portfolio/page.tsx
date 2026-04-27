'use client';
import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import SpaceBackground from '../components/SpaceBackground/SpaceBackground';
import PortfolioPage from '../components/Portfolio/PortfolioPage';
import '../dashboard/dashboard.css';

export default function PortfolioRoute() {
  return (
    <div className="db-root">
      <SpaceBackground />
      <DashboardHeader />
      <div className="db-dashboard">
        <PortfolioPage />
      </div>
    </div>
  );
}
