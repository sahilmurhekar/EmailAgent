// File: frontend/src/components/DraftManager.jsx
import { useState, useEffect } from "react";
import { Sparkles, Plus, Edit, Trash2, Save, X, Mail } from "lucide-react";

export default function DraftManager() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");
  const [draftForm, setDraftForm] = useState({ subject: "", body: "" });

  useEffect(() => {
    fetchEmails();
    fetchDrafts();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/emails");
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setEmails(data.data);
        setSelectedEmail(data.data[0]);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDrafts = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/drafts");
      const data = await response.json();

      if (data.success) {
        setDrafts(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching drafts:", error);
    }
  };

  const getDraftsForEmail = (emailId) => {
    return drafts.filter((d) => d.email_id === emailId);
  };

  const generateDraft = async () => {
    if (!selectedEmail) {
      setMessage("Please select an email first");
      return;
    }

    try {
      setGenerating(true);
      setMessage("🤖 Generating draft reply...");

      const response = await fetch(
        `http://localhost:5000/api/agent/draft-reply/${selectedEmail.id}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.success) {
        setDraftForm({
          subject: data.data.subject,
          body: data.data.body,
        });
        setMessage("");
        setShowModal(true);
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Error generating draft: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveDraft = async () => {
    if (!selectedEmail) {
      setMessage("Please select an email first");
      return;
    }

    if (!draftForm.subject.trim() || !draftForm.body.trim()) {
      setMessage("Subject and body cannot be empty");
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch("http://localhost:5000/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailId: selectedEmail.id,
          subject: draftForm.subject,
          body: draftForm.body,
          type: "reply",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✓ Draft saved successfully!");
        setShowModal(false);
        setDraftForm({ subject: "", body: "" });
        fetchDrafts();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Error saving draft: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const deleteDraft = async (draftId) => {
    if (!window.confirm("Are you sure you want to delete this draft?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/drafts/${draftId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMessage("✓ Draft deleted");
        fetchDrafts();
        setSelectedDraft(null);
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Error deleting draft: " + error.message);
    }
  };

  const updateDraft = async () => {
    if (!selectedDraft) {
      setMessage("No draft selected");
      return;
    }

    if (!draftForm.subject.trim() || !draftForm.body.trim()) {
      setMessage("Subject and body cannot be empty");
      return;
    }

    try {
      setGenerating(true);
      const response = await fetch(
        `http://localhost:5000/api/drafts/${selectedDraft.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: draftForm.subject,
            body: draftForm.body,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage("✓ Draft updated successfully!");
        setShowModal(false);
        setDraftForm({ subject: "", body: "" });
        setSelectedDraft(null);
        fetchDrafts();
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Error updating draft: " + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const openDraftForEdit = (draft) => {
    setSelectedDraft(draft);
    setDraftForm({
      subject: draft.subject,
      body: draft.body,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setDraftForm({ subject: "", body: "" });
    setSelectedDraft(null);
  };

  const emailDrafts = selectedEmail ? getDraftsForEmail(selectedEmail.id) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Draft Manager</h2>
        <p className="text-gray-400">Create and manage email drafts</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 mb-2 text-lg">No emails available</p>
          <p className="text-sm text-gray-500">
            Load mock inbox from the Inbox tab first
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Email List */}
          <div className="lg:col-span-1">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 max-h-[600px] overflow-y-auto">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Emails
              </h3>
              <div className="space-y-2">
                {emails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      setSelectedDraft(null);
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedEmail?.id === email.id
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                        : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <div className="font-medium text-sm truncate">{email.subject}</div>
                    <div className="text-xs opacity-75 truncate mt-1">
                      {email.sender}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Drafts Area */}
          <div className="lg:col-span-3">
            {selectedEmail ? (
              <div className="space-y-4">
                {/* Selected Email Info */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-1">
                    {selectedEmail.subject}
                  </h4>
                  <p className="text-sm text-gray-400">
                    From: {selectedEmail.sender}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={generateDraft}
                    disabled={generating}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg shadow-green-500/20"
                  >
                    <Sparkles className="w-4 h-4" />
                    {generating ? "Generating..." : "Generate AI Draft"}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedDraft(null);
                      setDraftForm({ subject: "", body: "" });
                      setShowModal(true);
                    }}
                    className="flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Create Blank
                  </button>
                </div>

                {/* Status Messages */}
                {message && (
                  <div
                    className={`p-4 rounded-lg border text-sm font-medium ${
                      message.includes("✓")
                        ? "bg-green-500/10 text-green-400 border-green-500/20"
                        : message.includes("🤖")
                        ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        : "bg-red-500/10 text-red-400 border-red-500/20"
                    }`}
                  >
                    {message}
                  </div>
                )}

                {/* Drafts List */}
                {emailDrafts.length > 0 ? (
                  <div>
                    <h4 className="font-semibold text-white mb-3">
                      Drafts for this email ({emailDrafts.length})
                    </h4>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {emailDrafts.map((draft) => (
                        <div
                          key={draft.id}
                          onClick={() => openDraftForEdit(draft)}
                          className={`bg-gray-900 border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedDraft?.id === draft.id
                              ? "border-blue-500 ring-2 ring-blue-500/20"
                              : "border-gray-800 hover:border-gray-700"
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <h5 className="font-semibold text-white truncate">
                                {draft.subject}
                              </h5>
                              <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                                {draft.body}
                              </p>
                              <p className="text-xs text-gray-500 mt-2">
                                {new Date(draft.created_at).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDraftForEdit(draft);
                                }}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDraft(draft.id);
                                }}
                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                    <Mail className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                    <p className="text-gray-400 mb-1">No drafts for this email yet</p>
                    <p className="text-sm text-gray-500">Generate or create one above</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
                <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Select an email to manage drafts</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Draft Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">
                {selectedDraft ? "Edit Draft" : "Create Draft"}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Subject Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  value={draftForm.subject}
                  onChange={(e) =>
                    setDraftForm({ ...draftForm, subject: e.target.value })
                  }
                  className="w-full p-3 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200"
                  placeholder="Email subject..."
                />
              </div>

              {/* Body Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Body
                </label>
                <textarea
                  value={draftForm.body}
                  onChange={(e) =>
                    setDraftForm({ ...draftForm, body: e.target.value })
                  }
                  rows="12"
                  className="w-full p-3 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-200 font-mono text-sm resize-none"
                  placeholder="Email body..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={selectedDraft ? updateDraft : saveDraft}
                  disabled={generating}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium py-3 px-4 rounded-lg transition-all shadow-lg shadow-blue-500/20"
                >
                  <Save className="w-4 h-4" />
                  {generating
                    ? "Saving..."
                    : selectedDraft
                    ? "Update Draft"
                    : "Save Draft"}
                </button>
                <button
                  onClick={closeModal}
                  className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
