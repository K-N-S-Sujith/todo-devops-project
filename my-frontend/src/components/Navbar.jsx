import { Link, useLocation, useNavigate } from "react-router-dom";
import { logout as logoutApi } from "../api/auth.api";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error("Logout API failed:", err);
    } finally {
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav style={styles.navbar}>
      <div style={styles.logoSection}>
        <h2 style={styles.logo}>TodoSaaS</h2>
      </div>

      <div style={styles.navLinks}>
        {token && (
          <>
            <Link
              to="/dashboard"
              style={{
                ...styles.link,
                ...(isActive("/dashboard") ? styles.activeLink : {}),
              }}
            >
              Dashboard
            </Link>

            <Link
              to="/profile"
              style={{
                ...styles.link,
                ...(isActive("/profile") ? styles.activeLink : {}),
              }}
            >
              Profile
            </Link>

            <Link
              to="/payment"
              style={{
                ...styles.link,
                ...(isActive("/payment") ? styles.activeLink : {}),
              }}
            >
              Payment
            </Link>

            <Link
              to="/mfa"
              style={{
                ...styles.link,
                ...(isActive("/mfa") ? styles.activeLink : {}),
              }}
            >
              MFA
            </Link>
          </>
        )}

        {!token && (
          <>
            <Link
              to="/login"
              style={{
                ...styles.link,
                ...(isActive("/login") ? styles.activeLink : {}),
              }}
            >
              Login
            </Link>

            <Link
              to="/register"
              style={{
                ...styles.link,
                ...(isActive("/register") ? styles.activeLink : {}),
              }}
            >
              Register
            </Link>
          </>
        )}
      </div>

      <div style={styles.rightSection}>
        {token && (
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    padding: "16px 24px",
    background: "#ffffff",
    borderBottom: "1px solid #e5e7eb",
    boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
    marginBottom: "24px",
    flexWrap: "wrap",
    position: "sticky",
    top: 0,
    zIndex: 1000,
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
  },
  logo: {
    margin: 0,
    fontSize: "24px",
    fontWeight: "700",
    color: "#2563eb",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },
  link: {
    textDecoration: "none",
    color: "#374151",
    fontWeight: "600",
    padding: "10px 14px",
    borderRadius: "10px",
    transition: "0.2s ease",
    background: "transparent",
  },
  activeLink: {
    background: "#dbeafe",
    color: "#1d4ed8",
  },
  rightSection: {
    marginLeft: "auto",
  },
  logoutBtn: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#ef4444",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
};