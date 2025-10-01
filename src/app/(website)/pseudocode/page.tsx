"use client";
import React, { useState, useEffect } from "react";
import Editor from "@/components/Editor";
import { tokenize } from "@/core/tokenizer";
import { parse } from "@/core/parser";
import { transpile } from "@/core/transpiler";
import { useFullScreen } from "@/context/FullScreenContext";
import { Delete, DeleteIcon, Play, PlayIcon } from "lucide-react";
import { MdOutlineDelete, MdOutlineFullscreen, MdOutlineFileUpload, MdOutlineFileDownload } from "react-icons/md";
import { FileCode, Download, X } from "lucide-react";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
} from "react-resizable-panels"

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
  const { isFullScreen, setIsFullScreen } = useFullScreen();
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

  /** Apply theme on html root */
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

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

  // Mobile Layout
  if (isMobile && !isFullScreen) {
    return (
      <div className="min-h-screen bg-white text-gray-900 dark:bg-[#0F1117] dark:text-gray-200 transition-colors p-4">
        {/* Header */}
        <header className="mb-4">
          <div className="mb-3">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-green-500">{"</>"}</span> Pseudocode Compiler
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Write, compile and execute pseudocode online
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              className="flex-1 bg-gray-200 dark:bg-white hover:bg-gray-300 dark:hover:bg-gray-100 dark:text-gray-900 px-3 py-2 rounded text-sm"
            >
              <MdOutlineFileDownload size={16} className="inline-block mr-1" />
              Export
            </button>
            <label className="flex-1 cursor-pointer bg-gray-200 dark:bg-white hover:bg-gray-300 dark:hover:bg-gray-100 px-3 py-2 rounded text-sm dark:text-gray-900 text-center">
              <MdOutlineFileUpload size={16} className="inline-block mr-1" />
              Upload
              <input
                type="file"
                className="hidden"
                accept=".txt,.pseudo,.ps"
                onChange={handleFileUpload}
              />
            </label>
          </div>
        </header>

        {/* Editor Box */}
        <div className="mb-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="flex justify-between items-center bg-gray-100 dark:bg-[#121621] px-3 py-2 border-b border-gray-300 dark:border-gray-800">
            <div className="text-sm text-gray-700 dark:text-gray-300">
              {fileName} <span className="text-gray-400">• Pseudocode</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRun}
                className="bg-[#16A34A] hover:bg-[#15803D] px-3 py-1 rounded text-sm text-white"
              >
                <PlayIcon size={14} className="inline-block mr-1" />
                Run
              </button>
              <button
                onClick={handleClear}
                className="bg-white hover:bg-gray-100 px-3 py-1 rounded text-xs text-red-500 border border-red-300"
              >
                Clear
              </button>
            </div>
          </div>
          <div className="h-[300px]">
            <Editor code={code} setCode={setCode} />
          </div>
        </div>

        {/* Output Box */}
        <div className="mb-4 border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#101828] px-3 py-2 border-b border-gray-300 dark:border-gray-700">
            <span className="text-green-600 dark:text-green-400">▸</span>
            <span className="font-medium text-sm">Terminal</span>
          </div>
          <div className="h-[150px] bg-gray-50 dark:bg-[#1C2433] text-green-600 dark:text-green-400 p-3 overflow-auto whitespace-pre-wrap text-sm">
            {error ? (
              <span className="text-red-600 dark:text-red-400">{error}</span>
            ) : (
              <span className="block">› {output || "Output"}</span>
            )}
          </div>
        </div>

        {/* Files Section */}
        <div className="grid grid-cols-1 gap-4">
          {/* Uploaded Files Box */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#101828] px-3 py-2 border-b border-gray-300 dark:border-gray-700">
              <span className="text-green-600 dark:text-green-400">▸</span>
              <span className="font-medium text-sm">Uploaded Files</span>
            </div>
            <div className="p-2 min-h-[100px] max-h-[200px] overflow-auto">
              {uploadedFiles.map((f) => (
                <div
                  key={f.id}
                  className="relative flex items-center justify-between bg-[#1C2433] rounded-lg px-3 py-2 mb-2 text-white cursor-pointer"
                  onClick={() => isPseudocode(f.name) && setCode(f.content)}
                >
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-white" />
                    <span className="truncate text-sm">{f.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-500"
                    >
                      <Download className="w-3 h-3 text-white" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(f.id);
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                </div>
              ))}
              {uploadedFiles.length === 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                  No files uploaded
                </div>
              )}
            </div>
          </div>

          {/* Created Files Box */}
          <div className="border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#101828] px-3 py-2 border-b border-gray-300 dark:border-gray-700">
              <span className="text-green-600 dark:text-green-400">▸</span>
              <span className="font-medium text-sm">Created Files</span>
            </div>
            <div className="p-2 min-h-[100px] max-h-[200px] overflow-auto">
              {Array.from(virtualFiles.entries()).map(([name]) => (
                <div
                  key={name}
                  className="flex justify-between items-center bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded mb-2"
                >
                  <span className="truncate flex items-center gap-2 text-sm">📝 {name}</span>
                  <button
                    onClick={() => removeVirtualFile(name)}
                    className="text-gray-500 hover:text-red-500 text-lg"
                  >
                    ×
                  </button>
                </div>
              ))}
              {virtualFiles.size === 0 && (
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-4">
                  No files created
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout (existing code)
  // Dynamic classes based on fullscreen state
  const rootContainerClass = isFullScreen 
    ? "h-screen flex flex-col bg-white text-gray-900 dark:bg-[#0F1117] dark:text-gray-200 transition-colors overflow-hidden"
    : "min-h-screen flex flex-col bg-white text-gray-900 dark:bg-[#0F1117] dark:text-gray-200 transition-colors p-7";

  const mainContentClass = isFullScreen 
    ? "flex-1 p-4 overflow-hidden"
    : "flex-1";

  const editorPanelClass = isFullScreen
    ? "flex flex-col border border-gray-300 dark:border-gray-800 h-full rounded-l-md overflow-hidden"
    : "flex flex-col border-b md:border-b-0 md:border-r border-gray-300 dark:border-gray-800 h-full";

  const terminalClass = isFullScreen
    ? "border border-gray-300 dark:border-gray-700 h-full flex flex-col rounded-tr-md overflow-hidden"
    : "rounded-md overflow-hidden border border-gray-300 dark:border-gray-700 h-full flex flex-col";

  const uploadedFilesClass = isFullScreen
    ? "border border-gray-300 dark:border-gray-700 flex flex-col rounded-bl-md overflow-hidden"
    : "rounded-md overflow-hidden border border-gray-300 dark:border-gray-700 flex flex-col";

  const createdFileClass = isFullScreen
    ? "border border-gray-300 dark:border-gray-700 flex flex-col rounded-br-md overflow-hidden"
    : "rounded-md overflow-hidden border border-gray-300 dark:border-gray-700 flex flex-col";

  const editorContainerClass = isFullScreen
    ? "flex-1 min-h-0"
    : "h-[400px]";

  const terminalOutputClass = isFullScreen
    ? "flex-1 bg-gray-50 dark:bg-[#1C2433] text-green-600 dark:text-green-400 p-3 overflow-auto whitespace-pre-wrap text-sm min-h-0"
    : "flex-1 bg-gray-50 dark:bg-[#1C2433] text-green-600 dark:text-green-400 p-3 overflow-auto whitespace-pre-wrap text-sm";

  const filesGridClass = isFullScreen
    ? "grid grid-cols-2 gap-3 text-sm h-full p-2"
    : "grid grid-cols-2 gap-3 text-sm h-full";

  const fileContentClass = isFullScreen
    ? "p-2 space-y-2 overflow-auto flex-1 min-h-0"
    : "p-2 space-y-2 overflow-auto";

  return (
    <div className={rootContainerClass}>
      {/* Header - Always visible on desktop */}
      <header className="px-6 py-4 border-b border-gray-300 dark:border-gray-800 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <span className="text-green-500">{"</>"}</span> Pseudocode Compiler
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Write, compile and execute pseudocode online
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={handleDownload}
            className="bg-gray-200 dark:bg-white hover:bg-gray-300 dark:hover:bg-gray-100 dark:text-gray-900 px-3 py-1.5 rounded text-sm"
          >
            <MdOutlineFileDownload size={16} className="inline-block mr-1" />
            Export
          </button>
          <label className="cursor-pointer bg-gray-200 dark:bg-white hover:bg-gray-300 dark:hover:bg-gray-100 px-3 py-1.5 rounded text-sm dark:text-gray-900">
            <MdOutlineFileUpload size={16} className="inline-block mr-1" />
            Upload
            <input
              type="file"
              className="hidden"
              accept=".txt,.pseudo,.ps"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </header>

      {/* Main compiler layout */}
      <div className={mainContentClass}>
        <PanelGroup direction="horizontal" className={isFullScreen ? "h-full" : ""}>
          {/* Left: Editor Panel */}
          <Panel defaultSize={66} minSize={40}>
            <div className={editorPanelClass}>
              {/* Top bar */}
              <div className="flex justify-between items-center bg-gray-100 dark:bg-[#121621] px-4 py-2 border-b border-gray-300 dark:border-gray-800">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  {fileName} <span className="text-gray-400">• Pseudocode</span>
                </div>
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleRun}
                    className="bg-[#16A34A] hover:bg-[#15803D] px-4 py-1.5 rounded text-sm text-white"
                  >
                    <PlayIcon size={16} className="inline-block mr-1" />
                    Run
                  </button>
                  <button
                    onClick={handleClear}
                    className="bg-white hover:bg-gray-100 px-4 py-1.5 rounded text-sm text-red-500 border border-red-300 hover:border-red-400"
                  >
                    <MdOutlineDelete size={16} className="inline-block mr-1" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Editor */}
              <div className={editorContainerClass}>
                <Editor code={code} setCode={setCode} />
              </div>
            </div>
          </Panel>

          <PanelResizeHandle className="w-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors cursor-col-resize" />

          {/* Right: Terminal + Files */}
          <Panel defaultSize={34} minSize={25}>
            <PanelGroup direction="vertical" className={isFullScreen ? "h-full" : ""}>
              {/* Terminal */}
              <Panel defaultSize={50} minSize={20}>
                <div className={terminalClass}>
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#101828] px-4 py-2 border-b border-gray-300 dark:border-gray-700">
                    <span className="text-green-600 dark:text-green-400">▸</span>
                    <span className="font-medium">Terminal</span>
                  </div>
                  <div className={terminalOutputClass}>
                    {error ? (
                      <span className="text-red-600 dark:text-red-400">{error}</span>
                    ) : (
                      <span className="block">› {output || "Output"}</span>
                    )}
                  </div>
                </div>
              </Panel>

              <PanelResizeHandle className="h-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors cursor-row-resize" />

              {/* Files */}
              <Panel defaultSize={50} minSize={20}>
                <div className={filesGridClass}>
                  {/* Uploaded Files */}
                  <div className={uploadedFilesClass}>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#101828] px-3 py-2 border-b border-gray-300 dark:border-gray-700">
                      <span className="text-green-600 dark:text-green-400">▸</span>
                      <span className="font-medium">Uploaded Files</span>
                    </div>
                    <div className={fileContentClass}>
                      {uploadedFiles.map((f) => (
                        <div
                          key={f.id}
                          className="relative flex items-center justify-between bg-[#1C2433] rounded-lg px-4 py-3 text-white cursor-pointer"
                          onClick={() => isPseudocode(f.name) && setCode(f.content)}
                        >
                          <div className="flex items-center gap-3">
                            <FileCode className="w-5 h-5 text-white" />
                            <span className="truncate">{f.name}</span>
                          </div>
                          <button
                            onClick={(e) => e.stopPropagation()}
                            className="w-5 h-5 flex items-center justify-center rounded-full bg-green-600 hover:bg-green-500"
                          >
                            <Download className="w-3 h-3 text-white" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile(f.id);
                            }}
                            className="absolute -top-1 -right-1 w-3 h-3 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500"
                          >
                            <X className="w-2 h-2 text-white" />
                          </button>
                        </div>
                      ))}
                      {uploadedFiles.length === 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          No files
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Created File */}
                  <div className={createdFileClass}>
                    <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#101828] px-3 py-2 border-b border-gray-300 dark:border-gray-700">
                      <span className="text-green-600 dark:text-green-400">▸</span>
                      <span className="font-medium">Created File</span>
                    </div>
                    <div className={fileContentClass}>
                      {Array.from(virtualFiles.entries()).map(([name]) => (
                        <div
                          key={name}
                          className="flex justify-between items-center bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded"
                        >
                          <span className="truncate flex items-center gap-2">📝 {name}</span>
                          <button
                            onClick={() => removeVirtualFile(name)}
                            className="text-gray-500 hover:text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {virtualFiles.size === 0 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          No files
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  );
}