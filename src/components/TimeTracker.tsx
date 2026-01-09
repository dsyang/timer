import { useState, useRef } from 'react';
import { useTimeTracker } from '../hooks/useTimeTracker';
import { TrackedItemCard } from './TrackedItemCard';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Clock, Archive, List, Download } from 'lucide-react';
import { downloadExport } from '../lib/database';

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6" />
              <h1 className="text-2xl font-bold">Time Tracker</h1>
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* View switcher */}
          <div className="flex gap-2">
            <Button
              onClick={() => actions.switchView('main')}
              variant={state.currentView === 'main' ? 'default' : 'outline'}
              className="flex-1"
            >
              <List className="w-4 h-4 mr-2" />
              Active
            </Button>
            <Button
              onClick={() => actions.switchView('archive')}
              variant={state.currentView === 'archive' ? 'default' : 'outline'}
              className="flex-1"
            >
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* Input form (only show in main view) */}
        {state.currentView === 'main' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Start Tracking</CardTitle>
              <CardDescription>
                Enter a description of what you want to track (1-140 characters)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-3">
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
                />
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    {inputValue.length}/140
                  </span>
                  <Button type="submit" disabled={inputValue.trim().length === 0}>
                    Start Timer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Items list */}
        <div className="space-y-4">
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
      <footer className="container max-w-2xl mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
        <p>All data is stored locally in your browser</p>
      </footer>
    </div>
  );
}
