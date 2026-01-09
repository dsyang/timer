import { memo, useState } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Check, Archive, ArchiveRestore, Trash2 } from 'lucide-react';
import { TrackedItem } from '../lib/database';
import { formatTime, formatDuration } from '../lib/database';

interface TrackedItemCardProps {
  item: TrackedItem;
  currentTime: number;
  onComplete?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const TrackedItemCard = memo(({
  item,
  currentTime,
  onComplete,
  onArchive,
  onUnarchive,
  onDelete
}: TrackedItemCardProps) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Compute display values at render time
  const startTime = formatTime(
    item.start_time,
    item.start_timezone_offset,
    item.start_timezone
  );

  const completedTime = item.completed_time && item.completed_timezone && item.completed_timezone_offset
    ? formatTime(
        item.completed_time,
        item.completed_timezone_offset,
        item.completed_timezone
      )
    : null;

  const elapsedTime = item.state === 'in_progress'
    ? formatDuration(currentTime - item.start_time)
    : item.completed_time
    ? formatDuration(item.completed_time - item.start_time)
    : '00:00:00';

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete) {
      onDelete(item.id);
    }
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Item name */}
          <h3 className="text-lg font-medium break-words">{item.name}</h3>

          {/* Elapsed time */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Elapsed:</span>
            <span className="text-2xl font-mono font-bold tabular-nums">
              {elapsedTime}
            </span>
          </div>

          {/* Timestamps */}
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Started:</span>
              <span className="font-mono">{startTime}</span>
            </div>
            {completedTime && (
              <div className="flex justify-between">
                <span>Completed:</span>
                <span className="font-mono">{completedTime}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!showDeleteConfirm && (
            <div className="flex gap-2 pt-2">
              {item.state === 'in_progress' && onComplete && (
                <Button
                  onClick={() => onComplete(item.id)}
                  className="flex-1"
                  variant="default"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Complete
                </Button>
              )}

              {item.state === 'completed' && onArchive && (
                <Button
                  onClick={() => onArchive(item.id)}
                  className="flex-1"
                  variant="secondary"
                >
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              )}

              {item.state === 'archived' && (
                <>
                  {onUnarchive && (
                    <Button
                      onClick={() => onUnarchive(item.id)}
                      className="flex-1"
                      variant="secondary"
                    >
                      <ArchiveRestore className="w-4 h-4 mr-2" />
                      Unarchive
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      onClick={handleDeleteClick}
                      className="flex-1"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Delete confirmation */}
          {showDeleteConfirm && (
            <div className="space-y-2 pt-2">
              <p className="text-sm text-destructive font-medium">
                Are you sure you want to delete this item? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleConfirmDelete}
                  className="flex-1"
                  variant="destructive"
                >
                  Confirm Delete
                </Button>
                <Button
                  onClick={handleCancelDelete}
                  className="flex-1"
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

TrackedItemCard.displayName = 'TrackedItemCard';
