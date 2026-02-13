import { Bot, User, Copy, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/react-app/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "@/react-app/hooks/useTheme";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group flex gap-4 p-6 ${
        role === "assistant" ? "bg-muted/30" : ""
      }`}
    >
      <div
        className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg ${
          role === "assistant"
            ? "bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg"
            : "bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-lg"
        }`}
      >
        {role === "assistant" ? (
          <Bot className="h-5 w-5" />
        ) : (
          <User className="h-5 w-5" />
        )}
      </div>
      <div className="flex-1 space-y-2 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold">
            {role === "assistant" ? "TypeGPT" : "You"}
          </p>
          {timestamp && (
            <span className="text-xs text-muted-foreground">{timestamp}</span>
          )}
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          {role === "assistant" ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { children, className, ...rest } = props;
                  const match = /language-(\w+)/.exec(className || "");
                  const isInline = !match;

                  if (isInline) {
                    return (
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...rest}>
                        {children}
                      </code>
                    );
                  }

                  return (
                    <div className="relative group/code">
                      <SyntaxHighlighter
                        style={theme === "dark" ? oneDark : oneLight}
                        language={match[1]}
                        PreTag="div"
                        className="rounded-lg !my-4"
                        showLineNumbers
                      >
                        {String(children).replace(/\n$/, "")}
                      </SyntaxHighlighter>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 opacity-0 group-hover/code:opacity-100 transition-opacity"
                        onClick={() => {
                          navigator.clipboard.writeText(String(children));
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                },
                pre({ children }) {
                  return <>{children}</>;
                },
              }}
            >
              {content}
            </ReactMarkdown>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="h-4 w-4 mr-2" />
          ) : (
            <Copy className="h-4 w-4 mr-2" />
          )}
          {copied ? "Copied!" : "Copy"}
        </Button>
      </div>
    </div>
  );
}
