
import { useEffect, useState } from "react";
import "./App.css";

const API = "http://13.127.117.112:8082/tasks";

const emptyForm = {
  title: "",
  description: "",
  status: "TODO",
  priority: "LOW",
};

function App() {
  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  const tasksPerPage = 5;

  const [form, setForm] = useState(emptyForm);

  const loadTasks = async () => {
    try {
      const response = await fetch(API);

      if (!response.ok) {
        throw new Error("Failed to load tasks");
      }

      const data = await response.json();

      const activeTasks = data.filter(
        (task) => task.status?.toUpperCase() !== "DELETED"
      );

      setTasks(activeTasks);
      setError("");
    } catch (error) {
      console.error(error);
      setError("Unable to load tasks");
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const handleEdit = (task) => {
    setEditingId(task.id);

    setForm({
      title: task.title || "",
      description: task.description || "",
      status: task.status || "TODO",
      priority: task.priority || "LOW",
    });

    setError("");
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim()) {
      setError("Please enter Task Name");
      return;
    }

    if (!form.description.trim()) {
      setError("Please enter Description");
      return;
    }

    try {
      const url = editingId ? `${API}/${editingId}` : API;
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const message = await response.text();
        console.log("Backend response:", message);

        throw new Error(`Request failed: ${response.status}`);
      }

      await response.json();

      await loadTasks();

      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      setCurrentPage(1);
    } catch (error) {
      console.error("Save error:", error);
      setError("Unable to save task. Check Eclipse Console.");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this task?"
    );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(`${API}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete failed");
      }

      setTasks((previousTasks) =>
        previousTasks.filter((task) => task.id !== id)
      );

      // Database row remains with status = DELETED
      await loadTasks();
    } catch (error) {
      console.error("Delete error:", error);
      setError("Unable to delete task");
    }
  };

  const totalPages = Math.max(
    1,
    Math.ceil(tasks.length / tasksPerPage)
  );

  const startIndex = (currentPage - 1) * tasksPerPage;

  const currentTasks = tasks.slice(
    startIndex,
    startIndex + tasksPerPage
  );

  if (showForm) {
    return (
      <div className="app-page">
        <div className="task-form-card">
          <h1>{editingId ? "Edit Task" : "Add Task"}</h1>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-field">
              <label>Task Name</label>

              <input
                type="text"
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter task name"
              />
            </div>

            <div className="form-field">
              <label>Description</label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Enter description"
              />
            </div>

            <div className="form-field">
              <label>Status</label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
              >
                <option value="TODO">TODO</option>
                <option value="IN_PROGRESS">
                  IN_PROGRESS
                </option>
                <option value="COMPLETED">
                  COMPLETED
                </option>
              </select>
            </div>

            <div className="form-field">
              <label>Priority</label>

              <select
                name="priority"
                value={form.priority}
                onChange={handleChange}
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="submit-button"
              >
                {editingId ? "Update" : "Submit"}
              </button>

              <button
                type="button"
                className="back-button"
                onClick={() => {
                  setShowForm(false);
                  setError("");
                }}
              >
                Back
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-page">
      <div className="task-list-container">
        <div className="page-header">
          <h1>Task Management</h1>

          <button
            className="add-task-button"
            onClick={handleAdd}
          >
            + Add Task
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="table-wrapper">
          <table className="task-table">
            <colgroup>
              <col className="col-sno" />
              <col className="col-title" />
              <col className="col-description" />
              <col className="col-status" />
              <col className="col-priority" />
              <col className="col-action" />
            </colgroup>

            <thead>
              <tr>
                <th>S.No</th>
                <th>Task Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {currentTasks.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="empty-row"
                  >
                    No tasks available
                  </td>
                </tr>
              ) : (
                currentTasks.map((task, index) => (
                  <tr key={task.id}>
                    <td className="center">
                      {startIndex + index + 1}
                    </td>

                    <td className="task-title-cell">
                      {task.title}
                    </td>

                    <td className="description-cell">
                      {task.description}
                    </td>

                    <td>{task.status}</td>

                    <td>{task.priority}</td>

                    <td className="action-cell">
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(task)}
                      >
                        Edit
                      </button>

                      <button
                        className="delete-button"
                        onClick={() => handleDelete(task.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination">
          <button
            disabled={currentPage === 1}
            onClick={() =>
              setCurrentPage(currentPage - 1)
            }
          >
            &lt;
          </button>

          {Array.from(
            { length: totalPages },
            (_, index) => (
              <button
                key={index}
                className={
                  currentPage === index + 1
                    ? "selected-page"
                    : ""
                }
                onClick={() =>
                  setCurrentPage(index + 1)
                }
              >
                {index + 1}
              </button>
            )
          )}

          <button
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage(currentPage + 1)
            }
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
