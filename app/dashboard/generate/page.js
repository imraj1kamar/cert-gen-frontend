// GeneratePage.jsx
"use client";
import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import FileDropzone from "@/components/cert-gen/FileDropzone";
import SummaryDataGrid from "@/components/cert-gen/SummaryDataGrid";
import CertificateCanvasPreview from "@/components/cert-gen/CertificateCanvasPreview";
import GenerationProgressModal from "@/components/cert-gen/GenerationProgressModal";
import { parseAndValidateExcel } from "@/lib/excelParser";
import { Play } from "lucide-react";

import { generateApi } from "@/redux/api/generateApi";
import { templateApi } from "@/redux/api/templateApi";
import { signatureApi } from "@/redux/api/signatoriesApi";
import { selectTemplates, setTemplates } from "@/redux/slices/templateSlice";
import { selectSignatures, setSignatures } from "@/redux/slices/signatoriesSlice"; 
import {
  setValidationResults,
  setLoading,
  setError,
  clearGenerateState,
  selectParsedData,
  selectValidationErrors,
  selectValidationWarnings,
  selectLoading,
  selectError
} from "@/redux/slices/generateSlice";

export default function GeneratePage() {
  const dispatch = useDispatch();

  const dbTemplates = useSelector(selectTemplates) || [];
  const dbSignatories = useSelector(selectSignatures) || [];

  const parsedData = useSelector(selectParsedData) || [];
  const validationErrors = useSelector(selectValidationErrors) || [];
  const validationWarnings = useSelector(selectValidationWarnings) || [];
  const isProcessing = useSelector(selectLoading);
  const generateError = useSelector(selectError);

  const [selectedFile, setSelectedFile] = useState(null); 
  const [summaryData, setSummaryData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (dbTemplates.length === 0) {
      templateApi.getTemplates().then((res) => dispatch(setTemplates(res.data || res)));
    }
    if (dbSignatories.length === 0) {
      signatureApi.getSignatures().then((res) => dispatch(setSignatures(res.data || res)));
    }
  }, [dispatch, dbTemplates.length, dbSignatories.length]);

  const handleFile = async (file) => {
    console.log("🟦 [FRONTEND] File dropped:", file.name);
    dispatch(setLoading(true));
    dispatch(clearGenerateState()); 
    setSelectedFile(file); 

    try {
      const result = await parseAndValidateExcel(file, dbTemplates, dbSignatories); 
      console.log("🟦 [FRONTEND] Excel Parsing Complete. Valid records:", result.records?.length);
      
      dispatch(setValidationResults({
        validData: result.records || [],
        errors: result.isValid === false ? (result.errors || []) : [],
        warnings: result.warnings || []
      }));
      setSummaryData(result.summary || null);
    } catch (err) {
      console.error("❌ [FRONTEND] Parser Error:", err);
      dispatch(setError(err.message));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleStartGeneration = async () => {
    if (!selectedFile || parsedData.length === 0 || validationErrors.length > 0) return;
    
    console.log("🚀 [FRONTEND] Starting ZIP Generation for", parsedData.length, "records...");
    setIsGenerating(true);
    setIsModalOpen(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("data", JSON.stringify(parsedData)); 
      formData.append("user", "System Admin"); 

      console.log("🚀 [FRONTEND] Calling Backend API (/api/generate)...");
      const response = await generateApi.generateCertificates(formData);
      console.log("✅ [FRONTEND] Backend Response Received! Starting download...", response);

      const blob = new Blob([response.data || response], { type: "application/zip" });
      const downloadUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.setAttribute("download", `Bulk_Certificates_${new Date().toISOString().slice(0, 10)}.zip`);
      document.body.appendChild(link);
      link.click();
      
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      console.log("✅ [FRONTEND] Download triggered successfully.");
    } catch (error) {
      console.error("❌ [FRONTEND] Certificate Generation Failed API Call:", error);
      alert("Failed to generate certificates. Please check console for details.");
    } finally {
      setIsGenerating(false);
      setIsModalOpen(false);
    }
  };

  return (
    // ... UI Code Remains Exactly The Same ...
    <div className="space-y-6">
      <Breadcrumb items={[{ label: "Operations" }, { label: "Certificate Engine" }]} />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Certificate Generation Engine</h1>
      </div>

      <Card title="Step 1: Upload Master File">
        <FileDropzone onFileSelected={handleFile} isLoading={isProcessing} />
      </Card>

      {validationErrors.length > 0 && (
        <Alert type="error" title="Validation Check Failed — Generation Halted" message="Critical errors found." details={validationErrors} />
      )}

      {generateError && (
        <Alert type="error" title="Processing Error" message={generateError} />
      )}

      {validationWarnings.length > 0 && validationErrors.length === 0 && (
        <Alert type="warning" title="Validation Warnings Found" message="Warnings exist." details={validationWarnings} />
      )}

      {parsedData.length > 0 && validationErrors.length === 0 && (
        <div className="space-y-6">
          {summaryData && <SummaryDataGrid summary={summaryData} />}
          <CertificateCanvasPreview record={parsedData[0]} />
          
          <div className="flex justify-end">
            <Button size="lg" icon={Play} onClick={handleStartGeneration} disabled={isGenerating || isProcessing}>
              {isGenerating ? "Generating ZIP..." : `Start Async Generation (${parsedData.length} Records)`}
            </Button>
          </div>
        </div>
      )}

      <GenerationProgressModal isOpen={isModalOpen} onClose={() => !isGenerating && setIsModalOpen(false)} totalRecords={parsedData.length || 0} isGenerating={isGenerating} />
    </div>
  );
}