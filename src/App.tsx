import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { useBanCheck } from "@/hooks/useBanCheck";
import { useDailyLogin } from "@/hooks/useDailyLogin";
import BottomNav from "@/components/BottomNav";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import CreateRoomPage from "./pages/CreateRoomPage";
import RoomPage from "./pages/RoomPage";
import ProfilePage from "./pages/ProfilePage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AuthPage from "./pages/AuthPage";
import WalletPage from "./pages/WalletPage";
import NotificationsPage from "./pages/NotificationsPage";
import EventsPage from "./pages/EventsPage";
import SettingsPage from "./pages/SettingsPage";
import GamesPage from "./pages/GamesPage";
import GamePlayPage from "./pages/GamePlayPage";
import NotFound from "./pages/NotFound";

// Admin pages (reused in Owner Panel)
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminHosts from "./pages/admin/AdminHosts";
import AdminAgencies from "./pages/admin/AdminAgencies";
import AdminRooms from "./pages/admin/AdminRooms";
import AdminGifts from "./pages/admin/AdminGifts";
import AdminCoins from "./pages/admin/AdminCoins";
import AdminRecharge from "./pages/admin/AdminRecharge";
import AdminWithdrawals from "./pages/admin/AdminWithdrawals";
import AdminReports from "./pages/admin/AdminReports";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminLeaderboards from "./pages/admin/AdminLeaderboards";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminCompetitions from "./pages/admin/AdminCompetitions";
import AdminPromotions from "./pages/admin/AdminPromotions";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminLogs from "./pages/admin/AdminLogs";

// Admin layout (kept for backwards compatibility)
import AdminLayout from "./components/admin/AdminLayout";

// Agency pages
import AgencyLayout from "./components/agency/AgencyLayout";
import AgencyDashboard from "./pages/agency/AgencyDashboard";
import AgencyRecruit from "./pages/agency/AgencyRecruit";
import AgencyHosts from "./pages/agency/AgencyHosts";
import AgencyEarnings from "./pages/agency/AgencyEarnings";
import AgencyCommissions from "./pages/agency/AgencyCommissions";

// BizDev pages
import BizDevLayout from "./components/bizdev/BizDevLayout";
import BizDevDashboard from "./pages/bizdev/BizDevDashboard";
import BizDevPromotions from "./pages/bizdev/BizDevPromotions";
import BizDevCampaigns from "./pages/bizdev/BizDevCampaigns";
import BizDevPartnerships from "./pages/bizdev/BizDevPartnerships";
import BizDevEvents from "./pages/bizdev/BizDevEvents";
import BizDevRevenue from "./pages/bizdev/BizDevRevenue";

// Owner pages
import OwnerLayout from "./components/owner/OwnerLayout";
import OwnerDashboard from "./pages/owner/OwnerDashboard";
import OwnerAdmins from "./pages/owner/OwnerAdmins";
import OwnerAnalytics from "./pages/owner/OwnerAnalytics";
import OwnerRevenue from "./pages/owner/OwnerRevenue";
import OwnerSettings from "./pages/owner/OwnerSettings";
import OwnerRooms from "./pages/owner/OwnerRooms";
import OwnerSellerRecharges from "./pages/owner/OwnerSellerRecharges";
import OwnerGameSettings from "./pages/owner/OwnerGameSettings";
import OwnerProps from "./pages/owner/OwnerProps";
import OwnerSocial from "./pages/owner/OwnerSocial";
import OwnerUserIds from "./pages/owner/OwnerUserIds";
import OwnerBanners from "./pages/owner/OwnerBanners";
import OwnerPolicies from "./pages/owner/OwnerPolicies";
import OwnerBadges from "./pages/owner/OwnerBadges";
import OwnerTitles from "./pages/owner/OwnerTitles";
import PoliciesPage from "./pages/PoliciesPage";
import PublicProfilePage from "./pages/PublicProfilePage";
import FollowersPage from "./pages/FollowersPage";
import MessagesPage from "./pages/MessagesPage";
import MessageThreadPage from "./pages/MessageThreadPage";

import StorePage from "./pages/StorePage";
import MyPropsPage from "./pages/MyPropsPage";
import SocialPage from "./pages/SocialPage";
import MedalsPage from "./pages/MedalsPage";
import FamilyPage from "./pages/FamilyPage";
import LevelPage from "./pages/LevelPage";
import VIPPage from "./pages/VIPPage";
import ProfileSetupPage from "./pages/ProfileSetupPage";
import AgencyCenterPage from "./pages/AgencyCenterPage";

// Host Center pages
import HostLayout from "./components/host/HostLayout";
import HostDashboard from "./pages/host/HostDashboard";
import HostEarnings from "./pages/host/HostEarnings";
import HostGifts from "./pages/host/HostGifts";
import HostWithdrawals from "./pages/host/HostWithdrawals";
import HostRooms from "./pages/host/HostRooms";
import HostLevel from "./pages/host/HostLevel";

// Coins Seller pages
import CoinSellerLayout from "./components/seller/CoinSellerLayout";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerSendCoins from "./pages/seller/SellerSendCoins";
import SellerRecharges from "./pages/seller/SellerRecharges";
import SellerVerify from "./pages/seller/SellerVerify";
import SellerHistory from "./pages/seller/SellerHistory";
import SellerPaymentMethods from "./pages/seller/SellerPaymentMethods";
import SellerWalletSearch from "./pages/seller/SellerWalletSearch";
import SellerPackages from "./pages/seller/SellerPackages";
import SellerWallet from "./pages/seller/SellerWallet";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [setupDone, setSetupDone] = useState(false);
  useBanCheck();
  useDailyLogin();
  if (loading || profileLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  // First-time profile setup: if display_name is still the email prefix default
  if (profile && !setupDone && (!profile.display_name || profile.display_name === profile.email?.split('@')[0])) {
    return <ProfileSetupPage onComplete={() => setSetupDone(true)} />;
  }
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AdminLayout>{children}</AdminLayout></ProtectedRoute>
);

const AgencyRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><AgencyLayout>{children}</AgencyLayout></ProtectedRoute>
);

const BizDevRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><BizDevLayout>{children}</BizDevLayout></ProtectedRoute>
);

const OwnerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><OwnerLayout>{children}</OwnerLayout></ProtectedRoute>
);

const HostRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><HostLayout>{children}</HostLayout></ProtectedRoute>
);

const SellerRoute = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute><CoinSellerLayout>{children}</CoinSellerLayout></ProtectedRoute>
);

const AppRoutes = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen relative">
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />

        {/* Main app routes */}
        <Route path="/" element={<ProtectedRoute><div className="max-w-lg mx-auto"><HomePage /></div></ProtectedRoute>} />
        <Route path="/explore" element={<ProtectedRoute><div className="max-w-lg mx-auto"><ExplorePage /></div></ProtectedRoute>} />
        <Route path="/games" element={<ProtectedRoute><div className="max-w-lg mx-auto"><GamesPage /></div></ProtectedRoute>} />
        <Route path="/games/play" element={<ProtectedRoute><GamePlayPage /></ProtectedRoute>} />
        <Route path="/create" element={<ProtectedRoute><div className="max-w-lg mx-auto"><CreateRoomPage /></div></ProtectedRoute>} />
        <Route path="/room/:id" element={<ProtectedRoute><div className="max-w-lg mx-auto"><RoomPage /></div></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><div className="max-w-lg mx-auto"><ProfilePage /></div></ProtectedRoute>} />
        <Route path="/u/:userId" element={<ProtectedRoute><div className="max-w-lg mx-auto"><PublicProfilePage /></div></ProtectedRoute>} />
       <Route path="/followers" element={<ProtectedRoute><div className="max-w-lg mx-auto"><FollowersPage /></div></ProtectedRoute>} />
       <Route path="/followers/:userId" element={<ProtectedRoute><div className="max-w-lg mx-auto"><FollowersPage /></div></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><div className="max-w-lg mx-auto"><MessagesPage /></div></ProtectedRoute>} />
        <Route path="/messages/:userId" element={<ProtectedRoute><div className="max-w-lg mx-auto"><MessageThreadPage /></div></ProtectedRoute>} />
        <Route path="/leaderboard" element={<ProtectedRoute><div className="max-w-lg mx-auto"><LeaderboardPage /></div></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><div className="max-w-lg mx-auto"><WalletPage /></div></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><div className="max-w-lg mx-auto"><NotificationsPage /></div></ProtectedRoute>} />
        <Route path="/events" element={<ProtectedRoute><div className="max-w-lg mx-auto"><EventsPage /></div></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><div className="max-w-lg mx-auto"><SettingsPage /></div></ProtectedRoute>} />
        <Route path="/store" element={<ProtectedRoute><div className="max-w-lg mx-auto"><StorePage /></div></ProtectedRoute>} />
        <Route path="/my-props" element={<ProtectedRoute><div className="max-w-lg mx-auto"><MyPropsPage /></div></ProtectedRoute>} />
        <Route path="/social" element={<ProtectedRoute><div className="max-w-lg mx-auto"><SocialPage /></div></ProtectedRoute>} />
        <Route path="/medals" element={<ProtectedRoute><div className="max-w-lg mx-auto"><MedalsPage /></div></ProtectedRoute>} />
        <Route path="/family" element={<ProtectedRoute><div className="max-w-lg mx-auto"><FamilyPage /></div></ProtectedRoute>} />
        <Route path="/level" element={<ProtectedRoute><div className="max-w-lg mx-auto"><LevelPage /></div></ProtectedRoute>} />
        <Route path="/vip" element={<ProtectedRoute><div className="max-w-lg mx-auto"><VIPPage /></div></ProtectedRoute>} />
        <Route path="/agency-center" element={<ProtectedRoute><div className="max-w-lg mx-auto"><AgencyCenterPage /></div></ProtectedRoute>} />
        <Route path="/policies" element={<ProtectedRoute><div className="max-w-lg mx-auto"><PoliciesPage /></div></ProtectedRoute>} />

        {/* Admin routes (kept for backwards compat, redirects admins) */}
        <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
        <Route path="/admin/hosts" element={<AdminRoute><AdminHosts /></AdminRoute>} />
        <Route path="/admin/agencies" element={<AdminRoute><AdminAgencies /></AdminRoute>} />
        <Route path="/admin/rooms" element={<AdminRoute><AdminRooms /></AdminRoute>} />
        <Route path="/admin/gifts" element={<AdminRoute><AdminGifts /></AdminRoute>} />
        <Route path="/admin/coins" element={<AdminRoute><AdminCoins /></AdminRoute>} />
        <Route path="/admin/recharge" element={<AdminRoute><AdminRecharge /></AdminRoute>} />
        <Route path="/admin/withdrawals" element={<AdminRoute><AdminWithdrawals /></AdminRoute>} />
        <Route path="/admin/reports" element={<AdminRoute><AdminReports /></AdminRoute>} />
        <Route path="/admin/notifications" element={<AdminRoute><AdminNotifications /></AdminRoute>} />
        <Route path="/admin/leaderboards" element={<AdminRoute><AdminLeaderboards /></AdminRoute>} />
        <Route path="/admin/competitions" element={<AdminRoute><AdminCompetitions /></AdminRoute>} />
        <Route path="/admin/events" element={<AdminRoute><AdminEvents /></AdminRoute>} />
        <Route path="/admin/promotions" element={<AdminRoute><AdminPromotions /></AdminRoute>} />
        <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />
        <Route path="/admin/analytics" element={<AdminRoute><AdminAnalytics /></AdminRoute>} />
        <Route path="/admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />

        {/* Agency routes */}
        <Route path="/agency" element={<AgencyRoute><AgencyDashboard /></AgencyRoute>} />
        <Route path="/agency/recruit" element={<AgencyRoute><AgencyRecruit /></AgencyRoute>} />
        <Route path="/agency/hosts" element={<AgencyRoute><AgencyHosts /></AgencyRoute>} />
        <Route path="/agency/earnings" element={<AgencyRoute><AgencyEarnings /></AgencyRoute>} />
        <Route path="/agency/commissions" element={<AgencyRoute><AgencyCommissions /></AgencyRoute>} />

        {/* BizDev routes */}
        <Route path="/bizdev" element={<BizDevRoute><BizDevDashboard /></BizDevRoute>} />
        <Route path="/bizdev/promotions" element={<BizDevRoute><BizDevPromotions /></BizDevRoute>} />
        <Route path="/bizdev/campaigns" element={<BizDevRoute><BizDevCampaigns /></BizDevRoute>} />
        <Route path="/bizdev/partnerships" element={<BizDevRoute><BizDevPartnerships /></BizDevRoute>} />
        <Route path="/bizdev/events" element={<BizDevRoute><BizDevEvents /></BizDevRoute>} />
        <Route path="/bizdev/revenue" element={<BizDevRoute><BizDevRevenue /></BizDevRoute>} />

        {/* Owner routes - FULL admin features merged here */}
        <Route path="/owner" element={<OwnerRoute><OwnerDashboard /></OwnerRoute>} />
        <Route path="/owner/users" element={<OwnerRoute><AdminUsers /></OwnerRoute>} />
        <Route path="/owner/admins" element={<OwnerRoute><OwnerAdmins /></OwnerRoute>} />
        <Route path="/owner/hosts" element={<OwnerRoute><AdminHosts /></OwnerRoute>} />
        <Route path="/owner/agencies" element={<OwnerRoute><AdminAgencies /></OwnerRoute>} />
        <Route path="/owner/rooms" element={<OwnerRoute><OwnerRooms /></OwnerRoute>} />
        <Route path="/owner/gifts" element={<OwnerRoute><AdminGifts /></OwnerRoute>} />
        <Route path="/owner/coins" element={<OwnerRoute><AdminCoins /></OwnerRoute>} />
        <Route path="/owner/recharge" element={<OwnerRoute><AdminRecharge /></OwnerRoute>} />
        <Route path="/owner/withdrawals" element={<OwnerRoute><AdminWithdrawals /></OwnerRoute>} />
        <Route path="/owner/revenue" element={<OwnerRoute><OwnerRevenue /></OwnerRoute>} />
        <Route path="/owner/reports" element={<OwnerRoute><AdminReports /></OwnerRoute>} />
        <Route path="/owner/notifications" element={<OwnerRoute><AdminNotifications /></OwnerRoute>} />
        <Route path="/owner/leaderboards" element={<OwnerRoute><AdminLeaderboards /></OwnerRoute>} />
        <Route path="/owner/competitions" element={<OwnerRoute><AdminCompetitions /></OwnerRoute>} />
        <Route path="/owner/events" element={<OwnerRoute><AdminEvents /></OwnerRoute>} />
        <Route path="/owner/promotions" element={<OwnerRoute><AdminPromotions /></OwnerRoute>} />
        <Route path="/owner/settings" element={<OwnerRoute><OwnerSettings /></OwnerRoute>} />
        <Route path="/owner/analytics" element={<OwnerRoute><AdminAnalytics /></OwnerRoute>} />
        <Route path="/owner/logs" element={<OwnerRoute><AdminLogs /></OwnerRoute>} />
        <Route path="/owner/seller-recharges" element={<OwnerRoute><OwnerSellerRecharges /></OwnerRoute>} />
        <Route path="/owner/game-settings" element={<OwnerRoute><OwnerGameSettings /></OwnerRoute>} />
        <Route path="/owner/props" element={<OwnerRoute><OwnerProps /></OwnerRoute>} />
        <Route path="/owner/social" element={<OwnerRoute><OwnerSocial /></OwnerRoute>} />
        <Route path="/owner/user-ids" element={<OwnerRoute><OwnerUserIds /></OwnerRoute>} />
        <Route path="/owner/banners" element={<OwnerRoute><OwnerBanners /></OwnerRoute>} />
        <Route path="/owner/policies" element={<OwnerRoute><OwnerPolicies /></OwnerRoute>} />
        <Route path="/owner/badges" element={<OwnerRoute><OwnerBadges /></OwnerRoute>} />
        <Route path="/owner/titles" element={<OwnerRoute><OwnerTitles /></OwnerRoute>} />

        {/* Host Center routes */}
        <Route path="/host" element={<HostRoute><HostDashboard /></HostRoute>} />
        <Route path="/host/earnings" element={<HostRoute><HostEarnings /></HostRoute>} />
        <Route path="/host/gifts" element={<HostRoute><HostGifts /></HostRoute>} />
        <Route path="/host/withdrawals" element={<HostRoute><HostWithdrawals /></HostRoute>} />
        <Route path="/host/rooms" element={<HostRoute><HostRooms /></HostRoute>} />
        <Route path="/host/level" element={<HostRoute><HostLevel /></HostRoute>} />

        {/* Coins Seller routes */}
        <Route path="/seller" element={<SellerRoute><SellerDashboard /></SellerRoute>} />
        <Route path="/seller/send" element={<SellerRoute><SellerSendCoins /></SellerRoute>} />
        <Route path="/seller/wallet" element={<SellerRoute><SellerWallet /></SellerRoute>} />
        <Route path="/seller/recharges" element={<SellerRoute><SellerRecharges /></SellerRoute>} />
        <Route path="/seller/verify" element={<SellerRoute><SellerVerify /></SellerRoute>} />
        <Route path="/seller/history" element={<SellerRoute><SellerHistory /></SellerRoute>} />
        <Route path="/seller/payments" element={<SellerRoute><SellerPaymentMethods /></SellerRoute>} />
        <Route path="/seller/wallets" element={<SellerRoute><SellerWalletSearch /></SellerRoute>} />
        <Route path="/seller/packages" element={<SellerRoute><SellerPackages /></SellerRoute>} />

        <Route path="*" element={<NotFound />} />
      </Routes>
      {user && <BottomNav />}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
