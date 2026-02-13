import { useState, useEffect } from "react";
import { ChatSidebar } from "@/react-app/components/ChatSidebar";
import { ChatMessage } from "@/react-app/components/ChatMessage";
import { ChatInput } from "@/react-app/components/ChatInput";
import { Bot } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface Chat {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export default function Chat() {
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");

  // Load chats on mount
  useEffect(() => {
    loadChats();
  }, []);

  // Load messages when active chat changes
  useEffect(() => {
    if (activeChat) {
      loadMessages(activeChat);
    } else {
      setMessages([]);
    }
  }, [activeChat]);

  const loadChats = async () => {
    try {
      const response = await fetch("/api/chats");
      const data = await response.json();
      setChats(data.chats);
      
      // Select first chat if none selected
      if (data.chats.length > 0 && !activeChat) {
        setActiveChat(data.chats[0].id);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  };

  const loadMessages = async (chatId: number) => {
    try {
      const response = await fetch(`/api/chats/${chatId}/messages`);
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "New Chat" }),
      });
      const data = await response.json();
      setChats([data.chat, ...chats]);
      setActiveChat(data.chat.id);
      setMessages([]);
    } catch (error) {
      console.error("Failed to create chat:", error);
    }
  };

  const handleSelectChat = (id: number) => {
    setActiveChat(id);
  };

  const handleDeleteChat = async (id: number) => {
    try {
      await fetch(`/api/chats/${id}`, { method: "DELETE" });
      setChats(chats.filter((chat) => chat.id !== id));
      if (activeChat === id) {
        const remaining = chats.filter((chat) => chat.id !== id);
        setActiveChat(remaining[0]?.id || null);
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!activeChat || isStreaming) return;

    // Add user message immediately
    const userMessage: Message = {
      id: Date.now(),
      role: "user",
      content,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setStreamingMessage("");
    setIsStreaming(true);

    try {
      const response = await fetch(`/api/chats/${activeChat}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = JSON.parse(line.slice(6));
              
              if (data.done) {
                // Reload messages to get saved assistant message
                await loadMessages(activeChat);
                setStreamingMessage("");
                setIsStreaming(false);
              } else if (data.content) {
                setStreamingMessage((prev) => prev + data.content);
              } else if (data.error) {
                console.error("Streaming error:", data.error);
                setIsStreaming(false);
              }
            }
          }
        }
      }

      // Reload chats to update timestamps
      loadChats();
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsStreaming(false);
    }
  };

  const formatChatPreview = (chat: Chat) => {
    const time = new Date(chat.updated_at);
    const now = new Date();
    const diff = now.getTime() - time.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    if (hours < 1) return "Just now";
    if (hours < 24) return `${Math.floor(hours)} hours ago`;
    if (hours < 48) return "Yesterday";
    return `${Math.floor(hours / 24)} days ago`;
  };

  const displayMessages = [...messages];
  if (isStreaming && streamingMessage) {
    displayMessages.push({
      id: Date.now() + 1,
      role: "assistant",
      content: streamingMessage,
      created_at: new Date().toISOString(),
    });
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 flex-shrink-0">
        <ChatSidebar
          chats={chats.map((chat) => ({
            id: chat.id.toString(),
            title: chat.title,
            preview: "",
            timestamp: formatChatPreview(chat),
          }))}
          activeChat={activeChat?.toString() || null}
          onSelectChat={(id) => handleSelectChat(parseInt(id))}
          onNewChat={handleNewChat}
          onDeleteChat={(id) => handleDeleteChat(parseInt(id))}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {activeChat ? (
          <>
            {/* Messages - overflow-auto for unlimited scroll */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <div className="max-w-4xl mx-auto">
                {displayMessages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={new Date(message.created_at).toLocaleTimeString(
                      [],
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Input */}
            <div className="border-t border-border bg-background">
              <div className="max-w-4xl mx-auto">
                <ChatInput 
                  onSend={handleSendMessage} 
                  disabled={isStreaming}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
            <div className="text-center space-y-6 px-4 max-w-2xl">
              <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl">
                <Bot className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Welcome to TypeGPT
                </h1>
                <p className="text-muted-foreground text-lg">
                  Your intelligent AI assistant powered by Google Gemini
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                <div className="p-4 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold mb-2">💡 Ask Questions</h3>
                  <p className="text-sm text-muted-foreground">
                    Get instant answers to your questions
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold mb-2">🚀 Code Assistance</h3>
                  <p className="text-sm text-muted-foreground">
                    Write, debug, and optimize code
                  </p>
                </div>
                <div className="p-4 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold mb-2">✨ Creative Help</h3>
                  <p className="text-sm text-muted-foreground">
                    Generate ideas and creative content
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground pt-4">
                Click "New Chat" to start a conversation
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
