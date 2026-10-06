import { useCallback, useEffect, useState } from 'react';
import type { Lesson } from '../data/lessons';

const STORAGE_KEY = 'startsql:progress';

interface LessonProgress {
  completedTasks: string[];
  markedComplete?: boolean;
}

type ProgressState = Record<string, LessonProgress>;

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ProgressState) : {};
  } catch {
    return {};
  }
}

export function useProgress() {
  const [state, setState] = useState<ProgressState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  const markTaskComplete = useCallback((lessonId: string, taskId: string) => {
    setState((prev) => {
      const lesson = prev[lessonId] ?? { completedTasks: [] };
      if (lesson.completedTasks.includes(taskId)) return prev;
      return {
        ...prev,
        [lessonId]: {
          ...lesson,
          completedTasks: [...lesson.completedTasks, taskId],
        },
      };
    });
  }, []);

  const markLessonComplete = useCallback((lessonId: string) => {
    setState((prev) => {
      if (prev[lessonId]?.markedComplete) return prev;
      const lesson = prev[lessonId] ?? { completedTasks: [] };
      return {
        ...prev,
        [lessonId]: { ...lesson, markedComplete: true },
      };
    });
  }, []);

  const isTaskComplete = useCallback(
    (lessonId: string, taskId: string) =>
      state[lessonId]?.completedTasks.includes(taskId) ?? false,
    [state]
  );

  const isLessonComplete = useCallback(
    (lesson: Lesson): boolean => {
      const p = state[lesson.id];
      if (lesson.tasks.length === 0) {
        return p?.markedComplete === true;
      }
      return lesson.tasks.every((t) => p?.completedTasks.includes(t.id));
    },
    [state]
  );

  const completedLessonsCount = useCallback(
    (allLessons: Lesson[]) =>
      allLessons.filter((l) => isLessonComplete(l)).length,
    [isLessonComplete]
  );

  const totalLessonsCount = useCallback(
    (allLessons: Lesson[]) => allLessons.length,
    []
  );

  const reset = useCallback(() => {
    setState({});
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return {
    markTaskComplete,
    markLessonComplete,
    isTaskComplete,
    isLessonComplete,
    completedLessonsCount,
    totalLessonsCount,
    reset,
  };
}