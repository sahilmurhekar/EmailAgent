// File: frontend/src/App.jsx
import { useState } from "react";
import { Mail, Settings, Inbox, MessageSquare, FileEdit, CheckSquare, Menu, X } from "lucide-react";
import PromptManager from "./components/PromptManager";
import InboxView from "./components/InboxView";
import EmailAgentChat from "./components/EmailAgentChat";
import DraftManager from "./components/DraftManager";
import TaskManager from "./components/TaskManager";

export default function App() {
  const [activeTab, setActiveTab] = useState("inbox");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navigation = [
    { id: "inbox", name: "Inbox", icon: Inbox },
    { id: "agent", name: "Agent Chat", icon: MessageSquare },
    { id: "drafts", name: "Drafts", icon: FileEdit },
    { id: "tasks", name: "Tasks", icon: CheckSquare },
    { id: "prompts", name: "Settings", icon: Settings },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case "prompts":
        return <PromptManager />;
      case "inbox":
        return <InboxView />;
      case "agent":
        return <EmailAgentChat />;
      case "drafts":
        return <DraftManager />;
      case "tasks":
        return <TaskManager />;
      default:
        return <InboxView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gray-900 border-r border-gray-800 transition-all duration-300 flex flex-col`}
      >
        {/* Logo/Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-lg text-white">EmailAgent</span>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 hover:bg-gray-800 rounded-lg transition-colors mx-auto"
            >
              <Menu className="w-5 h-5 text-gray-400" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-gray-400 hover:bg-gray-800 hover:text-gray-200"
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <span className="font-medium text-sm">{item.name}</span>
                )}
              </button>
            );
          })}
        </nav>


      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-white">
              {navigation.find((n) => n.id === activeTab)?.name || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-lg border border-gray-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-gray-300">AI Active</span>
            </div>


          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto bg-gray-950 p-6">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
