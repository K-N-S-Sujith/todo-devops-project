import { useEffect, useMemo, useState } from "react";
import {
  getTodos,
  createTodo,
  deleteTodo,
  toggleTodo,
  updateTodo,
} from "../api/todo.api";
import TodoForm from "../components/TodoForm";
import TodoItem from "../components/TodoItem";

export default function Dashboard() {
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const loadTodos = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await getTodos();
      console.log("TODOS RESPONSE:", res.data);

      if (Array.isArray(res.data)) {
        setTodos(res.data);
      } else if (Array.isArray(res.data.todos)) {
        setTodos(res.data.todos);
      } else if (Array.isArray(res.data.data)) {
        setTodos(res.data.data);
      } else {
        setTodos([]);
      }
    } catch (err) {
      console.error("Failed to load todos", err);
      setError("Failed to load todos");
      setTodos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodos();
  }, []);

  const handleAddTodo = async (data) => {
    try {
      setActionLoading(true);
      await createTodo(data);
      await loadTodos();
    } catch (err) {
      console.error("Failed to add todo", err);
      setError("Failed to add todo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteTodo = async (id) => {
    try {
      setActionLoading(true);
      await deleteTodo(id);
      await loadTodos();
    } catch (err) {
      console.error("Failed to delete todo", err);
      setError("Failed to delete todo");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTodo = async (id) => {
    try {
      setActionLoading(true);
      await toggleTodo(id);
      await loadTodos();
    } catch (err) {
      console.error("Failed to update todo status", err);
      setError("Failed to update todo status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateTodo = async (id, data) => {
    try {
      setActionLoading(true);
      await updateTodo(id, data);
      await loadTodos();
    } catch (err) {
      console.error("Failed to update todo", err);
      setError("Failed to update todo");
    } finally {
      setActionLoading(false);
    }
  };

  const totalTodos = todos.length;

  const completedTodos = useMemo(() => {
    return todos.filter((todo) => todo.completed === true || todo.isCompleted === true).length;
  }, [todos]);

  const pendingTodos = totalTodos - completedTodos;

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Dashboard</h1>
          <p style={styles.subtitle}>Manage your tasks in one place</p>
        </div>

        <button style={styles.refreshBtn} onClick={loadTodos} disabled={loading || actionLoading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Total Todos</h3>
          <p style={styles.statValue}>{totalTodos}</p>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Completed</h3>
          <p style={styles.statValue}>{completedTodos}</p>
        </div>

        <div style={styles.statCard}>
          <h3 style={styles.statLabel}>Pending</h3>
          <p style={styles.statValue}>{pendingTodos}</p>
        </div>
      </div>

      <div style={styles.formCard}>
        <h2 style={styles.sectionTitle}>Add New Todo</h2>
        <TodoForm onAdd={handleAddTodo} />
      </div>

      {error && <div style={styles.error}>{error}</div>}

      <div style={styles.todoSection}>
        <div style={styles.todoHeader}>
          <h2 style={styles.sectionTitle}>Your Todos</h2>
          {actionLoading && <span style={styles.actionText}>Updating...</span>}
        </div>

        {loading ? (
          <div style={styles.loadingBox}>Loading todos...</div>
        ) : Array.isArray(todos) && todos.length === 0 ? (
          <div style={styles.emptyState}>
            <h3>No todos found</h3>
            <p>Add your first task to get started.</p>
          </div>
        ) : (
          <div style={styles.todoList}>
            {Array.isArray(todos) &&
              todos.map((todo) => (
                <div key={todo._id || todo.id} style={styles.todoCard}>
                  <TodoItem
                    todo={todo}
                    onDelete={handleDeleteTodo}
                    onToggle={handleToggleTodo}
                    onUpdate={handleUpdateTodo}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    background: "#f8fafc",
    minHeight: "100vh",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    marginBottom: "24px",
    flexWrap: "wrap",
  },
  title: {
    margin: 0,
    fontSize: "32px",
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    margin: "6px 0 0",
    color: "#6b7280",
    fontSize: "15px",
  },
  refreshBtn: {
    padding: "10px 16px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },
  statCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  },
  statLabel: {
    margin: 0,
    fontSize: "14px",
    color: "#6b7280",
  },
  statValue: {
    margin: "10px 0 0",
    fontSize: "28px",
    fontWeight: "700",
    color: "#111827",
  },
  formCard: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
    marginBottom: "24px",
  },
  sectionTitle: {
    marginTop: 0,
    marginBottom: "16px",
    color: "#111827",
  },
  error: {
    marginBottom: "16px",
    padding: "12px 14px",
    borderRadius: "10px",
    background: "#fee2e2",
    color: "#991b1b",
    fontWeight: "600",
  },
  todoSection: {
    background: "#fff",
    borderRadius: "16px",
    padding: "20px",
    boxShadow: "0 4px 14px rgba(0,0,0,0.08)",
  },
  todoHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  actionText: {
    color: "#2563eb",
    fontWeight: "600",
    fontSize: "14px",
  },
  loadingBox: {
    padding: "20px",
    textAlign: "center",
    color: "#6b7280",
  },
  emptyState: {
    padding: "30px 20px",
    textAlign: "center",
    color: "#6b7280",
    border: "1px dashed #d1d5db",
    borderRadius: "12px",
  },
  todoList: {
    display: "flex",
    flexDirection: "column",
    gap: "14px",
  },
  todoCard: {
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px",
    background: "#f9fafb",
  },
};