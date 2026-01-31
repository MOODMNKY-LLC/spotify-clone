'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  durationSec: number;
  progress: number;
  onPlayPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onProgressChange: (value: number) => void;
  formatTime: (sec: number) => string;
}

const defaultFormatTime = (sec: number): string => {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
};

const defaultState: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  durationSec: 0,
  progress: 0,
  onPlayPause: () => {},
  onPrevious: () => {},
  onNext: () => {},
  onProgressChange: () => {},
  formatTime: defaultFormatTime,
};

type SetPlaybackState = (partial: Partial<PlaybackState>) => void;

const PlaybackStateContext = createContext<
  PlaybackState & { setPlaybackState: SetPlaybackState }
>({
  ...defaultState,
  setPlaybackState: () => {},
});

export function PlaybackStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PlaybackState>(defaultState);

  const setPlaybackState = useCallback((partial: Partial<PlaybackState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo(
    () => ({ ...state, setPlaybackState }),
    [state, setPlaybackState]
  );

  return (
    <PlaybackStateContext.Provider value={value}>
      {children}
    </PlaybackStateContext.Provider>
  );
}

export function usePlaybackState() {
  return useContext(PlaybackStateContext);
}
