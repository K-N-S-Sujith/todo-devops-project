import { useState } from "react";
import { createOrder } from "../api/payment.api";

export default function Payment() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const pay = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await createOrder({ plan: "monthly" });
      const { order, keyId } = res.data;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: "Todo SaaS",
        description: `Premium Plan - ${order.plan}`,
        handler: async function (response) {
          console.log("Payment Response:", response);
          setMessage("Payment successful! Premium activation will be processed.");
          setMessageType("success");
        },
        prefill: {
          name: "User",
          email: "",
        },
        notes: {
          plan: order.plan,
        },
        theme: {
          color: "#2563eb",
        },
        modal: {
          ondismiss: function () {
            setMessage("Payment popup closed.");
            setMessageType("error");
          },
        },
      };

      if (!window.Razorpay) {
        setMessage("Razorpay SDK not loaded");
        setMessageType("error");
        return;
      }

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error("PAYMENT ERROR:", err.response?.data || err.message);
      setMessage(err.response?.data?.message || "Failed to create payment order");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.badge}>Premium</div>

        <h1 style={styles.title}>Upgrade to Premium</h1>
        <p style={styles.subtitle}>
          Unlock better productivity features and enjoy a smoother Todo SaaS experience.
        </p>

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

        <div style={styles.planBox}>
          <h2 style={styles.planTitle}>Monthly Plan</h2>
          <p style={styles.price}>₹99 / month</p>

          <div style={styles.featureList}>
            <div style={styles.featureItem}>✔ Premium access</div>
            <div style={styles.featureItem}>✔ Faster experience</div>
            <div style={styles.featureItem}>✔ More advanced features</div>
            <div style={styles.featureItem}>✔ Future premium updates</div>
          </div>
        </div>

        <button onClick={pay} disabled={loading} style={styles.button}>
          {loading ? "Processing..." : "Buy Now"}
        </button>

        <p style={styles.note}>
          Test payment mode enabled with Razorpay.
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
    maxWidth: "520px",
    background: "#fff",
    borderRadius: "20px",
    padding: "32px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    textAlign: "center",
  },
  badge: {
    display: "inline-block",
    padding: "6px 14px",
    borderRadius: "999px",
    background: "#dbeafe",
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: "13px",
    marginBottom: "16px",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    color: "#111827",
  },
  subtitle: {
    marginTop: "10px",
    color: "#6b7280",
    fontSize: "15px",
    lineHeight: 1.6,
  },
  message: {
    marginTop: "18px",
    padding: "12px 14px",
    borderRadius: "12px",
    fontWeight: "600",
    textAlign: "left",
  },
  successMessage: {
    background: "#dcfce7",
    color: "#166534",
  },
  errorMessage: {
    background: "#fee2e2",
    color: "#991b1b",
  },
  planBox: {
    marginTop: "24px",
    padding: "24px",
    borderRadius: "18px",
    background: "#f9fafb",
    border: "1px solid #e5e7eb",
    textAlign: "left",
  },
  planTitle: {
    margin: 0,
    fontSize: "22px",
    color: "#111827",
  },
  price: {
    marginTop: "10px",
    fontSize: "28px",
    fontWeight: "700",
    color: "#2563eb",
  },
  featureList: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  featureItem: {
    color: "#374151",
    fontSize: "15px",
  },
  button: {
    marginTop: "24px",
    width: "100%",
    padding: "14px 16px",
    border: "none",
    borderRadius: "12px",
    background: "#2563eb",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "700",
    cursor: "pointer",
  },
  note: {
    marginTop: "14px",
    fontSize: "13px",
    color: "#6b7280",
  },
};