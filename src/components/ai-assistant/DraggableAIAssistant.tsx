/**
 * Draggable AI Assistant Component
 * A floating, draggable AI chat panel with persist position and resize support
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, useDragControls, PanInfo } from 'framer-motion';
import {
  Bot,
  X,
  Maximize2,
  Minimize2,
  GripVertical,
  MessageSquare,
  Pin,
  PinOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AIAssistantChat } from './AIAssistantChat';

// ============================================
// Types
// ============================================

interface Position {
  x: number;
  y: number;
}

interface Size {
  width: number;
  height: number;
}

interface DraggableAIAssistantProps {
  defaultOpen?: boolean;
  defaultPosition?: Position;
  defaultSize?: Size;
  persistPosition?: boolean;
  persistKey?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

interface PersistedState {
  position: Position;
  size: Size;
  isExpanded: boolean;
  isPinned: boolean;
}

// ============================================
// Constants
// ============================================

const DEFAULT_SIZE: Size = { width: 380, height: 520 };
const EXPANDED_SIZE: Size = { width: 600, height: 700 };
const MIN_SIZE: Size = { width: 320, height: 400 };
const MAX_SIZE: Size = { width: 800, height: 900 };
const STORAGE_KEY = 'trustlayer_ai_assistant_state';
const SNAP_THRESHOLD = 20;

// ============================================
// Hooks
// ============================================

function usePersistedState(key: string, enabled: boolean): [PersistedState | null, (state: PersistedState) => void] {
  const [state, setState] = useState<PersistedState | null>(null);

  useEffect(() => {
    if (!enabled) return;

    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (error) {
      console.warn('Failed to load persisted AI assistant state:', error);
    }
  }, [key, enabled]);

  const saveState = useCallback((newState: PersistedState) => {
    setState(newState);
    if (enabled) {
      try {
        localStorage.setItem(key, JSON.stringify(newState));
      } catch (error) {
        console.warn('Failed to persist AI assistant state:', error);
      }
    }
  }, [key, enabled]);

  return [state, saveState];
}

function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  useEffect(() => {
    const handleResize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

// ============================================
// Component
// ============================================

export function DraggableAIAssistant({
  defaultOpen = false,
  defaultPosition,
  defaultSize,
  persistPosition = true,
  persistKey = STORAGE_KEY,
  className,
  onOpenChange,
}: DraggableAIAssistantProps) {
  const { t } = useTranslation();
  const windowSize = useWindowSize();
  const dragControls = useDragControls();
  const containerRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  const [persistedState, savePersistedState] = usePersistedState(persistKey, persistPosition);

  // State
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isExpanded, setIsExpanded] = useState(persistedState?.isExpanded || false);
  const [isPinned, setIsPinned] = useState(persistedState?.isPinned || false);
  const [isResizing, setIsResizing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Calculate initial position (bottom-right corner by default)
  const getDefaultPosition = useCallback((): Position => {
    if (defaultPosition) return defaultPosition;
    if (persistedState?.position) return persistedState.position;

    const currentSize = isExpanded ? EXPANDED_SIZE : (defaultSize || DEFAULT_SIZE);
    return {
      x: windowSize.width - currentSize.width - 24,
      y: windowSize.height - currentSize.height - 24,
    };
  }, [defaultPosition, persistedState?.position, windowSize, isExpanded, defaultSize]);

  const [position, setPosition] = useState<Position>(getDefaultPosition);
  const [size, setSize] = useState<Size>(
    persistedState?.size || defaultSize || DEFAULT_SIZE
  );

  // Update position when window resizes
  useEffect(() => {
    setPosition(prev => ({
      x: Math.min(Math.max(0, prev.x), windowSize.width - size.width - 10),
      y: Math.min(Math.max(0, prev.y), windowSize.height - size.height - 10),
    }));
  }, [windowSize, size]);

  // Handle open state change
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    onOpenChange?.(open);
  };

  // Handle drag end
  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    let newX = position.x + info.offset.x;
    let newY = position.y + info.offset.y;

    // Snap to edges
    if (newX < SNAP_THRESHOLD) newX = 10;
    if (newY < SNAP_THRESHOLD) newY = 10;
    if (windowSize.width - newX - size.width < SNAP_THRESHOLD) {
      newX = windowSize.width - size.width - 10;
    }
    if (windowSize.height - newY - size.height < SNAP_THRESHOLD) {
      newY = windowSize.height - size.height - 10;
    }

    const newPosition = { x: newX, y: newY };
    setPosition(newPosition);

    // Persist state
    savePersistedState({
      position: newPosition,
      size,
      isExpanded,
      isPinned,
    });
  };

  // Handle resize
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const currentY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;

      const newWidth = Math.min(MAX_SIZE.width, Math.max(MIN_SIZE.width, startWidth + (currentX - startX)));
      const newHeight = Math.min(MAX_SIZE.height, Math.max(MIN_SIZE.height, startHeight + (currentY - startY)));

      setSize({ width: newWidth, height: newHeight });
    };

    const handleEnd = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);

      // Persist state
      savePersistedState({
        position,
        size,
        isExpanded,
        isPinned,
      });
    };

    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);
  };

  // Toggle expanded
  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);

    const newSize = newExpanded ? EXPANDED_SIZE : DEFAULT_SIZE;
    setSize(newSize);

    // Adjust position if needed
    const newPosition = {
      x: Math.min(position.x, windowSize.width - newSize.width - 10),
      y: Math.min(position.y, windowSize.height - newSize.height - 10),
    };
    setPosition(newPosition);

    savePersistedState({
      position: newPosition,
      size: newSize,
      isExpanded: newExpanded,
      isPinned,
    });
  };

  // Toggle pinned
  const togglePinned = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);

    savePersistedState({
      position,
      size,
      isExpanded,
      isPinned: newPinned,
    });
  };

  // Reset position
  const resetPosition = () => {
    const newPosition = {
      x: windowSize.width - size.width - 24,
      y: windowSize.height - size.height - 24,
    };
    setPosition(newPosition);

    savePersistedState({
      position: newPosition,
      size,
      isExpanded,
      isPinned,
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={() => handleOpenChange(true)}
        className={cn(
          "fixed bottom-20 right-4 sm:bottom-6 sm:right-6 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg z-50",
          "bg-primary text-primary-foreground",
          "hover:scale-110 transition-transform active:scale-95",
          "flex items-center justify-center",
          isOpen && "hidden",
          className
        )}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
      >
        <Bot className="h-5 w-5 sm:h-6 sm:w-6" />
        <span className="sr-only">{t('aiAssistant.openButton', 'Open AI Assistant')}</span>
      </motion.button>

      {/* Draggable Chat Panel */}
      {isOpen && (
        <motion.div
          ref={containerRef}
          className={cn(
            "fixed z-50 bg-background rounded-xl shadow-2xl border overflow-hidden",
            "flex flex-col",
            isDragging && "cursor-grabbing select-none",
            isResizing && "select-none"
          )}
          style={{
            width: size.width,
            height: size.height,
            x: position.x,
            y: position.y,
          }}
          drag={!isPinned}
          dragControls={dragControls}
          dragMomentum={false}
          dragElastic={0}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={handleDragEnd}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Header / Drag Handle */}
          <div
            className={cn(
              "flex items-center justify-between px-3 py-2 border-b bg-muted/50",
              !isPinned && "cursor-grab active:cursor-grabbing"
            )}
            onPointerDown={(e) => {
              if (!isPinned) {
                dragControls.start(e);
              }
            }}
          >
            <div className="flex items-center gap-2">
              {!isPinned && (
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              )}
              <MessageSquare className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {t('aiAssistant.title', 'AI Assistant')}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={togglePinned}
                title={isPinned ? t('aiAssistant.unpin', 'Unpin') : t('aiAssistant.pin', 'Pin in place')}
              >
                {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={toggleExpanded}
                title={isExpanded ? t('aiAssistant.minimize', 'Minimize') : t('aiAssistant.expand', 'Expand')}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => handleOpenChange(false)}
                title={t('aiAssistant.close', 'Close')}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          <div className="flex-1 overflow-hidden">
            <AIAssistantChat />
          </div>

          {/* Resize Handle */}
          <div
            ref={resizeRef}
            className={cn(
              "absolute bottom-0 right-0 w-4 h-4 cursor-se-resize",
              "opacity-0 hover:opacity-100 transition-opacity",
              isResizing && "opacity-100"
            )}
            onMouseDown={handleResizeStart}
            onTouchStart={handleResizeStart}
          >
            <svg
              className="w-4 h-4 text-muted-foreground"
              viewBox="0 0 16 16"
              fill="currentColor"
            >
              <path d="M14 14H12V12H14V14ZM14 10H12V8H14V10ZM10 14H8V12H10V14Z" />
            </svg>
          </div>
        </motion.div>
      )}
    </>
  );
}

// ============================================
// Keyboard Shortcuts Hook
// ============================================

export function useAIAssistantShortcuts(onToggle: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + A to toggle AI Assistant
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        onToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onToggle]);
}
