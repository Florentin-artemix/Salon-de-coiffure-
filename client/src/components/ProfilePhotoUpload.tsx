import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2 } from "lucide-react";
import { useUpload } from "@/hooks/use-upload";

interface ProfilePhotoUploadProps {
  currentImage?: string | null;
  fallback: string;
  onUploadComplete: (objectPath: string) => void;
}

export function ProfilePhotoUpload({ 
  currentImage, 
  fallback, 
  onUploadComplete 
}: ProfilePhotoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadFile } = useUpload({
    onSuccess: (response) => {
      onUploadComplete(response.objectPath);
      setIsUploading(false);
    },
    onError: () => {
      setIsUploading(false);
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      return;
    }

    setIsUploading(true);
    await uploadFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={currentImage || ""} />
          <AvatarFallback className="text-2xl">{fallback}</AvatarFallback>
        </Avatar>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
          onClick={handleClick}
          disabled={isUploading}
          data-testid="button-upload-photo"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        data-testid="input-photo-file"
      />
      <p className="text-xs text-muted-foreground text-center">
        Cliquez sur l'icone pour changer la photo
      </p>
    </div>
  );
}
