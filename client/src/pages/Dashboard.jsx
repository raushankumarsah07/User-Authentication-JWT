import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <section className="card">
      <h1>Welcome, {currentUser.name}</h1>
      <dl className="details">
        <dt>Email</dt>
        <dd>{currentUser.email}</dd>
        <dt>Authentication status</dt>
        <dd><span className="badge">Authenticated</span></dd>
      </dl>
      <button className="btn btn-outline" onClick={handleLogout}>Logout</button>
    </section>
  );
};

export default Dashboard;
