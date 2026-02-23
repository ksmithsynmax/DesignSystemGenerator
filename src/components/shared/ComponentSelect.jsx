import { useState, useRef, useEffect } from "react";

export default function ComponentSelect({
  options,
  value,
  onChange,
  displayValue,
  placeholder = "Search...",
  onAdd,
  addLabel = "+ Add new",
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const inputRef = useRef(null);
  const addInputRef = useRef(null);
  const containerRef = useRef(null);

  const filtered = search
    ? options.filter((o) => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (adding && addInputRef.current) addInputRef.current.focus();
  }, [adding]);

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
        setAdding(false);
        setNewName("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(opt) {
    onChange(opt);
    setOpen(false);
    setSearch("");
  }

  function handleKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      setSearch("");
      setAdding(false);
      setNewName("");
    }
    if (e.key === "Enter" && filtered.length === 1) {
      handleSelect(filtered[0]);
    }
  }

  function handleAddSubmit() {
    const trimmed = newName.trim();
    if (trimmed && onAdd) {
      onAdd(trimmed);
      setAdding(false);
      setNewName("");
      setOpen(false);
      setSearch("");
    }
  }

  function handleAddKeyDown(e) {
    if (e.key === "Enter") handleAddSubmit();
    if (e.key === "Escape") {
      setAdding(false);
      setNewName("");
    }
  }

  return (
    <div ref={containerRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: "#25262B",
          border: "1px solid #373A40",
          borderRadius: 6,
          padding: "6px 28px 6px 12px",
          fontSize: 13,
          fontWeight: 600,
          color: "#E9ECEF",
          cursor: "pointer",
          fontFamily: "monospace",
          textTransform: "capitalize",
          minWidth: 140,
          textAlign: "left",
          position: "relative",
        }}
      >
        {displayValue || value}
        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? "180deg" : "0deg"})`,
            fontSize: 10,
            color: "#5C5F66",
            transition: "transform 0.15s",
          }}
        >
          ▼
        </span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            background: "#25262B",
            border: "1px solid #373A40",
            borderRadius: 6,
            minWidth: 200,
            maxHeight: 320,
            overflow: "hidden",
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{ padding: "6px 8px", borderBottom: "1px solid #2C2E33" }}
          >
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              style={{
                width: "100%",
                background: "#1A1B1E",
                border: "1px solid #373A40",
                borderRadius: 4,
                padding: "6px 8px",
                fontSize: 12,
                fontFamily: "monospace",
                color: "#C1C2C5",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ overflowY: "auto", maxHeight: 230 }}>
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "12px 12px",
                  fontSize: 12,
                  color: "#5C5F66",
                  fontStyle: "italic",
                }}
              >
                No results found
              </div>
            )}
            {filtered.map((opt) => (
              <button
                key={opt}
                onClick={() => handleSelect(opt)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: opt === value ? "#373A40" : "transparent",
                  border: "none",
                  padding: "8px 12px",
                  fontSize: 12,
                  fontFamily: "monospace",
                  color: opt === value ? "#E9ECEF" : "#C1C2C5",
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
                onMouseEnter={(e) => {
                  if (opt !== value)
                    e.currentTarget.style.background = "#2C2E33";
                }}
                onMouseLeave={(e) => {
                  if (opt !== value)
                    e.currentTarget.style.background = "transparent";
                }}
              >
                {opt}
              </button>
            ))}
          </div>

          {onAdd && (
            <div
              style={{
                borderTop: "1px solid #2C2E33",
                padding: "6px 8px",
              }}
            >
              {adding ? (
                <div style={{ display: "flex", gap: 4 }}>
                  <input
                    ref={addInputRef}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={handleAddKeyDown}
                    placeholder="Name..."
                    style={{
                      flex: 1,
                      background: "#1A1B1E",
                      border: "1px solid #373A40",
                      borderRadius: 4,
                      padding: "5px 8px",
                      fontSize: 12,
                      fontFamily: "monospace",
                      color: "#C1C2C5",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={handleAddSubmit}
                    style={{
                      background: "#228BE6",
                      border: "none",
                      borderRadius: 4,
                      padding: "5px 10px",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: "pointer",
                    }}
                  >
                    Add
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setAdding(true)}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    background: "transparent",
                    border: "none",
                    padding: "6px 4px",
                    fontSize: 12,
                    color: "#4DABF7",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#2C2E33")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {addLabel}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
