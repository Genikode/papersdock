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
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // compute initial theme BEFORE first paint to avoid white flash
  const getInitialTheme = (): MonacoTheme => {
    if (typeof window === "undefined") return "pseudocode-light";
    const html = document.documentElement;
    if (html.classList.contains("dark")) return "pseudocode-dark";
    if (html.classList.contains("light")) return "pseudocode-light";
    // fallback to system preference if you use Tailwind's 'media' strategy
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "pseudocode-dark"
      : "pseudocode-light";
  };

  const [theme, setTheme] = useState<MonacoTheme>(getInitialTheme);
  const [themesReady, setThemesReady] = useState(false);

  /* ---------------------------
     Register language + themes
  --------------------------- */
  useEffect(() => {
    if (!monacoInstance) return;

    // register language (once)
    if (!monacoInstance.languages.getLanguages().some((l) => l.id === "pseudocode")) {
      monacoInstance.languages.register({ id: "pseudocode" });
      monacoInstance.languages.setMonarchTokensProvider("pseudocode", {
        keywords: [
          "BEGIN","END","IF","ELSE","ENDIF","WHILE","ENDWHILE","REPEAT","UNTIL",
          "FOR","NEXT","CASE","FUNCTION","PROCEDURE","RETURN","DECLARE","CONSTANT",
          "INPUT","OUTPUT"
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

      // LIGHT THEME
      monacoInstance.editor.defineTheme("pseudocode-light", {
        base: "vs",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "0000FF", fontStyle: "bold" },
          { token: "function", foreground: "795E26" },
          { token: "identifier", foreground: "001080" },
          { token: "number", foreground: "098658" },
          { token: "string", foreground: "A31515" },
        ],
        colors: {
          "editor.background": "#FFFFFF",
          "editorGutter.background": "#FFFFFF",
          "editorLineNumber.foreground": "#6B7280",
          "editorLineNumber.activeForeground": "#111827",
        },
      });

      // DARK THEME — both editor & gutter #1E1E1E
      monacoInstance.editor.defineTheme("pseudocode-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "keyword", foreground: "569CD6", fontStyle: "bold" },
          { token: "function", foreground: "DCDCAA" },
          { token: "identifier", foreground: "9CDCFE" },
          { token: "number", foreground: "B5CEA8" },
          { token: "string", foreground: "CE9178" },
        ],
        colors: {
            "editor.background": "#1C2433",
            "editorGutter.background": "#1C2433",
          "editorLineNumber.foreground": "#9CA3AF",
          "editorLineNumber.activeForeground": "#FFFFFF",
        },
      });
    }

    setThemesReady(true);
  }, [monacoInstance]);

  /* ---------------------------
     Keep theme in sync with Tailwind + system
  --------------------------- */
  useEffect(() => {
    const computeTheme = (): MonacoTheme => {
      const html = document.documentElement;
      if (html.classList.contains("dark")) return "pseudocode-dark";
      if (html.classList.contains("light")) return "pseudocode-light";
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "pseudocode-dark"
        : "pseudocode-light";
    };

    // sync with <html class="dark">
    const observer = new MutationObserver(() => setTheme(computeTheme()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    // also sync with OS scheme if you use Tailwind's 'media'
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMedia = () => setTheme(computeTheme());
    mql.addEventListener?.("change", handleMedia);

    return () => {
      observer.disconnect();
      mql.removeEventListener?.("change", handleMedia);
    };
  }, []);

  /* ---------------------------
     Apply font size on change
  --------------------------- */
  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize });
  }, [fontSize]);

  /* ---------------------------
     Force editor layout on fullscreen change
  --------------------------- */
  useEffect(() => {
    // Force the editor to recalculate its layout when fullscreen changes
    if (editorRef.current) {
      setTimeout(() => {
        editorRef.current?.layout();
      }, 100);
    }
  }, [isFullScreen]);

  /* ---------------------------
     Mount handler (scope zoom to editor)
  --------------------------- */
  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;

    const node = editor.getDomNode();
    if (!node) return;

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

    node.addEventListener("wheel", handleWheel, { passive: false });

    // cleanup when editor disposes
    editor.onDidDispose(() => {
      node.removeEventListener("wheel", handleWheel);
    });
  };

  /* ---------------------------
     Fullscreen toggle
  --------------------------- */
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullScreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullScreen(false)).catch(console.error);
    }
  };

  // Wait until themes are defined to avoid flashing default 'vs'
  if (!themesReady) {
    return <div className={isFullScreen ? "h-full w-full bg-gray-100 dark:bg-[#1E1E1E]" : "h-[400px] w-full bg-gray-100 dark:bg-[#1E1E1E]"} />;
  }

  // Dynamic container and height based on fullscreen state
  const containerClass = isFullScreen 
    ? "relative h-full w-full bg-gray-100 dark:bg-[#1E1E1E]"
    : "relative h-[400px] w-full bg-gray-100 dark:bg-[#1E1E1E]";
  
  const editorHeight = isFullScreen ? "100%" : "400px";

  return (
    <div className={containerClass}>
      <Editor
        height={editorHeight}
        language="pseudocode"
        theme={theme}
        value={code}
        onChange={(v) => setCode(v || "")}
        onMount={handleEditorMount}
        options={{
          fontSize,
          padding: { top: 10, bottom: 10 },
          tabSize: 4,
          insertSpaces: true,
          detectIndentation: true,
          lineNumbers: "on",
          lineNumbersMinChars: 3,
          lineDecorationsWidth: 16, // extra gap between gutter and text
          glyphMargin: false,
          folding: true,
          wordWrap: "on",
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          automaticLayout: true,
          renderLineHighlight: "line",
          cursorBlinking: "smooth",
        }}
      />

      {/* Only show fullscreen button on desktop */}
      {!isMobile && (
        <button
          onClick={toggleFullScreen}
          className="absolute bottom-3 right-3 px-3 py-1.5 bg-gray-300 dark:bg-[#2D2D30] rounded flex items-center z-10"
        >
          {isFullScreen ? "Exit" : "Full Screen"}
          <MdOutlineFullscreen size={16} className="ml-1" />
        </button>
      )}
    </div>
  );
}