import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { rejectTrade } from '../../services/parental.service';

/**
 * CommentThread — renders the parent ↔ student comment exchange on a trade.
 *
 * Props:
 *   tradeId       — UUID of the trade_request row
 *   parentComment — existing comment string from DB (may be null)
 *   studentName   — display name of the student
 *   readonly      — if true, just display; no edit/submit controls
 *   onCommentSaved(updatedTrade) — called after a new comment is persisted
 */
export default function CommentThread({
  tradeId,
  parentComment,
  studentName = 'Student',
  readonly = false,
  onCommentSaved,
}) {
  const { token, user } = useAuth();
  const [draft, setDraft]       = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [localComment, setLocalComment] = useState(parentComment || '');

  // Parent adds / edits their comment without changing trade status
  // We piggy-back on the reject endpoint with the current status preserved.
  // In production you'd add a dedicated PATCH /trades/:id/comment endpoint.
  const handleSave = async () => {
    if (!draft.trim()) return;
    setSaving(true);
    setError('');
    try {
      // Using rejectTrade here only to persist the comment field.
      // Replace with your dedicated comment endpoint when ready.
      const updated = await rejectTrade(token, tradeId, draft);
      setLocalComment(draft);
      setDraft('');
      onCommentSaved?.(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const hasComment = Boolean(localComment);

  return (
    <div className="comment-thread">
      <div className="thread-label">
        <span className="thread-icon">💬</span> Guardian Feedback
      </div>

      {/* Existing comment bubble */}
      {hasComment ? (
        <div className="comment-bubbles">
          <div className="comment-bubble comment-bubble--parent">
            <div className="bubble-meta">
              <span className="bubble-author">You (Guardian)</span>
              <span className="bubble-role-tag">parent</span>
            </div>
            <p className="bubble-text">{localComment}</p>
          </div>

          {/* Placeholder for student reply — extend when reply API exists */}
          <div className="comment-bubble comment-bubble--student">
            <div className="bubble-meta">
              <span className="bubble-author">{studentName}</span>
              <span className="bubble-role-tag">student</span>
            </div>
            <p className="bubble-text bubble-text--muted">
              Student replies will appear here once the reply feature is enabled.
            </p>
          </div>
        </div>
      ) : (
        !readonly && (
          <p className="no-comment-hint">
            No comment left yet. Add one below to guide your student.
          </p>
        )
      )}

      {/* Empty state in readonly mode */}
      {readonly && !hasComment && (
        <p className="no-comment-hint">No feedback was left for this trade.</p>
      )}

      {/* Compose area — only shown when not readonly */}
      {!readonly && (
        <div className="comment-compose">
          <textarea
            className="comment-input"
            placeholder={
              hasComment
                ? 'Update your comment…'
                : `Leave feedback for ${studentName}…`
            }
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            disabled={saving}
          />

          {error && <p className="compose-error">{error}</p>}

          <div className="compose-actions">
            <span className="compose-hint">
              Your student will see this in their trade history.
            </span>
            <button
              className="btn btn--primary btn--sm"
              onClick={handleSave}
              disabled={saving || !draft.trim()}
            >
              {saving ? 'Saving…' : hasComment ? 'Update Comment' : 'Send Comment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
