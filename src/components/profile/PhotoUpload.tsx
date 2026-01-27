import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Plus, Trash2, Loader2, ImageIcon, GripVertical, Crown } from 'lucide-react';
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
        <div className="absolute inset-0 flex items-center justify-center bg-muted glass">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
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
  const [uploading, setUploading] = useState<number | null>(null);
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
        toast.success('Foto uppladdat!');
        return;
      }

      // Refresh photos for update case
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

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
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
            {photos.slice(0, maxPhotos).map((photo, index) => (
              <SortablePhotoCard
                key={photo.id || `slot-${index}`}
                photo={photo}
                index={index}
                isUploading={uploading === index}
                isDragging={activeId === (photo.id || `empty-${index}`)}
                isDeleting={deleting === index}
                canDelete={canDeletePhotos}
                onDeleteClick={handleDeleteClick}
                onUpload={triggerUpload}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay>
          {activePhoto?.storage_path && activeIndex !== -1 && (
            <DragOverlayCard photo={activePhoto} index={activeIndex} />
          )}
        </DragOverlay>
      </DndContext>

      <div className="text-center space-y-1">
        <p className="text-xs text-muted-foreground">
          Ladda upp 4-6 foton. Dra för att ändra ordning.
        </p>
        <p className="text-xs text-primary/70">
          Det första fotot blir ditt huvudfoto.
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
