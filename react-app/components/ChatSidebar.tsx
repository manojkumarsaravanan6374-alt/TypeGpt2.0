import { Plus, MessageSquare, Trash2, Settings, LogOut, Sun, Moon, Image, FileText, CreditCard } from "lucide-react";
import { Button } from "@/react-app/components/ui/button";
import { ScrollArea } from "@/react-app/components/ui/scroll-area";
import { Separator } from "@/react-app/components/ui/separator";
import { useAuth } from "@/react-app/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/react-app/hooks/useTheme";

interface Chat {
  id: string;
  title: string;
  preview: string;
  timestamp: string;
}

interface ChatSidebarProps {
  chats?: Chat[];
  activeChat?: string | null;
  onSelectChat?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteChat?: (id: string) => void;
  showChatList?: boolean;
}

export function ChatSidebar({
  chats = [],
  activeChat = null,
  onSelectChat = () => {},
  onNewChat = () => {},
  onDeleteChat = () => {},
  showChatList = true,
}: ChatSidebarProps) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="flex flex-col h-full bg-muted/30 border-r border-border">
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" onError={(e) => { e.currentTarget.style.display = "none"; }} />
            <h2 className="text-lg font-semibold">TypeGPT</h2>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        {user && (
          <div className="text-xs text-muted-foreground truncate">
            {user.email}
          </div>
        )}
        <Button onClick={() => { if (showChatList) onNewChat(); else navigate("/chat"); }} className="w-full" size="lg">
          <Plus className="mr-2 h-5 w-5" />
          New Chat
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={() => navigate("/chat")}
            variant={location.pathname === "/chat" ? "default" : "outline"}
            className="flex-1"
            size="sm"
          >
            <MessageSquare className="mr-1 h-4 w-4" />
            Chat
          </Button>
          <Button
            onClick={() => navigate("/images")}
            variant={location.pathname === "/images" ? "default" : "outline"}
            className="flex-1"
            size="sm"
          >
            <Image className="mr-1 h-4 w-4" />
            Images
          </Button>
          <Button
            onClick={() => navigate("/files")}
            variant={location.pathname === "/files" ? "default" : "outline"}
            className="flex-1"
            size="sm"
          >
            <FileText className="mr-1 h-4 w-4" />
            Files
          </Button>
        </div>
        <Button
          onClick={() => navigate("/pricing")}
          variant="outline"
          className="w-full"
          size="sm"
        >
          <CreditCard className="mr-2 h-4 w-4" />
          Upgrade / Payment
        </Button>
      </div>
      <Separator />
      {showChatList && (
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative flex items-start gap-3 rounded-lg p-3 cursor-pointer transition-colors ${
                activeChat === chat.id
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <MessageSquare className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{chat.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.preview}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {chat.timestamp}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 absolute right-2 top-2 h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
      )}
    </div>
  );
}
