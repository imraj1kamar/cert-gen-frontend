"use client";
import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import ProgressBar from "@/components/ui/ProgressBar";
import Button from "@/components/ui/Button";
import { Download, CheckCircle } from "lucide-react";

export default function GenerationProgressModal({ isOpen, onClose, totalRecords, onComplete }) {

console.log(totalRecords)

  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing background threads...");

  useEffect(() => {
    if (!isOpen) {
      setProgress(0);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatusText("Complete! Nested folders packed into ZIP archive[cite: 1, 2].");
          return 100;
        }
        if (prev === 20) setStatusText("Level 1 Sorting: Grouping by Band Type...[cite: 1, 2]");
        if (prev === 50) setStatusText("Level 2 Sorting: Applying dynamic templates...[cite: 1, 2]");
        if (prev === 75) setStatusText("Level 3 Sorting: Merging PDFs per Packet Name...[cite: 1, 2]");
        if (prev === 90) setStatusText("Compressing into downloadable ZIP...[cite: 1, 2]");
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isOpen]);

  const isComplete = progress >= 100;

  return (
    <Modal isOpen={isOpen} onClose={() => isComplete && onClose()} title="Batch Engine Status">
      <div className="space-y-6">
        <ProgressBar
          progress={progress}
          label={isComplete ? "Completed" : "Processing Async Stream"}
          description={statusText}
        />

        {isComplete && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-xs text-emerald-800">
              Generated certificates according to 3-tier hierarchy: Band Type &rarr; Award Category &rarr; Packet Name.pdf[cite: 1, 2].
            </p>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          {isComplete ? (
            <Button
              variant="primary"
              icon={Download}
              onClick={() => {
                alert("Triggering simulated ZIP download: Outputs_ZIP.zip");
                onClose();
              }}
            >
              Download ZIP
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Processing in Background...
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}