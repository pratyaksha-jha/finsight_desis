import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="register-select">
      <h2>Create your FinSight account</h2>
      <p>Choose the account type that applies to you</p>

      <div className="role-cards">
        <Link to="/register/student" className="role-card role-card--student">
          <div className="role-icon">🎓</div>
          <h3>Student Account</h3>
          <p>
            I am a student or minor. My trades will require
            guardian approval before execution.
          </p>
          <span className="role-badge">Supervised Mode</span>
        </Link>

        <Link to="/register/adult" className="role-card role-card--adult">
          <div className="role-icon">💼</div>
          <h3>Adult / Guardian Account</h3>
          <p>
            I am an independent adult trader, or a parent who
            wants to oversee a student's account.
          </p>
          <span className="role-badge">Pro Mode</span>
        </Link>
      </div>

      <p className="login-link">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </div>
  );
}