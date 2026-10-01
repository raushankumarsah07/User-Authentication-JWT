import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {
  const { currentUser } = useAuth();

  return (
    <section className="card hero">
      <h1>Sign in once. Stay signed in safely.</h1>
      <p>
        A MERN demo of registration, login and protected pages. Passwords are
        hashed with bcrypt and your session lives in an HTTP-only cookie that
        JavaScript cannot read.
      </p>
      <div className="actions">
        {currentUser ? (
          <Link className="btn" to="/dashboard">Open dashboard</Link>
        ) : (
          <>
            <Link className="btn" to="/register">Create account</Link>
            <Link className="btn btn-outline" to="/login">Log in</Link>
          </>
        )}
      </div>
    </section>
  );
};

export default Home;
