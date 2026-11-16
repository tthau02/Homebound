import React, { useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Target } from 'lucide-react';
import { useStoryStore } from '../../stores/useStoryStore';
import { useMultiplayerStore } from '../../stores/useMultiplayerStore';
import { useHudStore } from '../../stores/useHudStore';
import { useInteractionStore } from '../../stores/useInteractionStore';
import {
  advanceDialogue,
  buildStoryContext,
  getActiveChapter,
  getVisibleChoices,
} from '../../game/story/storyEngine';
import { Kbd, Panel } from '../ui/primitives';

/** Right-side objective tracker (collapsible). */
export const ObjectiveTracker: React.FC = () => {
  const enabled = useStoryStore((s) => s.enabled);
  const activeObjectives = useStoryStore((s) => s.activeObjectives);
  const isOnlineMode = useMultiplayerStore((s) => s.isOnlineMode);
  const collapsed = useHudStore((s) => s.objectivesCollapsed);
  const toggleCollapsed = useHudStore((s) => s.toggleObjectivesCollapsed);

  if (!enabled || isOnlineMode || activeObjectives.length === 0) return null;
  const chapter = getActiveChapter();
  const objectives = activeObjectives
    .map((id) => chapter.objectives[id])
    .filter((o): o is NonNullable<typeof o> => Boolean(o))
    .sort((a, b) => Number(Boolean(a.optional)) - Number(Boolean(b.optional)));

  return (
    <Panel className="pointer-events-auto w-[min(300px,calc(100vw-1.5rem))] animate-fade-in overflow-hidden">
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-expanded={!collapsed}
        className="flex w-full items-center gap-2 px-3.5 py-2.5 text-left hover:bg-white/[0.04]"
      >
        <Target className="h-4 w-4 shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-wider text-ink-300">
          {chapter.title}
        </span>
        {collapsed ? <ChevronDown className="h-4 w-4 text-ink-400" /> : <ChevronUp className="h-4 w-4 text-ink-400" />}
      </button>
      {!collapsed && (
        <ul className="space-y-2.5 border-t border-white/[0.06] px-3.5 py-3">
          {objectives.map((o) => (
            <li key={o.id} className="flex gap-2.5">
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rotate-45 ${o.optional ? 'border border-ink-300' : 'bg-accent'}`}
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-snug text-white">
                  {o.title}
                  {o.optional && <span className="ml-1.5 text-xs font-medium text-ink-400">(phụ)</span>}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-300">{o.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

/** Visual-novel style dialogue box. Space/Enter continues, 1–3 picks a choice. */
export const StoryDialog: React.FC = () => {
  const dialogue = useStoryStore((s) => s.dialogue);
  const flags = useStoryStore((s) => s.flags);

  const node = useMemo(() => {
    if (!dialogue) return null;
    return getActiveChapter().dialogues[dialogue.dialogueId]?.nodes[dialogue.nodeId] ?? null;
  }, [dialogue]);

  // Choices depend on flags (e.g. remaining bánh mì), so recompute when they change
  const choices = useMemo(
    () => (node ? getVisibleChoices(node, buildStoryContext()) : []),
    [node, flags]
  );

  useEffect(() => {
    if (!node) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (choices.length > 0) {
        const n = Number.parseInt(e.key, 10);
        if (n >= 1 && n <= choices.length) {
          e.preventDefault();
          advanceDialogue(n - 1);
        }
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        advanceDialogue();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [node, choices]);

  // Opening a dialogue closes any passenger popup underneath it
  useEffect(() => {
    if (node) useInteractionStore.getState().closeCharacterInteraction();
  }, [node]);

  if (!node) return null;
  const isNarrator = node.speaker === 'Dẫn truyện';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center px-3 pb-4 sm:pb-8">
      <div
        key={`${dialogue?.dialogueId}-${dialogue?.nodeId}`}
        className="pointer-events-auto w-full max-w-2xl animate-slide-up rounded-2xl border border-white/10 bg-ink-950/[0.94] shadow-hud backdrop-blur-md"
        role="dialog"
        aria-live="polite"
        aria-label={node.speaker}
      >
        <div className="flex gap-4 p-4 sm:p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ink-800 text-2xl" aria-hidden>
            {node.portrait}
          </div>
          <div className="min-w-0 flex-1">
            <p className={`text-sm font-semibold ${isNarrator ? 'text-ink-400' : 'text-accent-soft'}`}>{node.speaker}</p>
            <p className={`mt-1 text-base leading-relaxed ${isNarrator ? 'italic text-ink-200' : 'text-white'}`}>{node.text}</p>
          </div>
        </div>

        {choices.length > 0 ? (
          <div className="grid gap-2 border-t border-white/[0.06] p-3 sm:p-4">
            {choices.map((c, i) => (
              <button
                key={c.label}
                type="button"
                onClick={() => advanceDialogue(i)}
                className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-ink-800/70 px-3.5 py-2.5 text-left text-sm font-medium text-ink-100 transition-colors hover:border-accent/60 hover:bg-ink-700"
              >
                <Kbd>{i + 1}</Kbd>
                <span>{c.label}</span>
              </button>
            ))}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => advanceDialogue()}
            className="flex w-full items-center justify-end gap-2 border-t border-white/[0.06] px-5 py-2.5 text-xs font-medium text-ink-300 hover:text-white"
          >
            Tiếp tục <Kbd>Space</Kbd>
          </button>
        )}
      </div>
    </div>
  );
};

/** Letterbox bars + location caption during story cinematics. */
export const CinematicOverlay: React.FC = () => {
  const cinematic = useStoryStore((s) => s.cinematic);
  const visible = cinematic !== null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-20">
      <div
        className={`absolute inset-x-0 top-0 h-[11vh] bg-black transition-transform duration-500 ${
          visible ? 'translate-y-0' : '-translate-y-full'
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 h-[11vh] bg-black transition-transform duration-500 ${
          visible ? 'translate-y-0' : 'translate-y-full'
        }`}
      />
      {cinematic?.caption && (
        <p className="absolute inset-x-0 top-[13vh] animate-fade-in text-center text-lg font-semibold tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] sm:text-2xl">
          {cinematic.caption}
        </p>
      )}
    </div>
  );
};

/** Centered transient status message (replaces the old corner toast). */
export const ToastLayer: React.FC = () => {
  const statusToast = useInteractionStore((s) => s.statusToast);
  if (!statusToast) return null;
  return (
    <div className="pointer-events-none flex justify-center px-3">
      <div
        key={statusToast}
        role="status"
        className="hud-panel max-w-lg animate-fade-in px-4 py-2 text-center text-sm font-medium text-ink-100"
      >
        {statusToast}
      </div>
    </div>
  );
};
