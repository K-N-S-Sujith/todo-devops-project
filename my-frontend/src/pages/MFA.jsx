import { useEffect, useState } from "react";
import {
  setupMFA,
  enableMFA,
  disableMFA,
  getMFAStatus,
} from "../api/mfa.api";

export default function MFA() {
  const [status, setStatus] = useState(null);
  const [setupData, setSetupData] = useState(null);
  const [otp, setOtp] = useState("");
  const [disableOtp, setDisableOtp] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const res = await getMFAStatus();
      setStatus(res.data);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to load MFA status");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleSetup = async () => {
    try {
      setActionLoading(true);
      setMessage("");
      setOtp("");
      const res = await setupMFA();
      setSetupData(res.data);
      setMessage("MFA setup generated successfully. Scan the QR code and verify with OTP.");
      setMessageType("success");
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to setup MFA");
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEnable = async () => {
    try {
      setActionLoading(true);
      setMessage("");

      const cleanOtp = otp.trim();
      const res = await enableMFA(cleanOtp);

      setMessage(res.data?.message || "MFA enabled successfully");
      setMessageType("success");
      setOtp("");
      setSetupData(null);
      await loadStatus();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to enable MFA");
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async () => {
    try {
      setActionLoading(true);
      setMessage("");

      const cleanOtp = disableOtp.trim();
      const res = await disableMFA(cleanOtp);

      setMessage(res.data?.message || "MFA disabled successfully");
      setMessageType("success");
      setDisableOtp("");
      setSetupData(null);
      await loadStatus();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to disable MFA");
      setMessageType("error");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h1 style={styles.title}>MFA Settings</h1>
        <p style={styles.subtitle}>Protect your account with two-factor authentication</p>
      </div>

      {message && (
        <div
          style={{
            ...styles.message,
            ...(messageType === "error" ? styles.errorMessage : styles.successMessage),
          }}
        >
          {message}
        </div>
      )}

      <div style={styles.statusGrid}>
        <div style={styles.statusCard}>
          <h3 style={styles.cardTitle}>MFA Status</h3>
          {loading ? (
            <p style={styles.loadingText}>Loading...</p>
          ) : (
            <p style={styles.statusValue}>
              {status?.mfaEnabled ? "Enabled" : "Disabled"}
            </p>
          )}
        </div>

        <div style={styles.statusCard}>
          <h3 style={styles.cardTitle}>Setup State</h3>
          {loading ? (
            <p style={styles.loadingText}>Loading...</p>
          ) : (
            <p style={styles.statusValue}>
              {status?.mfaPending ? "Pending Verification" : "Ready"}
            </p>
          )}
        </div>
      </div>

      <div style={styles.card}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Setup MFA</h2>
            <p style={styles.sectionText}>
              Generate a QR code and scan it in Google Authenticator or Authy.
            </p>
          </div>

          <button
            onClick={handleSetup}
            disabled={actionLoading}
            style={styles.primaryButton}
          >
            {actionLoading ? "Processing..." : "Setup MFA"}
          </button>
        </div>

        {setupData && (
          <div style={styles.setupBox}>
            {setupData.qrCode && (
              <div style={styles.qrSection}>
                <p style={styles.label}>Scan this QR code:</p>
                <img
                  src={setupData.qrCode}
                  alt="MFA QR Code"
                  style={styles.qrImage}
                />
              </div>
            )}

            {setupData.secret && (
              <div style={styles.infoRow}>
                <span style={styles.label}>Secret:</span>
                <span style={styles.secretText}>{setupData.secret}</span>
              </div>
            )}

            {setupData.otpauthUrl && (
              <div style={styles.infoRow}>
                <span style={styles.label}>OTP Auth URL:</span>
                <span style={styles.urlText}>{setupData.otpauthUrl}</span>
              </div>
            )}

            <div style={styles.inputGroup}>
              <input
                type="text"
                placeholder="Enter 6-digit OTP to enable MFA"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={styles.input}
              />
              <button
                onClick={handleEnable}
                disabled={actionLoading || otp.length !== 6}
                style={styles.successButton}
              >
                {actionLoading ? "Processing..." : "Enable MFA"}
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.card}>
        <h2 style={styles.sectionTitle}>Disable MFA</h2>
        <p style={styles.sectionText}>
          Enter your current OTP code to disable multi-factor authentication.
        </p>

        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="Enter OTP to disable MFA"
            value={disableOtp}
            onChange={(e) => setDisableOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
            style={styles.input}
          />
          <button
            onClick={handleDisable}
            disabled={actionLoading || disableOtp.length !== 6}
            style={styles.dangerButton}
          >
            {actionLoading ? "Processing..." : "Disable MFA"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "950px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  header: {
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "15px",
  },
  message: {
    padding: "14px 16px",
    borderRadius: "12px",
    marginBottom: "20px",
    fontWeight: "600",
  },
  successMessage: {
    background: "#dcfce7",
    color: "#166534",
  },
  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  statusGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statusCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  },
  cardTitle: {
    margin: 0,
    color: "#6b7280",
    fontSize: "14px",
  },
  statusValue: {
    marginTop: "10px",
    fontSize: "24px",
    fontWeight: "700",
    color: "#111827",
  },
  loadingText: {
    marginTop: "10px",
    color: "#6b7280",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "18px",
  },
  sectionTitle: {
    margin: 0,
    color: "#111827",
  },
  sectionText: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "14px",
  },
  setupBox: {
    borderTop: "1px solid #e5e7eb",
    paddingTop: "20px",
    marginTop: "16px",
  },
  qrSection: {
    marginBottom: "20px",
  },
  qrImage: {
    width: "220px",
    height: "220px",
    borderRadius: "12px",
    border: "1px solid #e5e7eb",
    padding: "8px",
    background: "#fff",
  },
  infoRow: {
    marginBottom: "14px",
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontWeight: "700",
    color: "#374151",
  },
  secretText: {
    background: "#f3f4f6",
    padding: "10px",
    borderRadius: "10px",
    wordBreak: "break-all",
    fontFamily: "monospace",
  },
  urlText: {
    background: "#f9fafb",
    padding: "10px",
    borderRadius: "10px",
    wordBreak: "break-all",
    fontSize: "13px",
    color: "#374151",
  },
  inputGroup: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
    marginTop: "16px",
  },
  input: {
    flex: 1,
    minWidth: "240px",
    padding: "12px 14px",
    borderRadius: "10px",
    border: "1px solid #d1d5db",
    outline: "none",
    fontSize: "14px",
  },
  primaryButton: {
    padding: "11px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
  successButton: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#16a34a",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
  dangerButton: {
    padding: "12px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#dc2626",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
  },
};