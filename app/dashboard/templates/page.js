// app/dashboard/templates/page.js
"use client";

import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Table from "@/components/ui/Table";
import Modal from "@/components/ui/Modal";
import DynamicForm from "@/components/ui/DynamicForm";
import Alert from "@/components/ui/Alert";
import dynamic from "next/dynamic";

const TemplateMapper = dynamic(() => import("@/components/cert-gen/TemplateMapper"), { ssr: false });

import {
  FileText,
  UploadCloud,
  Trash2,
  Award,
  CheckCircle,
  ExternalLink,
  Layers,
  Edit3,
} from "lucide-react";

// Naye Redux Slice aur API imports
import { templateApi } from "@/redux/api/templateApi";
import {
  setTemplates,
  addTemplateToState,
  updateTemplateInState,
  removeTemplateFromState,
  setLoading,
  selectTemplates,
  selectLoading,
} from "@/redux/slices/templateSlice";

export default function TemplateManagementPage() {
  const dispatch = useDispatch();
  
  // Redux Store se state access kar rahe hain
  const templates = useSelector(selectTemplates) || [];
  const isFetching = useSelector(selectLoading);

  // Local States
  const [isAdding, setIsAdding] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [mappingData, setMappingData] = useState(null);
  const [showMapper, setShowMapper] = useState(false);
  const [tempFileUrl, setTempFileUrl] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);

  // Form state for mapping a new template
  const [formData, setFormData] = useState({
    category: "",
    templateName: "", // Template ka naam alag se
    file: null,       // 'file' naam rakha hai API backend se match karne ke liye
  });

  // Fetch Templates on Component Mount
  useEffect(() => {
    const fetchAllTemplates = async () => {
      dispatch(setLoading(true));
      try {
        const response = await templateApi.getTemplates();
        dispatch(setTemplates(response.data || response));
      } catch (err) {
        console.error("Error fetching templates:", err);
        dispatch(setTemplates([]));
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchAllTemplates();
  }, [dispatch]);

  // Dynamic Form Field Config (Array-based)
  const templateFormFields = [
    {
      name: "category",
      label: "Award Category Name",
      type: "text",
      placeholder: "e.g., Silver Star, Gold Star",
      required: true,
      icon: Award,
    },
    {
      name: "templateName",
      label: "Template Display Name",
      type: "text",
      placeholder: "e.g., Silver Standard Template",
      required: true,
      icon: Layers,
    },
    {
      name: "file",
      label: "Blank PDF Template File (.pdf)",
      type: "file",
      required: true,
      icon: FileText,
    },
  ];

  // Add Template handler
  const handleUploadTemplate = async (e, finalMappingData = null) => {
    e?.preventDefault();

    const trimmedCategory = formData.category.trim();
    const trimmedTemplateName = formData.templateName.trim();

    if (!trimmedCategory || !trimmedTemplateName || !formData.file) {
      setAlertInfo({
        type: "error",
        title: "Validation Incomplete",
        message: "Please provide all details and upload the blank PDF template.",
      });
      return;
    }

    // Check duplicate category mapping
    const exists = templates.some(
      (t) => t.category.toLowerCase() === trimmedCategory.toLowerCase()
    );
    
    if (exists) {
      setAlertInfo({
        type: "warning",
        title: "Category Already Mapped",
        message: `The award category "${trimmedCategory}" already has an assigned template.`,
      });
      return;
    }

    if (!showMapper && !finalMappingData) {
      setTempFileUrl(URL.createObjectURL(formData.file));
      setShowMapper(true);
      return;
    }

    setIsAdding(true);
    try {
      // FormData create kar rahe hain kyunki file bhejni hai (multipart/form-data)
      const uploadData = new FormData();
      uploadData.append("category", trimmedCategory);
      uploadData.append("templateName", trimmedTemplateName);
      uploadData.append("file", formData.file);
      uploadData.append("status", 1); // Active by default
      
      if (finalMappingData) {
        uploadData.append("mappingData", JSON.stringify(finalMappingData));
      }

      const response = await templateApi.addTemplate(uploadData);
      const created = response.data || response;
      
      // Store mein naya template add karein
      dispatch(addTemplateToState(created));

      setIsAddModalOpen(false);
      setShowMapper(false);
      setMappingData(null);
      if (tempFileUrl) URL.revokeObjectURL(tempFileUrl);
      setFormData({ category: "", templateName: "", file: null });

      setAlertInfo({
        type: "success",
        title: "Template Mapped Successfully",
        message: `Template is now dynamically mapped to "${trimmedCategory}".`,
      });
    } catch (err) {
      setAlertInfo({
        type: "error",
        title: "Upload Failed",
        message: err?.response?.data?.message || err.message || "Could not map template.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Update Template Mapping handler
  const handleUpdateMapping = async (updatedMappingData) => {
    if (!editingTemplate) return;
    setIsAdding(true);
    try {
      const response = await templateApi.updateTemplate(editingTemplate.id, { mappingData: updatedMappingData });
      
      // Store mein update karein
      dispatch(updateTemplateInState(response.data || response));
      
      setEditingTemplate(null);
      setAlertInfo({
        type: "success",
        title: "Mapping Updated",
        message: `Template mapping for "${editingTemplate.category}" updated successfully.`,
      });
    } catch (err) {
      setAlertInfo({
        type: "error",
        title: "Update Failed",
        message: err?.response?.data?.message || err.message || "Could not update mapping.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Delete Template handler
  const handleDelete = async (id, categoryName) => {
    if (confirm(`Are you sure you want to remove the template for "${categoryName}"? Excel records with this category will fail validation.`)) {
      try {
        await templateApi.deleteTemplate(id);
        
        // Redux store se hatayein
        dispatch(removeTemplateFromState(id));

        setAlertInfo({
          type: "warning",
          title: "Template Removed",
          message: `Template mapping for "${categoryName}" was deleted.`,
        });
      } catch (err) {
        setAlertInfo({
          type: "error",
          title: "Delete Failed",
          message: err?.response?.data?.message || err.message || "Could not remove template.",
        });
      }
    }
  };

  // Reusable Table Column definitions
  const columns = [
    {
      header: "Award Category",
      accessor: "category", // Backend field se match
      render: (category) => (
        <div className="flex items-center gap-2">
          <div className="bg-amber-100 p-1.5 rounded-md text-amber-600">
            <Award className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800 text-xs">{category}</span>
        </div>
      ),
    },
    {
      header: "Mapped Template File",
      accessor: "templateName", // Backend field se match
      render: (templateName, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewTemplate(row)}
            className="flex items-center gap-1.5 text-xs font-mono text-blue-600 hover:text-blue-800 bg-blue-50/60 px-2.5 py-1 rounded border border-blue-100"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{templateName}</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      ),
    },
    {
      header: "Overlay Status",
      accessor: "id",
      sortable: false,
      render: () => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          Coordinates Mapped
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "id",
      sortable: false,
      render: (id, row) => (
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditingTemplate(row)}
            icon={Edit3}
            className="text-xs h-7 px-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            title="Edit Mapping"
          />
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => handleDelete(id, row.category)}
            icon={Trash2}
            className="text-xs h-7 px-2"
            title="Remove Template"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Template Management" },
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Certificate Templates</h1>
          <p className="text-sm text-slate-500">
            Upload blank PDFs (e.g., "Silver.pdf") and map them to their respective Award Categories.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          icon={UploadCloud}
          onClick={() => {
            setAlertInfo(null);
            setIsAddModalOpen(true);
          }}
        >
          Map New Template
        </Button>
      </div>

      {/* Notification Alert */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          title={alertInfo.title}
          message={alertInfo.message}
        />
      )}

      {/* Info Context Card */}
      <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
        <Layers className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <p className="font-semibold">Dynamic Overlay Notice</p>
          <p className="text-amber-800/90">
            The system will automatically overlay text like <strong>&lt;Emp Name&gt;</strong>, <strong>&lt;Emp Code&gt;</strong>, <strong>&lt;Month&gt;</strong>, and Signatures over these mapped templates during generation. Ensure the uploaded PDFs are completely blank in the text regions.
          </p>
        </div>
      </div>

      {/* Data Table */}
      <Card
        title="Active Master Templates"
        subtitle="These templates are actively linked to Award Categories for the auto-sorting engine."
      >
        <Table
          columns={columns}
          data={templates}
          isLoading={isFetching}
          searchPlaceholder="Search by category or file name..."
          itemsPerPage={5}
        />
      </Card>

      {/* 1. Modal: Upload & Map New Template */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setShowMapper(false);
          setMappingData(null);
          if (tempFileUrl) URL.revokeObjectURL(tempFileUrl);
        }}
        title={showMapper ? "Map Dynamic Elements on PDF" : "Upload & Map PDF Template"}
        maxWidth={showMapper ? "max-w-6xl" : "max-w-lg"}
      >
        {!showMapper ? (
          <DynamicForm
            fields={templateFormFields}
            formData={formData}
            onChange={setFormData}
            onSubmit={(e) => handleUploadTemplate(e)}
            isLoading={isAdding}
            submitButton={
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full mt-4"
                isLoading={isAdding}
                icon={UploadCloud}
              >
                Proceed to Mapping Overlay
              </Button>
            }
          />
        ) : (
          <TemplateMapper 
            fileUrl={tempFileUrl}
            onMappingSave={(data) => {
              setMappingData(data);
              handleUploadTemplate(null, data);
            }}
          />
        )}
      </Modal>

      {/* 2. Modal: Inspect PDF Template */}
      <Modal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={`Template Asset: ${previewTemplate?.templateName || ""}`}
        maxWidth="max-w-md"
      >
        {previewTemplate && (
          <div className="space-y-4 text-center">
            {/* Mock Visualizer of the Blank PDF */}
            <div className="aspect-[1.414/1] bg-slate-900 rounded-lg border-2 border-slate-700 flex flex-col items-center justify-center p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 to-transparent pointer-events-none" />
              <FileText className="w-12 h-12 text-slate-500 mb-2" />
              <div className="font-serif text-lg text-slate-300 tracking-wider">
                {previewTemplate.templateName}
              </div>
              <div className="text-[10px] text-slate-500 mt-4 border border-slate-600 px-2 py-1 rounded bg-slate-800/50">
                [ BLANK TEMPLATE PREVIEW ]
              </div>
            </div>

            <div className="text-left text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <p>
                <span className="text-slate-500 font-medium">Mapped Category:</span>{" "}
                <span className="font-semibold text-slate-800">{previewTemplate.category}</span>
              </p>
              <p>
                <span className="text-slate-500 font-medium">Engine Trigger:</span>{" "}
                <span className="text-blue-600 font-semibold">Ready for Level 2 Sorting</span>
              </p>
              {previewTemplate.pdfUrl && (
                <p>
                  <span className="text-slate-500 font-medium">File Path:</span>{" "}
                  <a href={previewTemplate.pdfUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                    View Original PDF
                  </a>
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setPreviewTemplate(null)}
            >
              Dismiss
            </Button>
          </div>
        )}
      </Modal>

      {/* 3. Modal: Edit Existing Mapping */}
      <Modal
        isOpen={!!editingTemplate}
        onClose={() => setEditingTemplate(null)}
        title={`Edit Mapping: ${editingTemplate?.category}`}
        maxWidth="max-w-6xl"
      >
        {editingTemplate && (
          <TemplateMapper 
            fileUrl={editingTemplate.pdfUrl}
            initialData={editingTemplate.mappingData}
            onMappingSave={(data) => handleUpdateMapping(data)}
          />
        )}
      </Modal>
    </div>
  );
}