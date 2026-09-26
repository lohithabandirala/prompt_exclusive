"use client";

import { useState } from "react";
import { UploadCloud, FileText, MessageSquare, ShieldAlert, Zap, Scale, CheckCircle2, ChevronRight, FileSearch, ArrowRight, Loader2 } from "lucide-react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [gsUri, setGsUri] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState<string>("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [isAsking, setIsAsking] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setGsUri(data.gsUri);
      } else {
        alert("Upload failed: " + data.detail);
      }
    } catch (err) {
      alert("Error connecting to server. Make sure the backend is running.");
    } finally {
      setIsUploading(false);
    }
  };

  const getSummary = async () => {
    if (!gsUri) return;
    setIsSummarizing(true);
    try {
      const res = await fetch(`/api/summary?uri=${encodeURIComponent(gsUri)}`);
      const data = await res.json();
      if (res.ok) {
        setSummary(data.summary);
      } else {
        alert("Failed to get summary");
      }
    } catch (err) {
      alert("Error connecting to server.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const askQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question || !gsUri) return;
    
    const userQ = question;
    setQuestion("");
    setChatHistory(prev => [...prev, { role: "user", text: userQ }]);
    setIsAsking(true);

    try {
      const res = await fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: userQ, gs_uri: gsUri }),
      });
      const data = await res.json();
      if (res.ok) {
        setChatHistory(prev => [...prev, { role: "ai", text: data.answer }]);
      } else {
        setChatHistory(prev => [...prev, { role: "ai", text: "Error: " + data.detail }]);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "ai", text: "Error connecting to server." }]);
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/20 rounded-xl backdrop-blur-md border border-indigo-500/30">
            <Scale className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-300">
              Aura Legal
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">AI-POWERED CONTRACT INTELLIGENCE</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Upload & Summary */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <UploadCloud className="w-5 h-5 text-indigo-400" /> Upload Document
            </h2>
            
            {!gsUri ? (
              <div className="space-y-4 relative z-10">
                <div className="border-2 border-dashed border-slate-600 rounded-xl p-8 text-center hover:border-indigo-400/50 transition-colors bg-slate-900/50">
                  <input 
                    type="file" 
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden" 
                    id="file-upload" 
                  />
                  <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                    <FileText className="w-10 h-10 text-slate-400 mb-3" />
                    <span className="text-sm font-medium text-slate-300">
                      {file ? file.name : "Click to select a PDF contract"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">Maximum size: 10MB</span>
                  </label>
                </div>
                <button 
                  onClick={uploadFile}
                  disabled={!file || isUploading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 flex justify-center items-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5" />}
                  {isUploading ? "Uploading & Processing..." : "Analyze Document"}
                </button>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3 relative z-10">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 mt-0.5" />
                <div>
                  <h3 className="text-emerald-300 font-medium">Document Ready</h3>
                  <p className="text-emerald-400/70 text-sm mt-1">{file?.name}</p>
                </div>
              </div>
            )}
          </div>

          {gsUri && (
            <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl flex flex-col h-[500px]">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-cyan-400" /> Document Summary
                </h2>
                {!summary && (
                  <button 
                    onClick={getSummary}
                    disabled={isSummarizing}
                    className="text-xs py-1.5 px-3 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition-colors flex items-center gap-1"
                  >
                    {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Generate
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {isSummarizing ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
                    <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
                    <p className="text-sm">Reading document and extracting insights...</p>
                  </div>
                ) : summary ? (
                  <div className="prose prose-invert prose-sm max-w-none text-slate-300">
                    <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, '<br/>') }} />
                    <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
                      <p className="text-xs text-amber-300/80 leading-relaxed">
                        <strong>Disclaimer:</strong> This summary is generated by AI for informational purposes only. It is not legal advice and should not replace professional legal counsel.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm">No summary generated yet.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Q&A Chat */}
        <div className="lg:col-span-7">
          <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl flex flex-col h-[calc(100vh-12rem)] min-h-[600px] overflow-hidden">
            
            <div className="p-4 border-b border-slate-700/50 bg-slate-800/50">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" /> Legal Q&A Assistant
              </h2>
              <p className="text-xs text-slate-400 mt-1">Ask questions about your uploaded document</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-gradient-to-b from-transparent to-slate-900/50">
              {chatHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                    <MessageSquare className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-xl font-medium text-slate-200 mb-2">How can I help you?</h3>
                  <p className="text-slate-400 text-sm max-w-md">
                    Upload a contract or legal document on the left, then ask me anything about its contents. I can highlight obligations, identify risks, or explain clauses in simple terms.
                  </p>
                </div>
              ) : (
                chatHistory.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20 rounded-tr-sm' 
                        : 'bg-slate-700/60 text-slate-200 border border-slate-600/50 rounded-tl-sm'
                    }`}>
                      <div className="text-sm whitespace-pre-wrap leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br/>') }} />
                    </div>
                  </div>
                ))
              )}
              {isAsking && (
                <div className="flex justify-start">
                  <div className="bg-slate-700/60 border border-slate-600/50 rounded-2xl rounded-tl-sm p-4 flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-75" />
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce delay-150" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-800/80 border-t border-slate-700/50 backdrop-blur-md">
              <form onSubmit={askQuestion} className="relative">
                <input 
                  type="text"
                  disabled={!gsUri || isAsking}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={gsUri ? "Ask about termination clauses, liabilities, etc..." : "Upload a document first..."}
                  className="w-full bg-slate-900/80 border border-slate-600/50 rounded-xl py-4 pl-4 pr-12 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                  type="submit"
                  disabled={!question || !gsUri || isAsking}
                  className="absolute right-2 top-2 bottom-2 p-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            </div>
            
          </div>
        </div>
        
      </div>
    </main>
  );
}
