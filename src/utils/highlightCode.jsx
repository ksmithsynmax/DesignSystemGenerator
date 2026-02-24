export function highlightCode(code) {
  const tokens = [];
  let i = 0;

  while (i < code.length) {
    // Whitespace
    if (/\s/.test(code[i])) {
      let j = i;
      while (j < code.length && /\s/.test(code[j])) j++;
      tokens.push({ t: code.slice(i, j), c: null });
      i = j;
      continue;
    }
    // Strings
    if (code[i] === '"' || code[i] === "'") {
      const q = code[i];
      let j = i + 1;
      while (j < code.length && code[j] !== q) j++;
      tokens.push({ t: code.slice(i, j + 1), c: "#98C379" });
      i = j + 1;
      continue;
    }
    // JSX tag: <Component or </Component
    if (code[i] === "<" && /[A-Z/]/.test(code[i + 1] || "")) {
      let j = i + 1;
      if (code[j] === "/") j++;
      if (/[A-Z]/.test(code[j] || "")) {
        let k = j;
        while (k < code.length && /\w/.test(code[k])) k++;
        tokens.push({ t: code.slice(i, j), c: "#ABB2BF" });
        tokens.push({ t: code.slice(j, k), c: "#E06C75" });
        i = k;
        continue;
      }
    }
    // Self-closing />
    if (code[i] === "/" && code[i + 1] === ">") {
      tokens.push({ t: "/>", c: "#ABB2BF" });
      i += 2;
      continue;
    }
    // Closing >
    if (code[i] === ">") {
      tokens.push({ t: ">", c: "#ABB2BF" });
      i++;
      continue;
    }
    // Words (keywords, identifiers, attributes)
    if (/[a-zA-Z_$]/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\w$-]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const keywords = ["import", "from", "export", "const", "let", "return", "true", "false", "undefined", "null"];
      if (keywords.includes(word)) {
        tokens.push({ t: word, c: "#C678DD" });
      } else {
        // Look ahead for = to detect attributes
        let k = j;
        while (k < code.length && code[k] === " ") k++;
        if (code[k] === "=") {
          tokens.push({ t: word, c: "#D19A66" });
        } else {
          tokens.push({ t: word, c: "#E06C75" });
        }
      }
      i = j;
      continue;
    }
    // Numbers
    if (/\d/.test(code[i])) {
      let j = i;
      while (j < code.length && /[\d.]/.test(code[j])) j++;
      tokens.push({ t: code.slice(i, j), c: "#D19A66" });
      i = j;
      continue;
    }
    // Punctuation
    tokens.push({ t: code[i], c: "#56B6C2" });
    i++;
  }

  return tokens.map((tk, idx) => (
    <span key={idx} style={tk.c ? { color: tk.c } : undefined}>{tk.t}</span>
  ));
}
