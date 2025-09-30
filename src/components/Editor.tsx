import React, { useEffect, useState, useRef } from "react";
import Editor, { useMonaco, OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { MdOutlineFullscreen } from "react-icons/md";
import { useFullScreen } from "@/context/FullScreenContext";

interface EditorProps {
  code: string;
  setCode: (value: string) => void;
}

type MonacoTheme = "pseudocode-dark" | "pseudocode-light";

export default function CodeEditor({ code, setCode }: EditorProps) {
  const monacoInstance = useMonaco();
  const { isFullScreen, setIsFullScreen } = useFullScreen();

  const [mounted, setMounted] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [theme, setTheme] = useState<MonacoTheme | null>(null);

  /* ---------------------------
     Detect initial theme
  --------------------------- */
  useEffect(() => {
    setMounted(true);
    const getInitialTheme = (): MonacoTheme => {
      if (typeof window !== "undefined") {
        return document.documentElement.classList.contains("dark")
          ? "pseudocode-dark"
          : "pseudocode-light";
      }
      return "pseudocode-light";
    };
    setTheme(getInitialTheme());
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
            [/[a-zA-Z_]\w*(?=\()/, "function"],
            [/[a-zA-Z_]\w*/, "identifier"],
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
        colors: {
          "editor.background": "#1C2433",
          "editorGutter.background": "#1E1E1E",
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
     Font size update
  --------------------------- */
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({ fontSize });
    }
  }, [fontSize]);

  /* ---------------------------
     Mount handler
  --------------------------- */
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;

    // attach zoom inside editor only
    const domNode = editor.getDomNode();
    if (domNode) {
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
      domNode.addEventListener("wheel", handleWheel, { passive: false });
    }
  };

  /* ---------------------------
     Fullscreen toggle
  --------------------------- */
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullScreen(true);
      }).catch((err) => {
        console.error("Error enabling fullscreen:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullScreen(false);
      }).catch((err) => {
        console.error("Error exiting fullscreen:", err);
      });
    }
  };

  if (!theme)
    return <div className="h-[400px] w-full bg-gray-100 dark:bg-[#1e1e1e]" />;

  return (
    <div className="relative h-[400px] w-full bg-gray-100 dark:bg-[#1e1e1e]">
      <Editor
        height="400px"
        language="pseudocode"
        theme={theme}
        value={code}
        onChange={(value) => setCode(value || "")}
        onMount={handleEditorMount}
        options={{
          fontSize,
          padding: { top: 10, bottom: 10 },
          tabSize: 4,
          insertSpaces: true,
          lineNumbersMinChars: 3,
          lineDecorationsWidth: 10,
          glyphMargin: false,
          lineNumbers: "on",
          folding: true,
          wordWrap: "on",
          detectIndentation: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          automaticLayout: true,
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
        }}
      />

      <button
        onClick={toggleFullScreen}
        className="absolute bottom-3 right-3 px-3 py-1.5 bg-gray-300 dark:bg-[#2D2D30] rounded flex items-center"
      >
        {isFullScreen ? "Exit" : "Full Screen"}
        <MdOutlineFullscreen size={16} className="ml-1" />
      </button>
    </div>
  );
}
