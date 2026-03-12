import { useState, useRef } from "react";
import { Camera, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED = "image/jpeg,image/png,image/webp";

interface AvatarUploadProps {
  currentUrl?: string | null;
  storagePath: string; // e.g. "userId/profile" or "userId/room-roomId"
  onUploaded: (url: string) => void;
  size?: number;
  children?: React.ReactNode;
}

const AvatarUpload = ({ currentUrl, storagePath, onUploaded, size = 24, children }: AvatarUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_SIZE) { toast.error("Image must be under 5MB"); return; }
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) { toast.error("Only JPG, PNG, WEBP supported"); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setShowDialog(true);
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const filePath = `${storagePath}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      // Add cache-busting
      const url = `${data.publicUrl}?t=${Date.now()}`;
      onUploaded(url);
      setShowDialog(false);
      setPreview(null);
      setFile(null);
      toast.success("Image uploaded!");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const sizeClass = `w-${size} h-${size}`;

  return (
    <>
      <div className="relative cursor-pointer" onClick={() => inputRef.current?.click()}>
        {children}
        <div className="absolute bottom-0 right-0 w-8 h-8 bg-card rounded-full border-2 border-background flex items-center justify-center shadow-sm">
          <Camera className="w-4 h-4 text-foreground" />
        </div>
      </div>

      <input ref={inputRef} type="file" accept={ACCEPTED} className="hidden" onChange={handleFileSelect} />

      <Dialog open={showDialog} onOpenChange={v => { if (!v) { setShowDialog(false); setPreview(null); setFile(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Preview & Upload</DialogTitle></DialogHeader>
          {preview && (
            <div className="flex justify-center">
              <img src={preview} alt="Preview" className="w-48 h-48 rounded-2xl object-cover" />
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => { setShowDialog(false); setPreview(null); setFile(null); }}>Cancel</Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Uploading...</> : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AvatarUpload;
