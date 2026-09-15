import { useRef, useEffect, useState } from "react";

// A hardened number input, shared by EVERY editable numeric token field so the
// long-standing "the value jumps back and forth until the app crashes" bug can
// never re-appear in a one-off input again. It had two independent causes:
//
//   1. Scroll/trackpad momentum spinning a focused <input type="number"> — React's
//      onWheel is passive, so we attach a native NON-passive listener and block
//      the browser's default increment/decrement outright.
//   2. The input being CONTROLLED directly by the globally-resolved token value.
//      Any re-render that re-resolved to a slightly different value (persistence
//      echo, spinner auto-repeat, etc.) would yank the visible number while the
//      user was still editing — the "13 <-> 12" oscillation. We break that by
//      buffering the user's keystrokes locally while the field is focused and
//      only mirroring the external value when it is NOT focused. Because the
//      displayed value can no longer be overwritten mid-edit, the input can
//      never become a feedback driver.
//
// onChange receives the native input event (parity with a plain <input>).
export default function NumberField({ value, onChange, style, disabled, min, max }) {
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const blockWheel = (e) => e.preventDefault();
    el.addEventListener("wheel", blockWheel, { passive: false });
    return () => el.removeEventListener("wheel", blockWheel);
  }, []);

  const shown = focused ? draft : value ?? "";

  return (
    <input
      ref={ref}
      type="number"
      value={shown}
      disabled={disabled}
      min={min}
      max={max}
      onFocus={() => {
        setDraft(value == null ? "" : String(value));
        setFocused(true);
      }}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        setDraft(e.target.value);
        onChange(e);
      }}
      style={style}
    />
  );
}
