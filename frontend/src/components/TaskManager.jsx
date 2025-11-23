// File: frontend/src/components/TaskManager.jsx
import { useState, useEffect } from "react";
import { CheckCircle2, Circle, RotateCcw, Trash2, Calendar, AlertCircle, ListTodo } from "lucide-react";

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchTasks();
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let url = "http://localhost:5000/api/tasks";

      if (filter !== "all") {
        url = `http://localhost:5000/api/tasks/status/${filter}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      setMessage("Error fetching tasks: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/tasks/${taskId}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage("✓ Task updated");
        fetchTasks();
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Error updating task: " + error.message);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;

    try {
      const response = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✓ Task deleted");
        fetchTasks();
        setTimeout(() => setMessage(""), 2000);
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Error deleting task: " + error.message);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      completed: "bg-green-500/10 text-green-400 border-green-500/20",
      skipped: "bg-gray-500/10 text-gray-400 border-gray-500/20",
    };
    return colors[status] || colors.pending;
  };

  const getDeadlineColor = (deadline) => {
    if (deadline === "ASAP" || deadline === "Today") return "text-red-400 font-semibold";
    if (deadline === "Tomorrow") return "text-orange-400 font-semibold";
    return "text-gray-400";
  };

  const getDeadlineIcon = (deadline) => {
    if (deadline === "ASAP" || deadline === "Today") return <AlertCircle className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const totalCount = tasks.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Tasks</h2>
          <p className="text-gray-400">Track and manage action items</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Pending:</span>
            <span className="font-semibold text-yellow-400">{pendingCount}</span>
          </div>
          <div className="w-px h-4 bg-gray-700"></div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400">Completed:</span>
            <span className="font-semibold text-green-400">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg border text-sm font-medium ${
            message.includes("✓")
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {message}
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-3">
        <button
          onClick={() => setFilter("pending")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            filter === "pending"
              ? "bg-yellow-600 text-white shadow-lg shadow-yellow-500/20"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <Circle className="w-4 h-4" />
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("completed")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            filter === "completed"
              ? "bg-green-600 text-white shadow-lg shadow-green-500/20"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Completed ({completedCount})
        </button>
        <button
          onClick={() => setFilter("all")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
            filter === "all"
              ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
              : "bg-gray-800 text-gray-300 hover:bg-gray-700"
          }`}
        >
          <ListTodo className="w-4 h-4" />
          All Tasks
        </button>
      </div>

      {/* Tasks List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading tasks...</p>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <ListTodo className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 mb-2 text-lg">No tasks yet</p>
          <p className="text-sm text-gray-500">
            Go to Agent Chat → Extract Tasks to create tasks from emails
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`bg-gray-900 border rounded-lg p-5 transition-all ${
                task.status === "completed"
                  ? "border-green-500/20 opacity-75"
                  : task.status === "skipped"
                  ? "border-gray-700 opacity-60"
                  : "border-yellow-500/20 hover:border-yellow-500/40"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div className="pt-1">
                  {task.status === "completed" ? (
                    <CheckCircle2 className="w-6 h-6 text-green-400" />
                  ) : (
                    <Circle className="w-6 h-6 text-yellow-400" />
                  )}
                </div>

                {/* Task Content */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-base mb-2 ${
                      task.status === "completed"
                        ? "line-through text-gray-500"
                        : "text-white"
                    }`}
                  >
                    {task.task}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className={`flex items-center gap-2 ${getDeadlineColor(task.deadline)}`}>
                      {getDeadlineIcon(task.deadline)}
                      <span className="font-medium">{task.deadline}</span>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-xs font-semibold border ${getStatusColor(task.status)}`}>
                      {task.status}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {task.status === "pending" && (
                    <>
                      <button
                        onClick={() => updateTaskStatus(task.id, "completed")}
                        className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        title="Mark as complete"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateTaskStatus(task.id, "skipped")}
                        className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                        title="Skip task"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </>
                  )}
                  {task.status !== "pending" && (
                    <button
                      onClick={() => updateTaskStatus(task.id, "pending")}
                      className="p-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors"
                      title="Mark as pending"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
