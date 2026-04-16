import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login, googleLogin } from "../api/auth.api";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const handleLogin = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await login({ email, password });

      localStorage.setItem("token", res.data.token);
      setMessage("Login successful");
      setMessageType("success");

      navigate("/dashboard");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Login failed");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setMessage("");
      googleLogin();
    } catch (err) {
      setMessage("Google login failed");
      setMessageType("error");
      setGoogleLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Welcome Back</h1>
          <p style={styles.subtitle}>Login to continue to Todo SaaS</p>
        </div>

        {message && (
          <div
            style={{
              ...styles.message,
              ...(messageType === "success"
                ? styles.successMessage
                : styles.errorMessage),
            }}
          >
            {message}
          </div>
        )}

        <div style={styles.formGroup}>
          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || !email.trim() || !password.trim()}
          style={styles.primaryButton}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div style={styles.divider}>
          <span style={styles.dividerText}>OR</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          style={styles.googleButton}
        >
          {googleLoading ? "Redirecting..." : "Login with Google"}
        </button>

        <p style={styles.footerText}>
          Don’t have an account?{" "}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    width: "100%",
    maxWidth: "420px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },
  header: {
    marginBottom: "24px",
    textAlign: "center",
  },
  title: {
    margin: 0,
    fontSize: "30px",
    color: "#111827",
    fontWeight: "700",
  },
  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "15px",
  },
  message: {
    padding: "12px 14px",
    borderRadius: "12px",
    marginBottom: "18px",
    fontWeight: "600",
    fontSize: "14px",
  },
  successMessage: {
    background: "#dcfce7",
    color: "#166534",
  },
  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  formGroup: {
    display: "flex",
    flexDirection: "column",
    marginBottom: "16px",
  },
  label: {
    marginBottom: "8px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#374151",
  },
  input: {
    padding: "12px 14px",
    borderRadius: "12px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    outline: "none",
  },
  primaryButton: {
    width: "100%",
    padding: "13px 16px",
    border: "none",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "8px",
  },
  divider: {
    textAlign: "center",
    margin: "20px 0",
    position: "relative",
  },
  dividerText: {
    background: "#fff",
    padding: "0 10px",
    color: "#6b7280",
    fontSize: "13px",
    fontWeight: "600",
  },
  googleButton: {
    width: "100%",
    padding: "13px 16px",
    border: "1px solid #d1d5db",
    borderRadius: "12px",
    background: "#fff",
    color: "#111827",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  footerText: {
    marginTop: "20px",
    textAlign: "center",
    color: "#6b7280",
    fontSize: "14px",
  },
  link: {
    color: "#2563eb",
    textDecoration: "none",
    fontWeight: "600",
  },
};