// app/dashboard/materials/page.js
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
import {
  Feather,
  PlusCircle,
  User,
  Briefcase,
  Trash2,
  Edit, 
  Image as ImageIcon,
  CheckCircle,
  ExternalLink,
} from "lucide-react";

import { signatureApi } from "@/redux/api/signatoriesApi";

import {
  setSignatures,
  addSignatureToState,
  removeSignatureFromState,
  updateSignatureInState, 
  setLoading,
  selectSignatures,
  selectLoading,
} from "@/redux/slices/signatoriesSlice"; 

export default function MaterialManagementPage() {
  const dispatch = useDispatch();

  const signatories = useSelector(selectSignatures) || [];
  const isFetching = useSelector(selectLoading);

  // Local States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false); // Add aur Edit dono ke liye
  const [editingId, setEditingId] = useState(null); // Track karega ki Edit ho raha hai ya Add
  const [previewImageModal, setPreviewImageModal] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    designation: "",
    file: null, 
  });

  // Fetch Signatories
  useEffect(() => {
    const fetchAllSignatories = async () => {
      dispatch(setLoading(true));
      try {
        const response = await signatureApi.getSignatures();
        dispatch(setSignatures(response.data || response));
      } catch (err) {
        console.error("Error fetching signatories:", err);
        dispatch(setSignatures([]));
      } finally {
        dispatch(setLoading(false));
      }
    };
    fetchAllSignatories();
  }, [dispatch]);

  // Open Edit Modal 
  const handleOpenEdit = (signatory) => {
    setEditingId(signatory.id);
    setFormData({
      name: signatory.name,
      designation: signatory.designation || "",
      file: null, // Edit ke time file optional hoti hai
    });
    setAlertInfo(null);
    setIsModalOpen(true);
  };

  // Close Modal handler
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", designation: "", file: null });
  };

  // Dynamic Form Field Config
  const signatoryFormFields = [
    {
      name: "name",
      label: "Signatory Full Name",
      type: "text",
      placeholder: "e.g., Zacarias Fernandes",
      required: true,
      icon: User,
    },
    {
      name: "designation",
      label: "Official Designation",
      type: "text",
      placeholder: "e.g., Chief Human Resources Officer",
      required: false, 
      icon: Briefcase,
    },
    {
      name: "file",
      // 💡 FIX: Agar Edit kar rahe hain toh label aur required status change hoga
      label: editingId ? "Update Signature Image (Leave blank to keep current)" : "Transparent Signature Image (.png)",
      type: "file",
      required: !editingId, // Edit ke time required nahi hai
      icon: ImageIcon,
    },
  ];

  // Submit (Add ya Update) Handler
  const handleSubmitSignatory = async (e) => {
    e?.preventDefault();

    const trimmedName = formData.name.trim();
    const trimmedDesig = formData.designation.trim();

    // Validation: Agar naya bana rahe hain toh file zaroori hai
    if (!trimmedName || (!editingId && !formData.file)) {
      setAlertInfo({
        type: "error",
        title: "Validation Incomplete",
        message: "Signatory Name and Signature Image are required.",
      });
      return;
    }

    // Duplicate Name check (Edit ke time khudka naam ignore karega)
    const exists = signatories.some(
      (s) => s.name.toLowerCase() === trimmedName.toLowerCase() && s.id !== editingId
    );
    
    if (exists) {
      setAlertInfo({
        type: "warning",
        title: "Signatory Exists",
        message: `Signatory with name "${trimmedName}" is already registered.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const uploadData = new FormData();
      uploadData.append("name", trimmedName);
      uploadData.append("designation", trimmedDesig);
      
      // Agar file select ki hai tabhi append karein
      if (formData.file) {
        uploadData.append("file", formData.file);
      }
      
      if (editingId) {
        // 💡 FIX: UPDATE LOGIC
        const response = await signatureApi.updateSignature(editingId, uploadData);
        const updated = response.data || response;
        dispatch(updateSignatureInState(updated));
        
        setAlertInfo({
          type: "success",
          title: "Update Successful",
          message: `"${trimmedName}" has been updated successfully.`,
        });
      } else {
        // ADD LOGIC (Pehle wala)
        uploadData.append("status", 1);
        const response = await signatureApi.addSignature(uploadData);
        const created = response.data || response;
        dispatch(addSignatureToState(created));
        
        setAlertInfo({
          type: "success",
          title: "Signatory Registered",
          message: `"${trimmedName}" has been stored into the active directory.`,
        });
      }

      handleCloseModal();
    } catch (err) {
      setAlertInfo({
        type: "error",
        title: editingId ? "Update Failed" : "Registration Failed",
        message: err?.response?.data?.message || err.message || "Something went wrong.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Signatory handler
  const handleDelete = async (id, name) => {
    if (confirm(`Remove signatory "${name}"? This may cause validation stops if this name exists in future Excel uploads.`)) {
      try {
        await signatureApi.deleteSignature(id);
        dispatch(removeSignatureFromState(id));

        setAlertInfo({
          type: "warning",
          title: "Signatory Removed",
          message: `"${name}" was deleted from the signatory registry.`,
        });
      } catch (err) {
        setAlertInfo({
          type: "error",
          title: "Delete Failed",
          message: err?.response?.data?.message || err.message || "Could not remove signatory.",
        });
      }
    }
  };

  // Table Columns
  const columns = [
    {
      header: "Signatory Name",
      accessor: "name",
      render: (name, row) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs uppercase">
            {name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{name}</p>
            <span className="text-[10px] font-mono text-slate-400">ID: {row.id}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Designation",
      accessor: "designation",
      render: (desig) => (
        <span className="text-xs text-slate-700 font-medium">{desig || "N/A"}</span>
      ),
    },
    {
      header: "Signature Asset",
      accessor: "signatureUrl",
      sortable: false,
      render: (url, row) => (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewImageModal(row)}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 bg-blue-50/60 px-2.5 py-1 rounded border border-blue-100"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Inspect Asset</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </button>
        </div>
      ),
    },
    {
      header: "Validation Status",
      accessor: "id",
      sortable: false,
      render: () => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
          <CheckCircle className="w-3 h-3 text-emerald-600" />
          Pre-Check Ready
        </span>
      ),
    },
    {
      header: "Actions",
      accessor: "id",
      sortable: false,
      render: (id, row) => (
        <div className="flex items-center gap-2">
          {/* 💡 FIX: Edit Button Add Kiya */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            icon={Edit}
            className="text-xs h-7 px-2"
          />
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => handleDelete(id, row.name)}
            icon={Trash2}
            className="text-xs h-7 px-2"
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
          { label: "Material Management" },
          { label: "Signatories" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Signatory Materials</h1>
          <p className="text-sm text-slate-500">
            Register authorized signatories, designations, and transparent signatures for Phase 2 validation checks.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          icon={PlusCircle}
          onClick={() => {
            setAlertInfo(null);
            setEditingId(null);
            setFormData({ name: "", designation: "", file: null });
            setIsModalOpen(true);
          }}
        >
          Add Signatory
        </Button>
      </div>

      {alertInfo && (
        <Alert
          type={alertInfo.type}
          title={alertInfo.title}
          message={alertInfo.message}
        />
      )}

      <div className="bg-blue-50/60 border border-blue-200 p-4 rounded-xl flex items-start gap-3">
        <Feather className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-900 space-y-1">
          <p className="font-semibold">Validation Dependency Notice</p>
          <p className="text-blue-800/90">
            The names registered below are verified against the uploaded Excel file&apos;s <code>Signatory 1</code> and <code>Signatory 2</code> columns. Ensure the spelling matches exactly to prevent validation halts.
          </p>
        </div>
      </div>

      <Card
        title="Configured Signatories"
        subtitle="Assets stored permanently in the database for dynamic certificate overlay."
      >
        <Table
          columns={columns}
          data={signatories}
          isLoading={isFetching}
          searchPlaceholder="Search by name or designation..."
          itemsPerPage={5}
        />
      </Card>

      {/* 1. Modal: Form for Add & Update */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingId ? "Update Signatory Details" : "Upload Signatory Details"}
      >
        <DynamicForm
          fields={signatoryFormFields}
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmitSignatory}
          isLoading={isSubmitting}
          submitButton={
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-4"
              isLoading={isSubmitting}
              icon={editingId ? Edit : PlusCircle}
            >
              {editingId ? "Save Changes" : "Save Signatory"}
            </Button>
          }
        />
      </Modal>

      {/* 2. Modal: Inspect Signature Image Asset */}
      <Modal
        isOpen={!!previewImageModal}
        onClose={() => setPreviewImageModal(null)}
        title={`Signature Asset: ${previewImageModal?.name || ""}`}
        maxWidth="max-w-sm"
      >
        {previewImageModal && (
          <div className="space-y-4 text-center">
            <div className="p-6 bg-slate-100 rounded-xl border border-dashed border-slate-300 flex items-center justify-center min-h-[140px] relative">
              {previewImageModal.signatureUrl ? (
                <img 
                  src={previewImageModal.signatureUrl} 
                  alt="Signature" 
                  className="max-h-24 max-w-full object-contain" 
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }}
                />
              ) : null}
              <div className="font-serif italic text-lg text-slate-700 tracking-wider" style={{ display: previewImageModal.signatureUrl ? 'none' : 'block' }}>
                {previewImageModal.name}
              </div>
            </div>

            <div className="text-left text-xs bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
              <p>
                <span className="text-slate-500 font-medium">Designation:</span>{" "}
                <span className="font-semibold text-slate-800">{previewImageModal.designation || "N/A"}</span>
              </p>
              <p>
                <span className="text-slate-500 font-medium">Overlay Status:</span>{" "}
                <span className="text-emerald-600 font-semibold">Coordinate ready</span>
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setPreviewImageModal(null)}
            >
              Dismiss
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}