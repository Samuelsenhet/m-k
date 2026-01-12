import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, X, Loader2, ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
  prompt?: string;
}

const PHOTO_PROMPTS = [
  '📸 Ditt bästa leende',
  '🎯 Gör något du älskar',
  '👯 Med vänner eller familj',
  '✈️ På en resa eller äventyr',
  '🎨 Din kreativa sida',
  '🐕 Med ditt husdjur',
];

interface PhotoUploadProps {
  photos: PhotoSlot[];
  onPhotosChange: (photos: PhotoSlot[]) => void;
  maxPhotos?: number;
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 6 }: PhotoUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
    return data.publicUrl;
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const file = event.target.files[0];
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}.${fileExt}`;

    setUploading(slotIndex);

    try {
      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Update or insert photo metadata
      const existingPhoto = photos[slotIndex];
      
      if (existingPhoto?.id) {
        // Delete old file if replacing
        if (existingPhoto.storage_path) {
          await supabase.storage.from('profile-photos').remove([existingPhoto.storage_path]);
        }
        
        // Update existing record
        const { error: updateError } = await supabase
          .from('profile_photos')
          .update({ storage_path: filePath })
          .eq('id', existingPhoto.id);
        
        if (updateError) throw updateError;
      } else {
        // Insert new record
        const { data: insertData, error: insertError } = await supabase
          .from('profile_photos')
          .insert({
            user_id: user.id,
            storage_path: filePath,
            display_order: slotIndex,
            prompt: PHOTO_PROMPTS[slotIndex],
          })
          .select()
          .single();
        
        if (insertError) throw insertError;
      }

      // Refresh photos
      const newPhotos = [...photos];
      newPhotos[slotIndex] = {
        ...newPhotos[slotIndex],
        storage_path: filePath,
        display_order: slotIndex,
        prompt: PHOTO_PROMPTS[slotIndex],
      };
      onPhotosChange(newPhotos);

      toast.success('Foto uppladdat!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Kunde inte ladda upp foto');
    } finally {
      setUploading(null);
      setSelectedSlot(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (slotIndex: number) => {
    const photo = photos[slotIndex];
    if (!photo?.storage_path) return;

    try {
      // Delete from storage
      await supabase.storage.from('profile-photos').remove([photo.storage_path]);
      
      // Delete metadata if exists
      if (photo.id) {
        await supabase.from('profile_photos').delete().eq('id', photo.id);
      }

      // Update local state
      const newPhotos = [...photos];
      newPhotos[slotIndex] = { storage_path: '', display_order: slotIndex };
      onPhotosChange(newPhotos);

      toast.success('Foto borttaget');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Kunde inte ta bort foto');
    }
  };

  const triggerUpload = (slotIndex: number) => {
    setSelectedSlot(slotIndex);
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => selectedSlot !== null && handleUpload(e, selectedSlot)}
      />
      
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: maxPhotos }).map((_, index) => {
          const photo = photos[index];
          const hasPhoto = photo?.storage_path;
          const isUploading = uploading === index;

          return (
            <Card
              key={index}
              className={cn(
                'relative aspect-[3/4] overflow-hidden border-2 border-dashed transition-all cursor-pointer hover:border-primary/50',
                hasPhoto ? 'border-transparent' : 'border-border bg-muted/30',
                index === 0 && !hasPhoto && 'ring-2 ring-primary ring-offset-2'
              )}
              onClick={() => !hasPhoto && !isUploading && triggerUpload(index)}
            >
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : hasPhoto ? (
                <>
                  <img
                    src={getPublicUrl(photo.storage_path)}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 w-6 h-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(index);
                    }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                    <p className="text-xs text-white truncate">{PHOTO_PROMPTS[index]}</p>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
                  {index === 0 ? (
                    <Plus className="w-8 h-8 text-primary mb-1" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-muted-foreground mb-1" />
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {PHOTO_PROMPTS[index]}
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      
      <p className="text-xs text-muted-foreground text-center">
        Ladda upp 4-6 foton. Det första fotot blir ditt huvudfoto.
      </p>
    </div>
  );
}
