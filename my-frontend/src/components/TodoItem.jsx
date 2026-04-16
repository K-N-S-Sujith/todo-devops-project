import { useState } from "react";

export default function TodoItem({ todo, onDelete, onToggle, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(todo.title || "");
  const [description, setDescription] = useState(todo.description || "");

  const handleUpdate = async () => {
    await onUpdate(todo._id || todo.id, {
      title,
      description,
    });
    setIsEditing(false);
  };

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "12px",
        marginBottom: "10px",
        borderRadius: "8px",
      }}
    >
      {isEditing ? (
        <>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ display: "block", marginBottom: "8px", width: "100%" }}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ display: "block", marginBottom: "8px", width: "100%" }}
          />
          <button onClick={handleUpdate}>Save</button>
          <button onClick={() => setIsEditing(false)} style={{ marginLeft: "8px" }}>
            Cancel
          </button>
        </>
      ) : (
        <>
          <h4
            style={{
              textDecoration: todo.completed ? "line-through" : "none",
              margin: 0,
            }}
          >
            {todo.title}
          </h4>

          <p
            style={{
              textDecoration: todo.completed ? "line-through" : "none",
            }}
          >
            {todo.description}
          </p>

          <p>Status: {todo.completed ? "Completed" : "Pending"}</p>

          <button onClick={() => onToggle(todo._id || todo.id)}>
            {todo.completed ? "Mark Pending" : "Mark Complete"}
          </button>

          <button
            onClick={() => setIsEditing(true)}
            style={{ marginLeft: "8px" }}
          >
            Edit
          </button>

          <button
            onClick={() => onDelete(todo._id || todo.id)}
            style={{ marginLeft: "8px" }}
          >
            Delete
          </button>
        </>
      )}
    </div>
  );
}