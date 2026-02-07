import { createLayoutStore } from "./store";

const initial = { items: [], columns: 6 };

// 동일한 액션 시퀀스 → 동일한 상태 (deterministic)
const runSequence = (actions: Array<{ type: "add"; item: { id: string; x: number; y: number; w: number; h: number } }>) => {
  const store = createLayoutStore(initial);
  for (const a of actions) store.dispatch(a);
  return store.getState();
};

const add = (id: string, x: number, y: number, w: number, h: number) =>
  ({ type: "add" as const, item: { id, x, y, w, h } });

// createLayoutStore / getState
const store = createLayoutStore(initial);
const s0 = store.getState();
if (s0.items.length !== 0 || s0.columns !== 6) {
  throw new Error("getState: initial state");
}

// dispatch only via computeLayout
store.dispatch(add("a", 0, 0, 2, 1));
const s1 = store.getState();
if (s1.items.length !== 1 || s1.items[0].id !== "a") {
  throw new Error("dispatch: add");
}

// subscribe (multiple listeners)
let calls: number = 0;
const un1 = store.subscribe(() => { calls++; });
const un2 = store.subscribe(() => { calls++; });
store.dispatch(add("b", 2, 0, 1, 1));
if (calls !== 2) throw new Error("subscribe: both listeners");
un1();
store.dispatch(add("c", 0, 1, 1, 1));
const currentCalls: number = calls;
if (currentCalls !== 3) throw new Error("subscribe: one listener after unsubscribe");

// undo/redo (full layout state)
const beforeUndo = store.getState().items.length;
store.undo();
if (store.getState().items.length !== (beforeUndo - 1)) {
  throw new Error("undo: one step");
}
store.redo();
if (store.getState().items.length !== beforeUndo) {
  throw new Error("redo: restore");
}

// deterministic: same sequence → same state
const stateA = runSequence([add("x", 0, 0, 1, 1), add("y", 1, 0, 1, 1)]);
const stateB = runSequence([add("x", 0, 0, 1, 1), add("y", 1, 0, 1, 1)]);
if (
  stateA.items.length !== stateB.items.length ||
  stateA.items.some((it, i) => it.id !== stateB.items[i].id)
) {
  throw new Error("deterministic: same sequence must yield same state");
}

console.log("layout-store tests passed");
