"use client";
import React, { useRef, useState } from "react";
import { UploadCloud, FileCheck } from "lucide-react";

export default function FileDropzone({ onFileSelected, isLoading }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [fileName, setFileName] = useState(null);
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files?.[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file) => {
    setFileName(file.name);
    onFileSelected(file);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        isDragOver ? "border-blue-500 bg-blue-50/50" : "border-slate-300 hover:border-slate-400 bg-white"
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
      />
      <div className="flex flex-col items-center gap-2">
        {fileName ? (
          <div className="flex items-center gap-2 text-blue-600">
            <FileCheck className="w-8 h-8" />
            <span className="font-semibold text-sm">{fileName}</span>
          </div>
        ) : (
          <>
            <UploadCloud className="w-10 h-10 text-slate-400" />
            <p className="text-sm font-semibold text-slate-700">Upload Master Excel or CSV Sheet[cite: 1]</p>
            <p className="text-xs text-slate-400">Supports batches with 7,000+ records[cite: 1]</p>
          </>
        )}
      </div>
    </div>
  );
}