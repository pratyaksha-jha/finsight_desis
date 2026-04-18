import { useEffect, useState } from 'react';
import BudgetTracker from '../../components/parental/BudgetTracker';
import { useAuth } from '../../hooks/useAuth';
import { getLinkedStudents, getPendingTrades } from '../../services/parental.service';
import ParentalFeedback from "./ParentalFeedback";
import PendingTransactions from './PendingTransactions';


export default function ApprovalPortal() {
  const { token, user } = useAuth();
  
  const [pendingCount, setPendingCount] = useState(0);
  const [students, setStudents]         = useState([]);
  const [activeTab, setActiveTab]       = useState('pending');
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!token) return;
    getLinkedStudents(token)
      .then(setStudents)
      .catch(() => { })
      .finally(() => setLoading(false));
  }, [token]);

  //remove after merging
  useEffect(() => {
    if (user && user.role === 'student') {
      window.location.href = '/student/dashboard';
    }
  }, [user]);

  // Load summary counts on mount
  useEffect(() => {
    if (!token) return;
  
    getPendingTrades(token)
      .then((trades) => {
        setPendingCount(trades.length);
      })
      .catch(() => {})          // ← add this so it doesn't hang forever
      .finally(() => setLoading(false));  // ← this now always runs
  
  }, [token]);

  const tabs = [
    { id: 'pending',  label: 'Pending Requests', badge: pendingCount },
    { id: 'feedback', label: 'Feedback History' },
    { id: 'budget',   label: 'Budget Manager' },
  ];

  if (loading) {
    return <h2>Loading dashboard...</h2>;
  }

  return (
    <div className="approval-portal">
      {/* Header */}
      <div className="portal-header">
        <div>
          <h1>Guardian Approval Portal</h1>
          <p>Review trade requests, manage budgets, and leave feedback for your students.</p>
        </div>
        {pendingCount > 0 && (
          <div className="pending-alert">
            <span className="pulse-dot" />
            {pendingCount} trade{pendingCount > 1 ? 's' : ''} awaiting your review
          </div>
        )}
      </div>

      {/* Student summary chips */}
      {students.length > 0 && (
        <div className="student-chips">
          <span className="chips-label">Linked students:</span>
          {students.map((s) => (
            <span key={s.id} className="student-chip">{s.name}</span>
          ))}
        </div>
      )}

      {/* Tab navigation */}
      <nav className="portal-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.badge > 0 && (
              <span className="tab-badge">{tab.badge}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <div className="portal-content">
        {loading ? (
          <p className="loading-text">Loading…</p>
        ) : (
          <>
            {activeTab === 'pending' && <PendingTransactions />}

            {activeTab === 'feedback' && (
              // Import ParentalFeedback dynamically to avoid circular deps
              <ParentalFeedbackTab />
            )}

            {activeTab === 'budget' && (
              <div className="budget-list">
                {students.length === 0 ? (
                  <p>No linked students yet. Share your invite link with your student.</p>
                ) : (
                  students.map((s) => (
                    <div key={s.id} className="budget-section">
                      <h3>{s.name}'s Budget</h3>
                      <BudgetTracker
                        student={s}
                        onUpdate={() => {/* refresh if needed */}}
                      />
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Inline tab component to avoid an extra file import
function ParentalFeedbackTab() {
    return <ParentalFeedback />;
}