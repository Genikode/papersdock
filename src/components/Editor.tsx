import React, { useEffect, useState, useRef } from "react";
import Editor, { useMonaco, OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";

interface EditorProps {
  code: string;
  setCode: (value: string) => void;
}

type MonacoTheme = "pseudocode-dark" | "pseudocode-light";

export default function CodeEditor({ code, setCode }: EditorProps) {
  const monacoInstance = useMonaco();
  const [theme, setTheme] = useState<MonacoTheme | null>(null);
  const [mounted, setMounted] = useState(false);

  // zoom state
  const [fontSize, setFontSize] = useState(14);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

  /* ---------------------------
     Detect initial theme
  --------------------------- */
  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined") {
      setTheme(
        document.documentElement.classList.contains("dark")
          ? "pseudocode-dark"
          : "pseudocode-light"
      );
    }
  }, []);

  /* ---------------------------
     Register language + themes
  --------------------------- */
  useEffect(() => {
    if (!monacoInstance) return;

    if (!monacoInstance.languages.getLanguages().some((l) => l.id === "pseudocode")) {
      monacoInstance.languages.register({ id: "pseudocode" });

      monacoInstance.languages.setMonarchTokensProvider("pseudocode", {
        keywords: [
          "BEGIN", "END", "IF", "ELSE", "ENDIF", "WHILE", "ENDWHILE", "REPEAT", "UNTIL",
          "FOR", "NEXT", "CASE", "FUNCTION", "PROCEDURE", "RETURN", "DECLARE", "CONSTANT",
          "INPUT", "OUTPUT"
        ],
        tokenizer: {
          root: [
            [/\b(BEGIN|END|IF|ELSE|ENDIF|WHILE|ENDWHILE|REPEAT|UNTIL|FOR|NEXT|CASE|FUNCTION|PROCEDURE|RETURN|DECLARE|CONSTANT|INPUT|OUTPUT)\b/, "keyword"],
            [/[a-zA-Z_]\w*(?=\()/, "function"], // function calls
            [/[a-zA-Z_]\w*/, "identifier"],     // variables/identifiers
            [/\d+/, "number"],
            [/".*?"/, "string"],
            [/'.*?'/, "string"],
          ],
        },
      });

      monacoInstance.editor.defineTheme("pseudocode-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "0000ff", fontStyle: "bold" },
          { token: "function", foreground: "795E26" },
          { token: "identifier", foreground: "001080" },
          { token: "number", foreground: "098658" },
          { token: "string", foreground: "a31515" },
        ],
        colors: { "editor.background": "#ffffff" },
      });

      monacoInstance.editor.defineTheme("pseudocode-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "569cd6", fontStyle: "bold" },
          { token: "function", foreground: "dcdcaa" },
          { token: "identifier", foreground: "9cdcfe" },
          { token: "number", foreground: "b5cea8" },
          { token: "string", foreground: "ce9178" },
        ],
        colors: { "editor.background": "#1e1e1e" },
      });

      /* ---------------------------
         Register Autocomplete Provider
      --------------------------- */
      monacoInstance.languages.registerCompletionItemProvider("pseudocode", {
        provideCompletionItems: (model, position) => {
          const text = model.getValue();
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };

          // Extract variables declared with DECLARE
          const vars = Array.from(
            text.matchAll(/\bDECLARE\s+([a-zA-Z_]\w*)/g)
          ).map((m) => m[1]);

          // Extract custom functions/procedures
          const funcs = Array.from(
            text.matchAll(/\b(?:FUNCTION|PROCEDURE)\s+([a-zA-Z_]\w*)/g)
          ).map((m) => m[1]);

          const keywords = [
            "BEGIN", "END", "IF", "ELSE", "ENDIF", "WHILE", "ENDWHILE", "REPEAT",
            "UNTIL", "FOR", "NEXT", "CASE", "FUNCTION", "PROCEDURE", "RETURN",
            "DECLARE", "CONSTANT", "INPUT", "OUTPUT"
          ];

          const suggestions = [
            ...keywords.map((k) => ({
              label: k,
              kind: monacoInstance.languages.CompletionItemKind.Keyword,
              insertText: k,
              range,
            })),
            ...vars.map((v) => ({
              label: v,
              kind: monacoInstance.languages.CompletionItemKind.Variable,
              insertText: v,
              range,
            })),
            ...funcs.map((f) => ({
              label: f,
              kind: monacoInstance.languages.CompletionItemKind.Function,
              insertText: f + "()",
              range,
            })),
          ];

          return { suggestions };
        },
      });
    }
  }, [monacoInstance]);

  /* ---------------------------
     Theme sync with Tailwind
  --------------------------- */
  useEffect(() => {
    if (!mounted) return;
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
  }, [mounted]);

  /* ---------------------------
     Zoom shortcuts
  --------------------------- */
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        setFontSize((prev) => {
          let next = prev + (e.deltaY < 0 ? 1 : -1);
          if (next < 8) next = 8;
          if (next > 40) next = 40;
          return next;
        });
      }
    };
    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === "+" || e.key === "=")) {
        e.preventDefault();
        setFontSize((prev) => Math.min(prev + 1, 40));
      }
      if (e.ctrlKey && e.key === "-") {
        e.preventDefault();
        setFontSize((prev) => Math.max(prev - 1, 8));
      }
      if (e.ctrlKey && e.key === "0") {
        e.preventDefault();
        setFontSize(14);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // apply font size
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
  };

  if (!theme)
    return <div className="h-[400px] w-full bg-gray-100 dark:bg-[#1e1e1e]" />;

  return (
    <Editor
      height="400px"
      language="pseudocode"
      theme={theme}
      value={code}
      onChange={(value) => setCode(value || "")}
      onMount={handleEditorMount}
      options={{
        fontSize,
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
