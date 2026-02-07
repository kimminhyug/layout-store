import { computeLayout, type GridItem, type LayoutAction } from "layout-core";

export type { GridItem, LayoutAction } from "layout-core";

export type LayoutState = {
  items: GridItem[];
  columns: number;
};

export type LayoutStore = {
  getState(): LayoutState;
  dispatch(action: LayoutAction): void;
  subscribe(listener: () => void): () => void;
  undo(): void;
  redo(): void;
};

const getState = (current: LayoutState): LayoutState => ({
  items: [...current.items],
  columns: current.columns,
});

const dispatch = (
  state: { current: LayoutState; past: LayoutState[]; future: LayoutState[] },
  action: LayoutAction,
  notify: () => void,
): void => {
  const nextItems = computeLayout({
    items: state.current.items,
    action,
    columns: state.current.columns,
  });
  state.past.push({ ...state.current, items: [...state.current.items] });
  state.current = { items: nextItems, columns: state.current.columns };
  state.future.length = 0;
  notify();
};

const subscribe = (
  listeners: Array<() => void>,
  listener: () => void,
): (() => void) => {
  listeners.push(listener);
  return () => {
    const i = listeners.indexOf(listener);
    if (i !== -1) listeners.splice(i, 1);
  };
};

const undo = (
  state: { current: LayoutState; past: LayoutState[]; future: LayoutState[] },
  notify: () => void,
): void => {
  if (state.past.length === 0) return;
  state.future.push({ ...state.current, items: [...state.current.items] });
  const prev = state.past.pop()!;
  state.current = prev;
  notify();
};

const redo = (
  state: { current: LayoutState; past: LayoutState[]; future: LayoutState[] },
  notify: () => void,
): void => {
  if (state.future.length === 0) return;
  state.past.push({ ...state.current, items: [...state.current.items] });
  const next = state.future.pop()!;
  state.current = next;
  notify();
};

export const createLayoutStore = (initialState: LayoutState): LayoutStore => {
  const state: {
    current: LayoutState;
    past: LayoutState[];
    future: LayoutState[];
  } = {
    current: {
      items: [...initialState.items],
      columns: initialState.columns,
    },
    past: [],
    future: [],
  };

  const listeners: Array<() => void> = [];

  const notify = (): void => {
    for (const listener of listeners) listener();
  };

  return {
    getState: () => getState(state.current),
    dispatch: (action: LayoutAction) => dispatch(state, action, notify),
    subscribe: (listener: () => void) => subscribe(listeners, listener),
    undo: () => undo(state, notify),
    redo: () => redo(state, notify),
  };
};
