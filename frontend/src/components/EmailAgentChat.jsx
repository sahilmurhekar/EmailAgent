// File: frontend/src/components/EmailAgentChat.jsx
import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, ListChecks, FileText, Mail, Bot } from "lucide-react";

export default function EmailAgentChat() {
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingEmails, setFetchingEmails] = useState(false);
  const messagesEndRef = useRef(null);

  const SERVER_URL = import.meta.env.VITE_SERVER_URL;
  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchEmails = async () => {
    try {
      setFetchingEmails(true);
      const response = await fetch(`${SERVER_URL}/api/emails`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setEmails(data.data);
        setSelectedEmail(data.data[0]);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error fetching emails:", error);
    } finally {
      setFetchingEmails(false);
    }
  };

  const handlePresetQuery = async (action) => {
    if (!selectedEmail) {
      alert("Please select an email first");
      return;
    }

    let endpoint = "";
    let queryText = "";

    switch (action) {
      case "summarize":
        endpoint = `/api/agent/query/${selectedEmail.id}`;
        queryText = "Summarize this email in 2-3 sentences.";
        break;
      case "tasks":
        endpoint = `/api/agent/extract-tasks/${selectedEmail.id}`;
        queryText = "Extract action items from this email.";
        break;
      case "draft":
        endpoint = `/api/agent/draft-reply/${selectedEmail.id}`;
        queryText = "Draft a reply to this email.";
        break;
      default:
        return;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: queryText,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputQuery("");

    try {
      setLoading(true);
      const response = await fetch(`${SERVER_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText }),
      });

      const data = await response.json();

      let assistantContent = "";

      if (action === "tasks" && data.data?.tasks) {
        const taskList = data.data.tasks
          .map((t) => `• ${t.task} (${t.deadline})`)
          .join("\n");
        assistantContent = taskList || "No action items found.";
      } else if (action === "draft" && data.data?.body) {
        assistantContent = `**Draft Reply**\n\nSubject: ${data.data.subject}\n\n${data.data.body}`;
      } else if (data.data?.response) {
        assistantContent = data.data.response;
      } else {
        assistantContent = "No response received.";
      }

      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: assistantContent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content: `Error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomQuery = async (e) => {
    e.preventDefault();

    if (!selectedEmail) {
      alert("Please select an email first");
      return;
    }

    if (!inputQuery.trim()) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputQuery,
    };

    setMessages((prev) => [...prev, userMessage]);
    const query = inputQuery;
    setInputQuery("");

    try {
      setLoading(true);
      const response = await fetch(
        `${SERVER_URL}/api/agent/query/${selectedEmail.id}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        }
      );

      const data = await response.json();

      const assistantMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: data.data?.response || "No response received.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: "error",
        content: `Error: ${error.message}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-white mb-2">Agent Chat</h2>
        <p className="text-gray-400">Interact with your AI email assistant</p>
      </div>

      {fetchingEmails ? (
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
                      setMessages([]);
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

          {/* Chat Interface */}
          <div className="lg:col-span-3 flex flex-col">
            {selectedEmail ? (
              <div className="flex flex-col h-[600px]">
                {/* Email Header */}
                <div className="bg-gray-900 border border-gray-800 rounded-t-lg p-4">
                  <h4 className="font-semibold text-white mb-1">
                    {selectedEmail.subject}
                  </h4>
                  <p className="text-sm text-gray-400">
                    From: {selectedEmail.sender}
                  </p>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-900 border-x border-gray-800 p-4 flex gap-2 flex-wrap">
                  <button
                    onClick={() => handlePresetQuery("summarize")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Summarize
                  </button>
                  <button
                    onClick={() => handlePresetQuery("tasks")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                  >
                    <ListChecks className="w-4 h-4" />
                    Extract Tasks
                  </button>
                  <button
                    onClick={() => handlePresetQuery("draft")}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    Draft Reply
                  </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 bg-gray-950 border-x border-gray-800 p-4 overflow-y-auto">
                  {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Bot className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500">Click a button above or type a custom question</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] p-4 rounded-lg ${
                              msg.type === "user"
                                ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                                : msg.type === "error"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-gray-900 text-gray-200 border border-gray-800"
                            }`}
                          >
                            <pre className="whitespace-pre-wrap text-sm font-sans">
                              {msg.content}
                            </pre>
                          </div>
                        </div>
                      ))}
                      {loading && (
                        <div className="flex justify-start">
                          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <form onSubmit={handleCustomQuery} className="bg-gray-900 border border-gray-800 rounded-b-lg p-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputQuery}
                      onChange={(e) => setInputQuery(e.target.value)}
                      placeholder="Ask anything about this email..."
                      disabled={loading}
                      className="flex-1 p-3 bg-gray-950 border border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 text-gray-200 text-sm"
                    />
                    <button
                      type="submit"
                      disabled={loading || !inputQuery.trim()}
                      className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 text-white px-6 rounded-lg transition-all shadow-lg shadow-blue-500/20"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center h-[600px] flex items-center justify-center">
                <div>
                  <Mail className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400">Select an email to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
