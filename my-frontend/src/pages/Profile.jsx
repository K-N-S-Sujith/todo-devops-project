import { useEffect, useState } from "react";
import { getMe } from "../api/auth.api";
import {
  getStats,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../api/user.api";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const meRes = await getMe();
      const userData = meRes.data?.user || null;

      setUser(userData);
      setEditName(userData?.name || "");
      setEditAvatar(userData?.avatar || "");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      setStatsLoading(true);
      const statsRes = await getStats();
      setStats(statsRes.data?.stats || null);
    } catch (err) {
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadStats();
  }, []);

  const handleUpdateProfile = async () => {
    try {
      setActionLoading(true);
      setMessage("");

      const res = await updateProfile({
        name: editName,
        avatar: editAvatar,
      });

      setUser(res.data?.user || user);
      setMessage("Profile updated successfully");
      setMessageType("success");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to update profile");
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setMessage("");

      if (!currentPassword || !newPassword) {
        setMessage("Current and new password are required");
        setMessageType("error");
        return;
      }

      if (newPassword.length < 8) {
        setMessage("New password must be at least 8 characters");
        setMessageType("error");
        return;
      }

      setActionLoading(true);

      const res = await changePassword({
        currentPassword,
        newPassword,
      });

      setMessage(res.data?.message || "Password changed successfully");
      setMessageType("success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to change password");
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete your account? This will delete all your todos too."
    );

    if (!confirmDelete) return;

    try {
      setActionLoading(true);
      setMessage("");

      const res = await deleteAccount();

      localStorage.removeItem("token");
      setMessage(res.data?.message || "Account deleted successfully");
      setMessageType("success");

      navigate("/register");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to delete account");
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div style={styles.loading}>Loading profile...</div>;
  }

  if (error) {
    return <div style={styles.error}>{error}</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.headerCard}>
        <div style={styles.avatar}>
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} style={styles.avatarImage} />
          ) : (
            <span style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </span>
          )}
        </div>

        <div>
          <h2 style={styles.name}>{user?.name || "User"}</h2>
          <p style={styles.email}>{user?.email}</p>
          <div style={styles.badges}>
            <span style={user?.isPremium ? styles.premiumBadge : styles.normalBadge}>
              {user?.isPremium ? "Premium User" : "Free User"}
            </span>
            <span style={user?.mfaEnabled ? styles.safeBadge : styles.warnBadge}>
              {user?.mfaEnabled ? "MFA Enabled" : "MFA Disabled"}
            </span>
          </div>
        </div>
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

      <div style={styles.grid}>
        <div style={styles.card}>
          <h3>Account Info</h3>
          <p><strong>Provider:</strong> {user?.provider || "N/A"}</p>
          <p><strong>Email Verified:</strong> {user?.isEmailVerified ? "Yes" : "No"}</p>
          <p><strong>Joined:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleString() : "N/A"}</p>
          <p><strong>Last Login:</strong> {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : "N/A"}</p>
        </div>

        <div style={styles.card}>
          <h3>Stats</h3>
          {statsLoading ? (
            <p>Loading stats...</p>
          ) : stats ? (
            <>
              <p><strong>Total Todos:</strong> {stats.total ?? 0}</p>
              <p><strong>Completed:</strong> {stats.completed ?? 0}</p>
              <p><strong>Pending:</strong> {stats.pending ?? 0}</p>
              <p><strong>High Priority:</strong> {stats.highPriority ?? 0}</p>
              <p><strong>Completion Rate:</strong> {stats.completionRate ?? 0}%</p>
              <p><strong>Todos Remaining:</strong> {stats.todosRemaining}</p>
            </>
          ) : (
            <p style={styles.noData}>Stats not available</p>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <h3>Edit Profile</h3>

        <div style={styles.formGroup}>
          <label style={styles.label}>Name</label>
          <input
            style={styles.input}
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="Enter your name"
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Avatar URL</label>
          <input
            style={styles.input}
            type="text"
            value={editAvatar}
            onChange={(e) => setEditAvatar(e.target.value)}
            placeholder="Enter avatar image URL"
          />
        </div>

        <button
          style={styles.primaryButton}
          onClick={handleUpdateProfile}
          disabled={actionLoading}
        >
          {actionLoading ? "Saving..." : "Update Profile"}
        </button>
      </div>

      {user?.provider === "local" && (
        <div style={styles.card}>
          <h3>Change Password</h3>

          <div style={styles.formGroup}>
            <label style={styles.label}>Current Password</label>
            <input
              style={styles.input}
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>New Password</label>
            <input
              style={styles.input}
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
            />
          </div>

          <button
            style={styles.primaryButton}
            onClick={handleChangePassword}
            disabled={actionLoading}
          >
            {actionLoading ? "Updating..." : "Change Password"}
          </button>
        </div>
      )}

      <div style={styles.deleteCard}>
        <h3 style={{ marginTop: 0 }}>Danger Zone</h3>
        <p style={{ color: "#6b7280" }}>
          Deleting your account will permanently remove your profile and todos.
        </p>

        <button
          style={styles.deleteButton}
          onClick={handleDeleteAccount}
          disabled={actionLoading}
        >
          {actionLoading ? "Deleting..." : "Delete Account"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "950px",
    margin: "30px auto",
    padding: "20px",
    fontFamily: "Arial, sans-serif",
  },
  loading: {
    textAlign: "center",
    marginTop: "50px",
    fontSize: "18px",
  },
  error: {
    textAlign: "center",
    marginTop: "50px",
    color: "red",
    fontSize: "18px",
  },
  headerCard: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    background: "#fff",
    marginBottom: "20px",
  },
  avatar: {
    width: "80px",
    height: "80px",
    borderRadius: "50%",
    background: "#4f46e5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  avatarText: {
    color: "#fff",
    fontSize: "28px",
    fontWeight: "bold",
  },
  name: {
    margin: 0,
    fontSize: "24px",
  },
  email: {
    margin: "6px 0 10px",
    color: "#666",
  },
  badges: {
    display: "flex",
    gap: "10px",
    flexWrap: "wrap",
  },
  premiumBadge: {
    background: "#facc15",
    color: "#222",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  normalBadge: {
    background: "#e5e7eb",
    color: "#222",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  safeBadge: {
    background: "#dcfce7",
    color: "#166534",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
  },
  warnBadge: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "6px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "bold",
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
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "20px",
    marginBottom: "20px",
  },
  card: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    marginBottom: "20px",
  },
  deleteCard: {
    background: "#fff",
    padding: "20px",
    borderRadius: "16px",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    border: "1px solid #fecaca",
    marginBottom: "20px",
  },
  noData: {
    color: "#888",
    fontStyle: "italic",
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
    padding: "12px 16px",
    border: "none",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
  deleteButton: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "12px",
    background: "#dc2626",
    color: "#fff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
  },
};