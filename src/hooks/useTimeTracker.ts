import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initDatabase,
  getMainViewItems,
  getArchiveViewItems,
  createItem,
  completeItem,
  archiveItem,
  unarchiveItem,
  deleteItem,
  getCurrentUnixEpoch,
  TrackedItem
} from '../lib/database';

export type ViewType = 'main' | 'archive';

export interface ViewState {
  currentView: ViewType;
  items: TrackedItem[];
  currentTime: number;
  isLoading: boolean;
}

export function useTimeTracker() {
  const [state, setState] = useState<ViewState>({
    currentView: 'main',
    items: [],
    currentTime: getCurrentUnixEpoch(),
    isLoading: true
  });

  const lastTickTime = useRef(0);
  const animationFrameId = useRef<number>();

  // Initialize database and load initial data
  useEffect(() => {
    initDatabase().then(() => {
      loadMainView();
    });
  }, []);

  // Tick mechanism using requestAnimationFrame
  useEffect(() => {
    function tick() {
      const now = Math.floor(Date.now() / 1000);

      // Only update state when second changes
      if (now !== lastTickTime.current) {
        setState((prev) => ({ ...prev, currentTime: now }));
        lastTickTime.current = now;
      }

      animationFrameId.current = requestAnimationFrame(tick);
    }

    animationFrameId.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, []);

  const loadMainView = useCallback(() => {
    const items = getMainViewItems();
    setState({
      currentView: 'main',
      items,
      currentTime: getCurrentUnixEpoch(),
      isLoading: false
    });
  }, []);

  const loadArchiveView = useCallback(() => {
    const items = getArchiveViewItems();
    setState({
      currentView: 'archive',
      items,
      currentTime: getCurrentUnixEpoch(),
      isLoading: false
    });
  }, []);

  const handleCreateItem = useCallback((name: string) => {
    try {
      createItem(name);
      loadMainView();
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  }, [loadMainView]);

  const handleCompleteItem = useCallback((itemId: string) => {
    try {
      completeItem(itemId);
      loadMainView();
    } catch (error) {
      console.error('Failed to complete item:', error);
    }
  }, [loadMainView]);

  const handleArchiveItem = useCallback((itemId: string) => {
    try {
      archiveItem(itemId);
      loadMainView();
    } catch (error) {
      console.error('Failed to archive item:', error);
    }
  }, [loadMainView]);

  const handleUnarchiveItem = useCallback((itemId: string) => {
    try {
      unarchiveItem(itemId);
      loadArchiveView();
    } catch (error) {
      console.error('Failed to unarchive item:', error);
    }
  }, [loadArchiveView]);

  const handleDeleteItem = useCallback((itemId: string) => {
    try {
      deleteItem(itemId);
      loadArchiveView();
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  }, [loadArchiveView]);

  const switchView = useCallback((view: ViewType) => {
    if (view === 'main') {
      loadMainView();
    } else {
      loadArchiveView();
    }
  }, [loadMainView, loadArchiveView]);

  return {
    state,
    actions: {
      createItem: handleCreateItem,
      completeItem: handleCompleteItem,
      archiveItem: handleArchiveItem,
      unarchiveItem: handleUnarchiveItem,
      deleteItem: handleDeleteItem,
      switchView
    }
  };
}
