import { useState, useEffect, useRef } from "react";
import { ChatSidebar } from "@/react-app/components/ChatSidebar";
import { Button } from "@/react-app/components/ui/button";
import { Card } from "@/react-app/components/ui/card";
import { Upload, File, Loader2, Download, Trash2 } from "lucide-react";

interface UploadedFile {
  id: number;
  filename: string;
  file_key: string;
  content_type: string;
  file_size: number;
  created_at: string;
}

export default function FileManager() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await fetch("/api/files", { credentials: "include" });
      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Failed to fetch files:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      await fetchFiles();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileId: number, filename: string) => {
    if (!confirm(`Remove "${filename}"?`)) return;
    try {
      const res = await fetch(`/api/files/${fileId}`, { method: "DELETE", credentials: "include" });
      if (res.ok) {
        setFiles((prev) => prev.filter((f) => f.id !== fileId));
      } else {
        alert("Failed to remove file");
      }
    } catch (error) {
      alert("Failed to remove file");
    }
  };

  const downloadFile = async (fileId: number, filename: string) => {
    try {
      const response = await fetch(`/api/files/${fileId}`, { credentials: "include" });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      alert("Failed to download file");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="w-80 flex-shrink-0">
        <ChatSidebar showChatList={false} />
      </div>
      <div className="flex-1 overflow-y-auto bg-gradient-to-br from-background via-background to-muted p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
            File Manager
          </h1>
          <p className="text-muted-foreground">
            Upload and manage your files
          </p>
        </div>

        <Card className="p-6 space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full h-24"
            variant="outline"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-6 w-6" />
                Click to upload a file
              </>
            )}
          </Button>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : files.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <File className="h-12 w-12 mx-auto opacity-50 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No files uploaded yet</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {files.map((file) => (
              <Card key={file.id} className="p-4 flex items-center justify-between group">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="p-2 bg-primary/10 rounded flex-shrink-0">
                    <File className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.file_size)} • {file.content_type || "File"} •{" "}
                      {new Date(file.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Button
                    onClick={() => downloadFile(file.id, file.filename)}
                    variant="ghost"
                    size="sm"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => deleteFile(file.id, file.filename)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    title="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
