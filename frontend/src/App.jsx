import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Layout
import NavBar from './components/layout/NavBar';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Auth pages
import InviteAccept from './pages/auth/InviteAccept';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import RegisterAdult from './pages/auth/RegisterAdult';
import RegisterMinor from './pages/auth/RegisterMinor';

// Adult pages
import AdultDashboard from './pages/adult/AdultDashboard';
import AdultNews from './pages/adult/AdultNews';
import AdultTrades from './pages/adult/AdultTrades';
import StockAnalysis from './pages/adult/StockAnalysis';
import Watchlist from './pages/adult/Watchlist';
import TradeComparison from './pages/adult/TradeComparison';


// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentNews from './pages/student/StudentNews';
import StudentTrades from './pages/student/StudentTrades';

// Parental pages (accessible to adults)
import ApprovalPortal from './pages/parental/ApprovalPortal';
import PendingTransactions from './pages/parental/PendingTransactions';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'student' ? '/student/dashboard' : '/adult/dashboard'} replace />;
}

function Layout({ children }) {
  return (
    <>
      <NavBar />
      <main>{children}</main>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root */}
        <Route path="/" element={<RootRedirect />} />

        {/* Public auth routes */}
        <Route path="/login"             element={<Login />} />
        <Route path="/register"          element={<Register />} />
        <Route path="/register/student"  element={<RegisterMinor />} />
        <Route path="/register/adult"    element={<RegisterAdult />} />
        <Route path="/invite/:token"     element={<InviteAccept />} />

        {/* Adult routes */}
        <Route path="/adult/dashboard" element={
          <ProtectedRoute requiredRole="adult">
            <Layout><AdultDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/adult/news" element={
          <ProtectedRoute requiredRole="adult">
            <Layout><AdultNews /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/adult/analysis" element={
          <ProtectedRoute requiredRole="adult">
            <Layout><StockAnalysis /></Layout>
          </ProtectedRoute>
        } />

        <Route path="/adult/trades" element={
          <ProtectedRoute requiredRole="adult">
            <Layout><AdultTrades /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/adult/watchlist" element={
  <ProtectedRoute requiredRole="adult"><Layout><Watchlist /></Layout></ProtectedRoute>
} />
<Route path="/adult/compare" element={
  <ProtectedRoute requiredRole="adult"><Layout><TradeComparison /></Layout></ProtectedRoute>
} />

        {/* Student routes */}
        <Route path="/student/dashboard" element={
          <ProtectedRoute requiredRole="student">
            <Layout><StudentDashboard /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/student/analysis" element={
          <ProtectedRoute requiredRole="student">
            <Layout><StockAnalysis /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/student/news" element={
          <ProtectedRoute requiredRole="student">
            <Layout><StudentNews /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/student/trades" element={
          <ProtectedRoute requiredRole="student">
            <Layout><StudentTrades /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/student/watchlist" element={
          <ProtectedRoute requiredRole="student">
            <Layout><Watchlist /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/student/compare" element={
          <ProtectedRoute requiredRole="student">
            <Layout><TradeComparison /></Layout>
          </ProtectedRoute>
        } />

        {/* Parental portal (adult only) */}
        <Route path="/parent/approval" element={
          <ProtectedRoute requiredRole="adult">
            <Layout><ApprovalPortal /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/parent/pending" element={
          <ProtectedRoute requiredRole="adult">
            <Layout><PendingTransactions /></Layout>
          </ProtectedRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}