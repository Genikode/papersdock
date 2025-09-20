"use client";
import React, { useState, useEffect } from "react";
import Editor from "@/components/Editor";
import { tokenize } from "@/core/tokenizer";
import { parse } from "@/core/parser";
import { transpile } from "@/core/transpiler";
import { useFullScreen } from "@/context/FullScreenContext";
export default function App() {
  const [code, setCode] = useState(
    `DECLARE total : INTEGER
total ← 0
FOR i ← 1 TO 5
  total ← total + i
NEXT i
OUTPUT total`
  );
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("main");
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: number; name: string; content: string; type: string; modified: boolean }[]
  >([]);
  const [virtualFiles, setVirtualFiles] = useState<Map<string, string>>(new Map());


  /** Apply theme on html root */
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);
  const { isFullScreen, setIsFullScreen } = useFullScreen();
  const isPseudocode = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    return ext === "pseudo" || ext === "ps";
  };

  const handleRun = () => {
    try {
      const tokens = tokenize(code);
      const ast = parse(tokens);
      const jsCode = transpile(ast);
      const result = runCode(jsCode);
      setOutput(result);
      setError("");
    } catch (e: any) {
      setOutput("");
      setError(e.message);
    }
  };

  const runCode = (jsCode: string) => {
    const out: string[] = [];
    const originalLog = console.log;
    const originalPrompt = window.prompt;

    jsCode = jsCode.replace("const __files = new Map();", "");
    let preload = 'var __files = (typeof __files !== "undefined" ? __files : new Map());\n';

    uploadedFiles.forEach((file) => {
      const lines = file.content.split("\n").map((line) => JSON.stringify(line)).join(",");
      preload += `__files.set(${JSON.stringify(file.name)}, {content:[${lines}], position:0, modified:false});\n`;
    });
    virtualFiles.forEach((content, filename) => {
      const lines = content.split("\n").map((line) => JSON.stringify(line)).join(",");
      preload += `__files.set(${JSON.stringify(filename)}, {content:[${lines}], position:0, modified:false});\n`;
    });

    console.log = (msg?: any) => out.push(String(msg ?? ""));
    window.prompt = (msg?: string) => {
      const v = originalPrompt?.(msg ?? "") ?? "";
      out.push(`[Input: ${v}]`);
      return v;
    };

    try {
      // eslint-disable-next-line no-new-func
      new Function(`${preload}\n${jsCode}`)();
    } finally {
      console.log = originalLog;
      window.prompt = originalPrompt;
    }
    return out.join("\n");
  };

  const handleClear = () => {
    setCode("");
    setOutput("");
    setError("");
    setVirtualFiles(new Map());
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = String(ev.target?.result ?? "");
      const newFile = {
        id: Date.now(),
        name: file.name,
        content,
        type: "uploaded",
        modified: false,
      };
      setUploadedFiles((prev) => [...prev, newFile]);
      if (isPseudocode(file.name)) {
        setCode(content);
        setFileName(file.name);
      }
    };
    reader.readAsText(file);
  };

  const removeFile = (id: number) => setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  const removeVirtualFile = (name: string) => {
    const map = new Map(virtualFiles);
    map.delete(name);
    setVirtualFiles(map);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 dark:bg-[#0F1117] dark:text-gray-200 transition-colors">
      {/* Header (hidden in fullscreen) */}
   
        <header className="px-6 py-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <span className="text-green-500">{"</>"}</span> Pseudocode Compiler
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Write, compile and execute pseudocode online
            </p>
          </div>
          {isFullScreen && (
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="px-3 py-1.5 rounded bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-100 text-sm"
          >
            {theme === "dark" ? "☀ Light Mode" : "🌙 Dark Mode"}
          </button>
          )}
        </header>


      {/* Main compiler layout (always visible) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3">
        {/* Editor Panel */}
        <div className="md:col-span-2 flex flex-col border-b md:border-b-0 md:border-r border-gray-300 dark:border-gray-800">
          {/* Top bar */}
          <div className="flex justify-between items-center bg-gray-100 dark:bg-[#121621] px-4 py-2 border-b border-gray-300 dark:border-gray-800">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {fileName} <span className="text-gray-400">• Pseudocode</span>
            </div>
            <div className="flex gap-2 items-center">
              <button
                onClick={handleRun}
                className="bg-green-600 hover:bg-green-700 px-4 py-1.5 rounded text-sm text-white"
              >
                Run
              </button>
              <button
                onClick={handleClear}
                className="bg-red-600 hover:bg-red-700 px-4 py-1.5 rounded text-sm text-white"
              >
                Clear
              </button>
               <button
        onClick={() => setIsFullScreen(!isFullScreen)}
        className="px-3 py-1.5 bg-gray-300 dark:bg-gray-700 rounded"
      >
        {isFullScreen ? "Exit" : "Full Screen"}
      </button>
            </div>
          </div>

          {/* Editor */}
          <div className="flex">
            <Editor code={code} setCode={setCode} />
          </div>

          {/* Footer (hidden in fullscreen) */}
       
            <div className="flex justify-end items-center gap-2 bg-gray-100 dark:bg-[#121621] px-4 py-2 border-t border-gray-300 dark:border-gray-800">
              <label className="cursor-pointer bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1.5 rounded text-sm">
                ⬆ Upload
                <input
                  type="file"
                  className="hidden"
                  accept=".txt,.pseudo,.ps"
                  onChange={handleFileUpload}
                />
              </label>
              <button
                onClick={handleDownload}
                className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 px-3 py-1.5 rounded text-sm"
              >
                ⬇ Export
              </button>
            </div>
          
        </div>

        {/* Terminal & Files (always visible) */}
        <div className="flex flex-col">
          {/* Terminal */}
          <div className="bg-gray-100 dark:bg-[#121621] px-4 py-2 border-b border-gray-300 dark:border-gray-800">
            Terminal
          </div>
          <div className="h-40 bg-gray-50 dark:bg-black text-green-600 dark:text-green-400 p-3 overflow-auto whitespace-pre-wrap">
            {error ? (
              <span className="text-red-600 dark:text-red-400">{error}</span>
            ) : (
              output || "Output"
            )}
          </div>

          {/* Files */}
          <div className="grid grid-cols-2 border-t border-gray-300 dark:border-gray-800 text-sm">
            <div className="border-r border-gray-300 dark:border-gray-800">
              <div className="bg-gray-100 dark:bg-[#121621] px-3 py-2 border-b border-gray-300 dark:border-gray-800">
                Uploaded Files
              </div>
              <div className="p-2 space-y-2 max-h-32 overflow-auto">
                {uploadedFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex justify-between items-center bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded cursor-pointer"
                    onClick={() => isPseudocode(f.name) && setCode(f.content)}
                  >
                    <span className="truncate">📄 {f.name}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(f.id);
                      }}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {uploadedFiles.length === 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">No files</div>
                )}
              </div>
            </div>
            <div>
              <div className="bg-gray-100 dark:bg-[#121621] px-3 py-2 border-b border-gray-300 dark:border-gray-800">
                Created File
              </div>
              <div className="p-2 space-y-2 max-h-32 overflow-auto">
                {Array.from(virtualFiles.entries()).map(([name]) => (
                  <div
                    key={name}
                    className="flex justify-between items-center bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded"
                  >
                    <span className="truncate">📝 {name}</span>
                    <button
                      onClick={() => removeVirtualFile(name)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {virtualFiles.size === 0 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">No files</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
