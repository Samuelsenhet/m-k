import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ShimmerButton } from '@/components/ui/shimmer-button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Trash2, Loader2, ImageIcon, GripVertical, Crown, Upload, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PhotoSlot {
  id?: string;
  storage_path: string;
  display_order: number;
  prompt?: string;
}

// Upload queue types and constants
interface UploadQueueItem {
  file: File;
  slotIndex: number;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_CONCURRENT_UPLOADS = 2;

function validateFile(file: File): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `Ogiltigt format. Endast JPG, PNG och WebP tillåtna.`
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `Filen är för stor (${sizeMB}MB). Max 5MB.`
    };
  }
  return { valid: true };
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

function getPublicUrl(path: string) {
  const { data } = supabase.storage.from('profile-photos').getPublicUrl(path);
  return data.publicUrl;
}

interface SortablePhotoCardProps {
  photo: PhotoSlot;
  index: number;
  isUploading: boolean;
  uploadProgress: number;
  uploadFileName?: string;
  uploadStatus?: 'pending' | 'uploading' | 'success' | 'error';
  isDragging: boolean;
  isDeleting: boolean;
  canDelete: boolean;
  onDeleteClick: (index: number) => void;
  onUpload: (index: number) => void;
}

function SortablePhotoCard({
  photo,
  index,
  isUploading,
  uploadProgress,
  uploadFileName,
  uploadStatus,
  isDragging,
  isDeleting,
  canDelete,
  onDeleteClick,
  onUpload,
}: SortablePhotoCardProps) {
  const hasPhoto = photo?.storage_path;
  const sortableId = photo.id || `empty-${index}`;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: sortableId,
    disabled: !hasPhoto,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const isPrimary = index === 0;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative aspect-[3/4] overflow-hidden border-2 transition-all',
        hasPhoto
          ? 'border-transparent card-premium shadow-glow-rose/20'
          : 'border-dashed border-border bg-muted/30 hover:border-primary/50 cursor-pointer',
        isPrimary && hasPhoto && 'ring-2 ring-primary ring-offset-2',
        isPrimary && !hasPhoto && 'ring-2 ring-primary ring-offset-2',
        isDragging && 'ring-2 ring-primary/50 shadow-xl scale-105',
        isSortableDragging && 'z-50'
      )}
      onClick={() => !hasPhoto && !isUploading && onUpload(index)}
    >
      {isUploading ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/90 glass p-3">
          {uploadStatus === 'success' ? (
            <div className="flex flex-col items-center animate-scale-in">
              <div className="w-10 h-10 rounded-full gradient-emerald-glow flex items-center justify-center mb-2 shadow-glow-emerald">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs text-emerald-600 font-medium">Klart!</p>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center mb-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-xs text-destructive font-medium">Fel</p>
            </div>
          ) : (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-primary mb-2" />
              <div className="w-full px-2">
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary/50">
                  <div
                    className="h-full transition-all duration-300 ease-out gradient-rose-glow"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-[10px] text-muted-foreground truncate max-w-[60%]">
                    {uploadFileName || 'Laddar upp...'}
                  </p>
                  <p className="text-[10px] font-medium text-primary">
                    {Math.round(uploadProgress)}%
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      ) : hasPhoto ? (
        <>
          <img
            src={getPublicUrl(photo.storage_path)}
            alt={`Foto ${index + 1}`}
            className="w-full h-full object-cover"
          />

          {/* Primary badge */}
          {isPrimary && (
            <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
              <Crown className="w-3 h-3" />
              Huvudfoto
            </div>
          )}

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-1 right-8 w-6 h-6 flex items-center justify-center bg-black/50 rounded-full cursor-grab active:cursor-grabbing touch-manipulation"
          >
            <GripVertical className="w-3 h-3 text-white" />
          </div>

          {/* Delete button */}
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-1 right-1 w-6 h-6 min-h-[24px] touch-manipulation active:scale-95 disabled:opacity-50"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClick(index);
            }}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Trash2 className="w-3 h-3" />
            )}
          </Button>

          {/* Photo prompt overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="text-xs text-white truncate">{PHOTO_PROMPTS[index]}</p>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center">
          {isPrimary ? (
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
}

// Overlay component for dragging state
function DragOverlayCard({ photo, index }: { photo: PhotoSlot; index: number }) {
  const isPrimary = index === 0;

  return (
    <Card className="aspect-[3/4] overflow-hidden border-2 border-primary shadow-2xl card-premium animate-scale-in">
      <img
        src={getPublicUrl(photo.storage_path)}
        alt={`Foto ${index + 1}`}
        className="w-full h-full object-cover"
      />
      {isPrimary && (
        <div className="absolute top-1 left-1 bg-primary text-primary-foreground px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Huvudfoto
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-xs text-white truncate">{PHOTO_PROMPTS[index]}</p>
      </div>
    </Card>
  );
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 6 }: PhotoUploadProps) {
  const { user } = useAuth();
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Count photos with content to determine if deletion is allowed
  const photoCount = photos.filter(p => p.storage_path).length;
  const canDeletePhotos = photoCount > 1;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get photos with actual content for drag context
  const photosWithContent = photos.filter(p => p.storage_path);
  const sortableIds = photos.map((p, i) => p.id || `empty-${i}`);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find the indices
    const oldIndex = photos.findIndex(p => (p.id || `empty-${photos.indexOf(p)}`) === active.id);
    const newIndex = photos.findIndex(p => (p.id || `empty-${photos.indexOf(p)}`) === over.id);

    if (oldIndex === -1 || newIndex === -1) return;
    if (!photos[oldIndex]?.storage_path) return; // Can't move empty slots

    // Reorder the photos array
    const newPhotos = arrayMove(photos, oldIndex, newIndex);

    // Update display_order for all photos
    const updatedPhotos = newPhotos.map((photo, idx) => ({
      ...photo,
      display_order: idx,
    }));

    onPhotosChange(updatedPhotos);

    // Save the new order to the database
    if (user) {
      setSaving(true);
      try {
        const photoOrders = updatedPhotos
          .filter(p => p.id)
          .map(p => ({
            id: p.id,
            display_order: p.display_order,
          }));

        if (photoOrders.length > 0) {
          const { error } = await supabase.rpc('update_photo_order', {
            p_user_id: user.id,
            p_photo_orders: photoOrders,
          });

          if (error) {
            console.error('Error updating photo order:', error);
            toast.error('Kunde inte spara ordningen');
          } else {
            toast.success('Fotoordning uppdaterad!');
          }
        }
      } catch (error) {
        console.error('Error saving photo order:', error);
        toast.error('Kunde inte spara ordningen');
      } finally {
        setSaving(false);
      }
    }
  }, [photos, onPhotosChange, user]);

  // Helper to get upload status for a specific slot
  const getUploadForSlot = (slotIndex: number) => {
    return uploadQueue.find(item => item.slotIndex === slotIndex);
  };

  // Upload a single file with progress tracking
  const uploadSingleFile = useCallback(async (queueItem: UploadQueueItem) => {
    if (!user) return;

    const { file, slotIndex } = queueItem;
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/${Date.now()}-${slotIndex}.${fileExt}`;

    // Mark as uploading
    setUploadQueue(prev =>
      prev.map(item =>
        item.slotIndex === slotIndex
          ? { ...item, status: 'uploading' as const, progress: 0 }
          : item
      )
    );

    try {
      // Get the Supabase storage URL for direct XHR upload with progress
      const { data: session } = await supabase.auth.getSession();
      const accessToken = session?.session?.access_token;

      if (!accessToken) {
        throw new Error('Not authenticated');
      }

      // Upload with progress using XMLHttpRequest
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const uploadUrl = `${supabaseUrl}/storage/v1/object/profile-photos/${filePath}`;

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', uploadUrl, true);
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
        xhr.setRequestHeader('Content-Type', file.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded / event.total) * 100);
            setUploadQueue(prev =>
              prev.map(item =>
                item.slotIndex === slotIndex
                  ? { ...item, progress }
                  : item
              )
            );
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(file);
      });

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

        // Update local state
        const newPhotos = [...photos];
        newPhotos[slotIndex] = {
          ...newPhotos[slotIndex],
          storage_path: filePath,
          display_order: slotIndex,
          prompt: PHOTO_PROMPTS[slotIndex],
        };
        onPhotosChange(newPhotos);
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

        // Update photo with new ID
        const newPhotos = [...photos];
        newPhotos[slotIndex] = {
          ...newPhotos[slotIndex],
          id: insertData.id,
          storage_path: filePath,
          display_order: slotIndex,
          prompt: PHOTO_PROMPTS[slotIndex],
        };
        onPhotosChange(newPhotos);
      }

      // Mark as success
      setUploadQueue(prev =>
        prev.map(item =>
          item.slotIndex === slotIndex
            ? { ...item, status: 'success' as const, progress: 100 }
            : item
        )
      );

      // Remove from queue after showing success animation
      setTimeout(() => {
        setUploadQueue(prev => prev.filter(item => item.slotIndex !== slotIndex));
      }, 1500);

    } catch (error) {
      console.error('Upload error:', error);

      // Mark as error
      setUploadQueue(prev =>
        prev.map(item =>
          item.slotIndex === slotIndex
            ? { ...item, status: 'error' as const, error: 'Uppladdning misslyckades' }
            : item
        )
      );

      toast.error('Kunde inte ladda upp foto');

      // Remove from queue after showing error
      setTimeout(() => {
        setUploadQueue(prev => prev.filter(item => item.slotIndex !== slotIndex));
      }, 2000);
    }
  }, [user, photos, onPhotosChange]);

  // Effect to process queue when it changes
  const queueRef = useRef(uploadQueue);
  queueRef.current = uploadQueue;

  // Manual trigger to start processing
  const startProcessing = useCallback(() => {
    const activeUploads = queueRef.current.filter(item => item.status === 'uploading');
    const pendingUploads = queueRef.current.filter(item => item.status === 'pending');

    if (activeUploads.length >= MAX_CONCURRENT_UPLOADS || pendingUploads.length === 0) return;

    const toStart = pendingUploads.slice(0, MAX_CONCURRENT_UPLOADS - activeUploads.length);
    for (const item of toStart) {
      uploadSingleFile(item);
    }
  }, [uploadSingleFile]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, slotIndex: number) => {
    if (!user || !event.target.files || event.target.files.length === 0) return;

    const files = Array.from(event.target.files);

    // Find available slots starting from selected slot
    const availableSlots: number[] = [];
    for (let i = 0; i < maxPhotos && availableSlots.length < files.length; i++) {
      // Check if slot is empty or is the originally selected slot
      const idx = (slotIndex + i) % maxPhotos;
      if (!photos[idx]?.storage_path || idx === slotIndex) {
        if (!uploadQueue.find(q => q.slotIndex === idx)) {
          availableSlots.push(idx);
        }
      }
    }

    // If no available slots, just try to replace the selected one
    if (availableSlots.length === 0) {
      if (!uploadQueue.find(q => q.slotIndex === slotIndex)) {
        availableSlots.push(slotIndex);
      }
    }

    // Validate and add files to queue
    const newQueueItems: UploadQueueItem[] = [];

    for (let i = 0; i < Math.min(files.length, availableSlots.length); i++) {
      const file = files[i];
      const targetSlot = availableSlots[i];

      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(validation.error);
        continue;
      }

      newQueueItems.push({
        file,
        slotIndex: targetSlot,
        progress: 0,
        status: 'pending',
      });
    }

    if (newQueueItems.length > 0) {
      setUploadQueue(prev => [...prev, ...newQueueItems]);

      // Trigger processing after state update
      setTimeout(() => startProcessing(), 0);
    }

    // Reset file input
    setSelectedSlot(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteClick = (slotIndex: number) => {
    if (!canDeletePhotos) {
      toast.error('Du måste ha minst ett foto');
      return;
    }
    setDeleteConfirmIndex(slotIndex);
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmIndex === null) return;

    const slotToDelete = deleteConfirmIndex;
    const photo = photos[slotToDelete];
    if (!photo?.storage_path) {
      setDeleteConfirmIndex(null);
      return;
    }

    setDeleting(slotToDelete);
    setDeleteConfirmIndex(null);

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('profile-photos')
        .remove([photo.storage_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
        // Continue anyway - photo might already be deleted from storage
      }

      // Delete metadata if exists
      if (photo.id) {
        const { error: dbError } = await supabase
          .from('profile_photos')
          .delete()
          .eq('id', photo.id);

        if (dbError) throw dbError;
      }

      // Reorder remaining photos to fill gaps
      const remainingPhotos = photos.filter((p, idx) => idx !== slotToDelete && p?.storage_path);
      const newPhotos: PhotoSlot[] = [];

      // Fill slots with remaining photos in order
      for (let i = 0; i < maxPhotos; i++) {
        if (i < remainingPhotos.length) {
          newPhotos.push({
            ...remainingPhotos[i],
            display_order: i,
          });
        } else {
          newPhotos.push({ storage_path: '', display_order: i });
        }
      }

      // Update display_order in database for remaining photos
      if (user) {
        const photoOrders = newPhotos
          .filter(p => p.id)
          .map(p => ({
            id: p.id,
            display_order: p.display_order,
          }));

        if (photoOrders.length > 0) {
          await supabase.rpc('update_photo_order', {
            p_user_id: user.id,
            p_photo_orders: photoOrders,
          });
        }
      }

      onPhotosChange(newPhotos);
      toast.success('Foto borttaget');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Kunde inte ta bort foto');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmIndex(null);
  };

  const triggerUpload = (slotIndex: number) => {
    setSelectedSlot(slotIndex);
    fileInputRef.current?.click();
  };

  // Find the active photo for drag overlay
  const activePhoto = activeId
    ? photos.find((p, i) => (p.id || `empty-${i}`) === activeId)
    : null;
  const activeIndex = activeId
    ? photos.findIndex((p, i) => (p.id || `empty-${i}`) === activeId)
    : -1;

  // Check if we have upload activity for any slot
  const hasActiveUploads = uploadQueue.length > 0;

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => selectedSlot !== null && handleUpload(e, selectedSlot)}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-3">
            {photos.slice(0, maxPhotos).map((photo, index) => {
              const uploadItem = getUploadForSlot(index);
              return (
                <SortablePhotoCard
                  key={photo.id || `slot-${index}`}
                  photo={photo}
                  index={index}
                  isUploading={!!uploadItem}
                  uploadProgress={uploadItem?.progress ?? 0}
                  uploadFileName={uploadItem?.file.name}
                  uploadStatus={uploadItem?.status}
                  isDragging={activeId === (photo.id || `empty-${index}`)}
                  isDeleting={deleting === index}
                  canDelete={canDeletePhotos}
                  onDeleteClick={handleDeleteClick}
                  onUpload={triggerUpload}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activePhoto?.storage_path && activeIndex !== -1 && (
            <DragOverlayCard photo={activePhoto} index={activeIndex} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Upload button - ShimmerButton */}
      <div className="flex justify-center">
        <ShimmerButton
          variant="primary"
          size="default"
          icon={Upload}
          loading={hasActiveUploads}
          onClick={() => {
            // Find first empty slot
            const emptySlotIndex = photos.findIndex(p => !p.storage_path);
            if (emptySlotIndex !== -1) {
              triggerUpload(emptySlotIndex);
            } else if (photoCount < maxPhotos) {
              triggerUpload(photoCount);
            } else {
              toast.error('Alla fotoutrymmen är fulla');
            }
          }}
          disabled={photoCount >= maxPhotos && !photos.some(p => !p.storage_path)}
          className="w-full max-w-xs"
        >
          {hasActiveUploads ? 'Laddar upp...' : 'Ladda upp foton'}
        </ShimmerButton>
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Ladda upp 4-6 foton. Max 5MB per bild. JPG, PNG eller WebP.
        </p>
        <p className="text-xs text-primary/70">
          Det första fotot blir ditt huvudfoto. Dra för att ändra ordning.
        </p>
      </div>

      {saving && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin" />
          Sparar ordning...
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmIndex !== null} onOpenChange={(open) => !open && handleDeleteCancel()}>
        <AlertDialogContent className="glass max-w-[90vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort detta foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort detta foto? Åtgärden kan inte ångras.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="touch-manipulation active:scale-95">
              Avbryt
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 touch-manipulation active:scale-95"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
