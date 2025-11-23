// File: frontend/src/components/PromptManager.jsx
import { useState, useEffect } from "react";
import { Save, RotateCcw, FileText, Sparkles } from "lucide-react";

export default function PromptManager() {
  const [prompts, setPrompts] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/prompts");
      const data = await response.json();

      if (data.success) {
        setPrompts(data.data);
        if (data.data.length > 0) {
          selectPrompt(data.data[0]);
        }
      }
    } catch (error) {
      setMessage("Error fetching prompts: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setEditContent(prompt.content);
    setMessage("");
  };

  const handleSave = async () => {
    if (!selectedPrompt || !editContent.trim()) {
      setMessage("Prompt content cannot be empty");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("http://localhost:5000/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedPrompt.type,
          content: editContent.trim(),
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✓ Prompt saved successfully!");
        setTimeout(() => setMessage(""), 3000);
        fetchPrompts();
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Error saving prompt: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (selectedPrompt) {
      setEditContent(selectedPrompt.content);
      setMessage("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Prompt Configuration</h2>
        <p className="text-gray-400">Customize AI behavior for email processing</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading prompts...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Prompt List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Prompt Types
              </h3>
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <button
                    key={prompt.id}
                    onClick={() => selectPrompt(prompt)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedPrompt?.id === prompt.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <div className="font-medium text-sm">{prompt.type}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="lg:col-span-3">
            {selectedPrompt ? (
              <div className="space-y-4">
                {/* Current Prompt Info */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">
                      {selectedPrompt.type}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400">
                    Configure how AI processes this type of task
                  </p>
                </div>

                {/* Textarea */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Prompt Content
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows="14"
                    className="w-full p-4 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 font-mono text-sm resize-none"
                    placeholder="Enter your prompt here..."
                  />
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

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg shadow-blue-500/20"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save Prompt"}
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex gap-3">
                    <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-400 font-medium mb-1">Pro Tip</p>
                      <p className="text-sm text-gray-400">
                        Changes to prompts apply immediately to new email processing. Be specific and clear in your instructions for best AI performance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No prompts available</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
