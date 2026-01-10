import { useState, useRef } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { TrackedItemCard } from './TrackedItemCard';
import { LiveClock } from './LiveClock';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Clock, Archive, List, Download, Database } from 'lucide-react';
import { downloadExport, downloadDatabaseFile } from '../lib/database';

export function TimeTracker() {
  const { state, actions } = useTimeTracker();
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = inputValue.trim();
    if (trimmed.length === 0) {
      setError('Name cannot be blank');
      return;
    }

    if (trimmed.length > 140) {
      setError('Name cannot exceed 140 characters');
      return;
    }

    try {
      actions.createItem(trimmed);
      setInputValue('');
      setError('');
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create item');
    }
  };

  const handleExport = () => {
    try {
      downloadExport();
    } catch (err) {
      console.error('Failed to export data:', err);
    }
  };

  const handleExportDatabase = () => {
    try {
      downloadDatabaseFile();
    } catch (err) {
      console.error('Failed to export database:', err);
    }
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="w-12 h-12 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background w-full" style={{ width: '-webkit-fill-available' }}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <h1 className="text-xl font-bold">Time Tracker</h1>
            </div>
          </div>

          {/* View switcher */}
          <div className="flex gap-2">
            <Button
              onClick={() => actions.switchView('main')}
              variant={state.currentView === 'main' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <List className="w-4 h-4 mr-1" />
              Active
            </Button>
            <Button
              onClick={() => actions.switchView('archive')}
              variant={state.currentView === 'archive' ? 'default' : 'outline'}
              size="sm"
              className="flex-1"
            >
              <Archive className="w-4 h-4 mr-1" />
              Archive
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="px-4 py-4">
        {/* Live Clock Card */}
        <Card className="mb-4">
          <CardContent className="py-2">
            <LiveClock />
          </CardContent>
        </Card>

        {/* Input form (only show in main view) */}
        {state.currentView === 'main' && (
          <Card className="mb-4">
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-2">
                <Input
                  ref={inputRef}
                  id="item-input"
                  type="text"
                  placeholder="What are you working on?"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setError('');
                  }}
                  maxLength={140}
                  className="w-full"
                  autoFocus
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {inputValue.length}/140
                  </span>
                  <Button type="submit" size="sm" disabled={inputValue.trim().length === 0}>
                    Start Timer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Items list */}
        <div className="space-y-3">
          {state.items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {state.currentView === 'main'
                    ? 'No active items. Start tracking something above!'
                    : 'No archived items yet.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            state.items.map((item) => (
              <TrackedItemCard
                key={item.id}
                item={item}
                currentTime={state.currentTime}
                onComplete={state.currentView === 'main' ? actions.completeItem : undefined}
                onArchive={state.currentView === 'main' ? actions.archiveItem : undefined}
                onUnarchive={state.currentView === 'archive' ? actions.unarchiveItem : undefined}
                onDelete={state.currentView === 'archive' ? actions.deleteItem : undefined}
              />
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="px-4 py-4 text-center">
        <p className="text-xs text-muted-foreground">All data is stored locally in your browser</p>
        <div className="flex justify-center gap-3 mt-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="w-3 h-3 mr-1" />
            JSON
          </button>
          <button
            onClick={handleExportDatabase}
            className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Database className="w-3 h-3 mr-1" />
            SQLite
          </button>
        </div>
      </footer>
    </div>
  );
}
