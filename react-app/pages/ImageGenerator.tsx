import { useState } from "react";
import { ChatSidebar } from "@/react-app/components/ChatSidebar";
import { Button } from "@/react-app/components/ui/button";
import { Textarea } from "@/react-app/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/react-app/components/ui/select";
import { Card } from "@/react-app/components/ui/card";
import { Sparkles, Download, Loader2 } from "lucide-react";

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState("");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, aspectRatio }),
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate image");
      }

      setImage(data.image.image_url);
    } catch (err: any) {
      setError(err.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  const downloadImage = () => {
    if (!image) return;

    const link = document.createElement("a");
    link.href = image;
    link.download = `generated-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-80 flex-shrink-0">
        <ChatSidebar showChatList={false} />
      </div>
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            AI Image Generator
          </h1>
          <p className="text-muted-foreground">
            Create stunning images with Gemini AI
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold">Describe your image</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A high-resolution, studio-lit product photograph of a minimalist ceramic coffee mug..."
                className="min-h-[200px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold">Aspect Ratio</label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">Square (1:1)</SelectItem>
                  <SelectItem value="9:16">Portrait (9:16)</SelectItem>
                  <SelectItem value="16:9">Landscape (16:9)</SelectItem>
                  <SelectItem value="4:3">Standard (4:3)</SelectItem>
                  <SelectItem value="3:4">Tall (3:4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={generateImage}
              disabled={loading || !prompt.trim()}
              className="w-full h-12"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Image
                </>
              )}
            </Button>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <div className="pt-4 border-t space-y-2">
              <h3 className="font-semibold text-sm">Tips for better results:</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Be specific about style, lighting, and composition</li>
                <li>• Include quality keywords like "high-resolution" or "photorealistic"</li>
                <li>• Describe the subject, setting, and mood clearly</li>
                <li>• Generation takes 5-15 seconds</li>
              </ul>
            </div>
          </Card>

          <div className="space-y-4">
            {image ? (
              <Card className="p-4 space-y-4">
                <img
                  src={image}
                  alt="Generated"
                  className="w-full rounded-lg shadow-2xl"
                />
                <Button onClick={downloadImage} className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download Image
                </Button>
              </Card>
            ) : (
              <Card className="p-12 border-dashed">
                <div className="text-center text-muted-foreground space-y-2">
                  <Sparkles className="h-12 w-12 mx-auto opacity-50" />
                  <p className="text-sm">Your generated image will appear here</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
