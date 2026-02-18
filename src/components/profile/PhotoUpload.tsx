import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
import { Plus, Trash2, Loader2, ImageIcon, GripVertical, Crown, Upload, CheckCircle, AlertCircle, Info, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

function validateFile(file: File, t: (key: string, options?: Record<string, unknown>) => string): { valid: boolean; error?: string } {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: t('profile.photos.invalid_format')
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: t('profile.photos.file_too_large', { size: sizeMB })
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
  t: (key: string, options?: Record<string, unknown>) => string;
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
  t,
}: SortablePhotoCardProps) {
  const translate = typeof t === 'function' ? t : (key: string) => key;
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
              <p className="text-xs text-emerald-600 font-medium">{t('profile.photos.upload_complete')}</p>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center mb-2">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <p className="text-xs text-destructive font-medium">{translate('profile.photos.upload_error')}</p>
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
                    {uploadFileName || translate('profile.photos.uploading')}
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
              {translate('profile.photos.primary_photo')}
            </div>
          )}


          {/* Drag handle - larger touch target for "dra för att ändra ordning" */}
          <div
            {...attributes}
            {...listeners}
            className="absolute top-1 right-8 min-w-[44px] min-h-[44px] w-10 h-10 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full cursor-grab active:cursor-grabbing touch-manipulation -m-2"
            title={translate('profile.photos.reorder_hint')}
          >
            <GripVertical className="w-4 h-4 text-white pointer-events-none" />
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
function DragOverlayCard({ photo, index, t }: { photo: PhotoSlot; index: number; t: (key: string) => string }) {
  const translate = typeof t === 'function' ? t : (key: string) => key;
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
          {translate('profile.photos.primary_photo')}
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-xs text-white truncate">{PHOTO_PROMPTS[index]}</p>
      </div>
    </Card>
  );
}

export function PhotoUpload({ photos, onPhotosChange, maxPhotos = 6 }: PhotoUploadProps) {
  const { t } = useTranslation();
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

    // Find the indices (use index i from findIndex so empty-${i} matches)
    const oldIndex = photos.findIndex((p, i) => (p.id || `empty-${i}`) === active.id);
    const newIndex = photos.findIndex((p, i) => (p.id || `empty-${i}`) === over.id);

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
            toast.error(t('profile.photos.order_failed'));
          } else {
            toast.success(t('profile.photos.order_updated'));
          }
        }
      } catch (error) {
        console.error('Error saving photo order:', error);
        toast.error(t('profile.photos.order_failed'));
      } finally {
        setSaving(false);
      }
    }
  }, [photos, onPhotosChange, user, t]);

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
      // Upload using Supabase client (handles auth and correct endpoint)
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) throw uploadError;

      // Simulate progress for UI (client upload doesn't expose progress)
      setUploadQueue(prev =>
        prev.map(item =>
          item.slotIndex === slotIndex ? { ...item, progress: 100 } : item
        )
      );

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

      const isBucketNotFound =
        error &&
        typeof error === 'object' &&
        (String((error as { message?: string }).message ?? '').toLowerCase().includes('bucket not found') ||
         String((error as { error?: string }).error ?? '').toLowerCase().includes('bucket not found'));

      const errorMessage = isBucketNotFound
        ? 'Fotouppladdning kräver att storage är konfigurerad. Kör supabase db push eller kör ONE_TIME_SETUP.sql i Supabase Dashboard.'
        : t('profile.photos.upload_failed');

      setUploadQueue(prev =>
        prev.map(item =>
          item.slotIndex === slotIndex
            ? { ...item, status: 'error' as const, error: errorMessage }
            : item
        )
      );

      toast.error(errorMessage, isBucketNotFound ? { duration: 8000 } : undefined);

      // Remove from queue after showing error
      setTimeout(() => {
        setUploadQueue(prev => prev.filter(item => item.slotIndex !== slotIndex));
      }, 2000);
    }
  }, [user, photos, onPhotosChange, t]);

  // Effect to process queue when it changes
  const queueRef = useRef(uploadQueue);
  queueRef.current = uploadQueue;

  // Smooth simulated progress (0 → 85%) while upload runs; Supabase client doesn't expose real upload progress
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    const hasUploading = uploadQueue.some((item) => item.status === 'uploading');
    if (hasUploading && !progressIntervalRef.current) {
      progressIntervalRef.current = setInterval(() => {
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.status === 'uploading' && item.progress < 85
              ? { ...item, progress: Math.min(85, item.progress + 6) }
              : item
          )
        );
      }, 180);
    }
    if (!hasUploading && progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [uploadQueue]);

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

      const validation = validateFile(file, t);
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
      toast.error(t('profile.photos.min_one_required'));
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
      toast.success(t('profile.photos.deleted'));
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('profile.photos.delete_failed'));
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

  // Determine if at max photos
  const isAtMaxPhotos = photoCount >= maxPhotos;

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Photo count indicator header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-medium">{t('profile.photos.title')}</h3>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                  <Info className="w-3 h-3 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-[200px] text-center">
                <p>Du kan ladda upp max {maxPhotos} foton. Det första fotot blir ditt huvudfoto.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-center gap-2">
            {isAtMaxPhotos ? (
              <Badge className="gradient-rose-glow text-white border-0 flex items-center gap-1 shadow-glow-rose/30">
                <Sparkles className="w-3 h-3" />
                Komplett
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-mono">
                {photoCount}/{maxPhotos}
              </Badge>
            )}
          </div>
        </div>

        <input
          id="photo-upload-input"
          name="profilePhotos"
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => selectedSlot !== null && handleUpload(e, selectedSlot)}
          aria-label="Ladda upp profilbilder"
        />

        <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 gap-3 p-3 rounded-xl glass-dark">
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
                  t={t}
                />
              );
            })}
          </div>
        </SortableContext>

        <DragOverlay>
          {activePhoto?.storage_path && activeIndex !== -1 && (
            <DragOverlayCard photo={activePhoto} index={activeIndex} t={t} />
          )}
        </DragOverlay>
      </DndContext>

      {/* Upload button - ShimmerButton */}
      <div className="flex justify-center">
        {isAtMaxPhotos ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-full max-w-xs">
                <ShimmerButton
                  variant="secondary"
                  size="default"
                  icon={Sparkles}
                  disabled
                  className="w-full opacity-70"
                >
                  Max antal foton uppnått
                </ShimmerButton>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Du har laddat upp max antal foton ({maxPhotos}). Ta bort ett foto för att ladda upp fler.</p>
            </TooltipContent>
          </Tooltip>
        ) : (
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
                toast.error('Du har laddat upp max antal foton');
              }
            }}
            disabled={hasActiveUploads}
            className="w-full max-w-xs"
          >
            {hasActiveUploads ? 'Laddar upp...' : 'Ladda upp foton'}
          </ShimmerButton>
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Ladda upp 4-6 foton. Max 5MB per bild. JPG, PNG eller WebP.
        </p>
        <p className="text-xs text-primary/70">
          Det första fotot blir ditt huvudfoto. Dra för att ändra ordning.
        </p>
        {isAtMaxPhotos && (
          <p className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3" />
            Grattis! Du har laddat upp alla foton.
          </p>
        )}
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
    </TooltipProvider>
  );
}
