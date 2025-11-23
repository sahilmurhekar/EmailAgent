// File: frontend/src/components/InboxView.jsx
import { useState, useEffect } from "react";
import { Download, Zap, TrendingUp, AlertCircle, Mail, Calendar } from "lucide-react";

export default function InboxView() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedEmail, setSelectedEmail] = useState(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/emails");
      const data = await response.json();

      if (data.success) {
        setEmails(data.data);
        setMessage("");
      }
    } catch (error) {
      setMessage("Error fetching emails: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMockInbox = async () => {
    try {
      setLoading(true);
      setMessage("Loading mock inbox...");

      const response = await fetch("http://localhost:5000/api/inbox/load", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✓ ${data.data.message}`);
        fetchEmails();
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Error loading inbox: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const categorizeAllEmails = async () => {
    if (emails.length === 0) {
      setMessage("No emails to categorize. Load mock inbox first.");
      return;
    }

    try {
      setProcessing(true);
      setMessage("🤖 Processing emails with AI...");

      const response = await fetch(
        "http://localhost:5000/api/agent/categorize-all",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage(
          `✓ Successfully categorized ${data.data.categorizedCount} emails!`
        );
        fetchEmails();
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Error processing emails: " + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      Important: "bg-red-500/10 text-red-400 border-red-500/20",
      "To-Do": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      Newsletter: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      Spam: "bg-gray-500/10 text-gray-400 border-gray-500/20",
      Uncategorized: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    };
    return colors[category] || colors.Uncategorized;
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Important":
        return <AlertCircle className="w-4 h-4" />;
      case "To-Do":
        return <TrendingUp className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-semibold text-white mb-2">Inbox</h2>
          <p className="text-gray-400">Manage and categorize your emails</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadMockInbox}
            disabled={loading}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-all"
          >
            <Download className="w-4 h-4" />
            {loading ? "Loading..." : "Load Mock Inbox"}
          </button>
          <button
            onClick={categorizeAllEmails}
            disabled={processing || emails.length === 0}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white font-medium py-2.5 px-4 rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            <Zap className="w-4 h-4" />
            {processing ? "Processing..." : "Categorize All"}
          </button>
        </div>
      </div>

      {/* Status Messages */}
      {message && (
        <div
          className={`p-4 rounded-lg border text-sm font-medium ${
            message.includes("✓") || message.includes("🤖")
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : message.includes("Error")
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
          }`}
        >
          {message}
        </div>
      )}

      {loading && !message ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-400">Loading emails...</p>
          </div>
        </div>
      ) : emails.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 mb-4 text-lg">No emails yet</p>
          <button
            onClick={loadMockInbox}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5 px-6 rounded-lg transition-all shadow-lg shadow-blue-500/20"
          >
            Load Mock Inbox to Get Started
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-medium">Total</span>
                <Mail className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{emails.length}</div>
            </div>
            <div className="bg-gray-900 border border-red-500/20 rounded-lg p-5 hover:border-red-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-medium">Important</span>
                <AlertCircle className="w-5 h-5 text-red-400" />
              </div>
              <div className="text-3xl font-bold text-red-400">
                {emails.filter((e) => e.category === "Important").length}
              </div>
            </div>
            <div className="bg-gray-900 border border-yellow-500/20 rounded-lg p-5 hover:border-yellow-500/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-medium">To-Do</span>
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-yellow-400">
                {emails.filter((e) => e.category === "To-Do").length}
              </div>
            </div>
            <div className="bg-gray-900 border border-gray-700 rounded-lg p-5 hover:border-gray-600 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm font-medium">Spam</span>
                <Mail className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-3xl font-bold text-gray-400">
                {emails.filter((e) => e.category === "Spam").length}
              </div>
            </div>
          </div>

          {/* Email List */}
          <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {emails.map((email, index) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`p-4 cursor-pointer transition-all border-b border-gray-800 last:border-b-0 ${
                    selectedEmail?.id === email.id
                      ? "bg-blue-500/10 border-l-4 border-l-blue-500"
                      : "hover:bg-gray-800/50"
                  }`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white mb-1 truncate">
                        {email.subject}
                      </h3>
                      <p className="text-sm text-gray-400 truncate">
                        {email.sender}
                      </p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getCategoryColor(email.category)}`}>
                      {getCategoryIcon(email.category)}
                      {email.category}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Details */}
          {selectedEmail && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-800/50 px-6 py-4 border-b border-gray-800">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {selectedEmail.subject}
                </h3>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="font-medium">From:</span>
                    <span>{selectedEmail.sender}</span>
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${getCategoryColor(selectedEmail.category)}`}>
                    {getCategoryIcon(selectedEmail.category)}
                    {selectedEmail.category}
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-gray-300 text-sm font-sans leading-relaxed">
                    {selectedEmail.body}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
