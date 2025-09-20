import React, { useEffect, useState } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

interface EditorProps {
  code: string;
  setCode: (value: string) => void;
}

export default function CodeEditor({ code, setCode }: EditorProps) {
  const monaco = useMonaco();
  const [theme, setTheme] = useState<"vs-dark" | "vs-light">("vs-light");

  useEffect(() => {
    if (!monaco) return;

    if (!monaco.languages.getLanguages().some((l) => l.id === "pseudocode")) {
      // 1️⃣ Register custom pseudocode language
      monaco.languages.register({ id: "pseudocode" });

      // 2️⃣ Define tokens
      monaco.languages.setMonarchTokensProvider("pseudocode", {
        keywords: [
          "BEGIN", "END", "IF", "ELSE", "ENDIF", "WHILE", "ENDWHILE",
          "REPEAT", "UNTIL", "FOR", "NEXT", "CASE", "FUNCTION", "PROCEDURE",
          "RETURN", "DECLARE", "CONSTANT", "INPUT", "OUTPUT"
        ],
        tokenizer: {
          root: [
            [/\b(BEGIN|END|IF|ELSE|ENDIF|WHILE|ENDWHILE|REPEAT|UNTIL|FOR|NEXT|CASE|FUNCTION|PROCEDURE|RETURN|DECLARE|CONSTANT|INPUT|OUTPUT)\b/, "keyword"],
            [/[a-zA-Z_]\w*(?=\()/, "function"], // function calls
            [/[a-zA-Z_]\w*/, "identifier"],     // identifiers/variables
            [/\d+/, "number"],
            [/".*?"/, "string"],
            [/'.*?'/, "string"],
          ],
        },
      });

      // 3️⃣ Define a light theme
      monaco.editor.defineTheme("pseudocode-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
          { token: "function", foreground: "795E26" },
          { token: "identifier", foreground: "001080" },
          { token: "number", foreground: "098658" },
          { token: "string", foreground: "a31515" },
        ],
        colors: {
          "editor.background": "#ffffff",
        },
      });

      // 4️⃣ Define a dark theme
      monaco.editor.defineTheme("pseudocode-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "569cd6", fontStyle: "bold" },
          { token: "function", foreground: "dcdcaa" },
          { token: "identifier", foreground: "9cdcfe" },
          { token: "number", foreground: "b5cea8" },
          { token: "string", foreground: "ce9178" },
        ],
        colors: {
          "editor.background": "#1e1e1e",
        },
      });

      // 5️⃣ Autocomplete provider
      monaco.languages.registerCompletionItemProvider("pseudocode", {
        provideCompletionItems: (model, position) => {
          const text = model.getValue();
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          // Variables from DECLARE
          const vars = Array.from(
            text.matchAll(/\bDECLARE\s+([a-zA-Z_]\w*)/g)
          ).map((m) => m[1]);

          // Functions/Procedures
          const funcs = Array.from(
            text.matchAll(/\b(?:FUNCTION|PROCEDURE)\s+([a-zA-Z_]\w*)/g)
          ).map((m) => m[1]);

          const keywords = [
            "BEGIN", "END", "IF", "ELSE", "ENDIF", "WHILE", "ENDWHILE",
            "REPEAT", "UNTIL", "FOR", "NEXT", "CASE", "FUNCTION", "PROCEDURE",
            "RETURN", "DECLARE", "CONSTANT", "INPUT", "OUTPUT"
          ];

          const suggestions = [
            ...keywords.map((k) => ({
              label: k,
              kind: monaco.languages.CompletionItemKind.Keyword,
              insertText: k,
              range,
            })),
            ...vars.map((v) => ({
              label: v,
              kind: monaco.languages.CompletionItemKind.Variable,
              insertText: v,
              range,
            })),
            ...funcs.map((f) => ({
              label: f,
              kind: monaco.languages.CompletionItemKind.Function,
              insertText: f + "()",
              range,
            })),
          ];

          return { suggestions };
        },
      });
    }
  }, [monaco]);

  // SSR-safe Tailwind theme sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    const getTheme = () =>
      document.documentElement.classList.contains("dark")
        ? "pseudocode-dark"
        : "pseudocode-light";
    setTheme(getTheme());

    const observer = new MutationObserver(() => setTheme(getTheme()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, []);

  return (
    <Editor
      height="300px"
      language="pseudocode"
      theme={theme}
      value={code}
      onChange={(value) => setCode(value || "")}
      options={{
        fontSize: 14,
        tabSize: 4,
        insertSpaces: true,
        detectIndentation: false,
        lineNumbers: "on",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        automaticLayout: true,
        renderLineHighlight: "line",
        cursorBlinking: "smooth",
      }}
    />
  );
}
