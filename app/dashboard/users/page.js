// app/dashboard/users/page.js
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
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  KeyRound,
  Trash2,
  Settings2,
  Lock,
  User,
  BadgeInfo,
} from "lucide-react";

import { userApi } from "@/redux/api/userApi";
import {
  setUsers,
  addUserToState,
  updateUserInState,
  removeUserFromState,
  setLoading,
  selectUsers,
  selectLoading,
} from "@/redux/slices/userSlice";

export default function UserManagementPage() {
  const dispatch = useDispatch();
  
  // Redux Store se state access kar rahe hain
  const users = useSelector(selectUsers) || [];
  const isFetching = useSelector(selectLoading);

  // Local Loading States for Buttons
  const [isAdding, setIsAdding] = useState(false);
  const [isUpdatingPerms, setIsUpdatingPerms] = useState(false);

  // Modals & UI States
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);

  // Form State for New User
  const [newUserFormData, setNewUserFormData] = useState({
    username: "",
    displayName: "",
    password: "",
    role: "user",
  });

  // Fetch Users on Component Mount
  useEffect(() => {
    const fetchAllUsers = async () => {
      dispatch(setLoading(true));
      try {
        const response = await userApi.getUsers();
        dispatch(setUsers(response.data || response));
      } catch (err) {
        console.error("Error fetching users:", err);
        dispatch(setUsers([])); // Error aane par empty array set kar dein
      } finally {
        dispatch(setLoading(false)); // Ye add karna zaroori hai
      }
    };
    fetchAllUsers();
  }, [dispatch]);

  // Dynamic Form Field Config for Adding a User
  const userFormFields = [
    {
      name: "username",
      label: "Username",
      type: "text",
      placeholder: "e.g., abc_ops",
      required: true,
      icon: User,
    },
    {
      name: "displayName",
      label: "Full Name",
      type: "text",
      placeholder: "e.g.",
      required: true,
      icon: BadgeInfo,
    },
    {
      name: "password",
      label: "Initial Password",
      type: "password",
      placeholder: "••••••••",
      required: true,
      icon: Lock,
    },
    {
      name: "role",
      label: "System Role",
      type: "select",
      required: true,
      options: [
        { label: "Operations User", value: "user" },
        { label: "System Administrator", value: "admin" },
      ],
      icon: KeyRound,
    },
  ];

  // Handle Add New User
  const handleCreateUser = async (e) => {
    e?.preventDefault();

    if (!newUserFormData.username || !newUserFormData.password || !newUserFormData.displayName) {
      setAlertInfo({
        type: "error",
        title: "Incomplete Details",
        message: "Please fill all mandatory fields to create an account.",
      });
      return;
    }

    // Check username uniqueness
    const exists = users.some(
      (u) => u.username.toLowerCase() === newUserFormData.username.trim().toLowerCase()
    );
    if (exists) {
      setAlertInfo({
        type: "error",
        title: "Duplicate Username",
        message: `Username "${newUserFormData.username}" already exists.`,
      });
      return;
    }

    setIsAdding(true);
    try {
      const response = await userApi.addUser(newUserFormData);
      const created = response.data || response;
      
      // Store mein naya user add karein
      dispatch(addUserToState(created));
      
      setIsAddUserModalOpen(false);
      setNewUserFormData({ username: "", displayName: "", password: "", role: "user" });
      setAlertInfo({
        type: "success",
        title: "User Created Successfully",
        message: `Credentials generated for ${created.displayName} (${created.username}).`,
      });
    } catch (err) {
      setAlertInfo({
        type: "error",
        title: "Creation Failed",
        message: err?.response?.data?.message || err.message || "Failed to create user.",
      });
    } finally {
      setIsAdding(false);
    }
  };

  // Open Permission Modal for specific user
  const handleOpenPermissions = (user) => {
    setSelectedUser({ ...user });
    setIsPermissionModalOpen(true);
  };

  // Save updated permissions
  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    
    setIsUpdatingPerms(true);
    try {
      const response = await userApi.updatePermissions(selectedUser.id, selectedUser.permissions);
      const updatedUser = response.data || response;
      
      // Redux store mein user update karein
      dispatch(updateUserInState(updatedUser));

      setIsPermissionModalOpen(false);
      setAlertInfo({
        type: "success",
        title: "Permissions Updated",
        message: `Access controls successfully modified for ${selectedUser.username}.`,
      });
    } catch (err) {
      setAlertInfo({
        type: "error",
        title: "Update Failed",
        message: err?.response?.data?.message || err.message || "Could not update user permissions.",
      });
    } finally {
      setIsUpdatingPerms(false);
    }
  };

  // Delete User
  const handleDeleteUser = async (userId, username) => {
    if (confirm(`Are you sure you want to deactivate and remove user: "${username}"?`)) {
      try {
        await userApi.deleteUser(userId);
        
        // Redux store se user hatayein
        dispatch(removeUserFromState(userId));
        
        setAlertInfo({
          type: "warning",
          title: "User Removed",
          message: `User account "${username}" was removed from directory.`,
        });
      } catch (err) {
        setAlertInfo({
          type: "error",
          title: "Delete Failed",
          message: err?.response?.data?.message || err.message || "Could not delete user.",
        });
      }
    }
  };

  // Table Columns Definition using Reusable Table API
 const tableColumns = [
    {
      header: "User Details",
      accessor: "name", // <-- 'displayName' ki jagah 'name' karein
      render: (name, row) => ( // <-- Yahan bhi 'name' pass karein
        <div>
          <p className="font-semibold text-slate-800 text-xs">{name || "No Name"}</p>
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">@{row.username}</p>
        </div>
      ),
    },
    {
      header: "Role",
      accessor: "role",
      render: (role) => (
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
            role === "admin"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {role === "admin" ? <ShieldCheck className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
          {role === "admin" ? "Admin" : "Operations"}
        </span>
      ),
    },
    {
      header: "Permissions Matrix",
      accessor: "permissions",
      sortable: false,
      render: (perms) => (
        <div className="flex gap-1.5 flex-wrap">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              perms?.can_generate_pdf ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"
            }`}
          >
            PDF Gen
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              perms?.can_upload_template ? "bg-purple-50 text-purple-700" : "bg-slate-100 text-slate-400"
            }`}
          >
            Templates
          </span>
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              perms?.can_manage_signatories ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-400"
            }`}
          >
            Signatures
          </span>
        </div>
      ),
    },
    {
      header: "Status",
      accessor: "status",
      render: (status) => (
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          {status}
        </span>
      ),
    },
    {
      header: "Created Date",
      accessor: "createdAt",
    },
    {
      header: "Actions",
      accessor: "id",
      sortable: false,
      render: (id, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleOpenPermissions(row)}
            icon={Settings2}
            className="text-[11px] h-7 px-2"
          >
            Permissions
          </Button>
          {row.username !== "admin" && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleDeleteUser(id, row.username)}
              icon={Trash2}
              className="text-[11px] h-7 px-2"
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "User Management" },
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management & Access Control</h1>
          <p className="text-sm text-slate-500">
            Create credentials, assign operational roles, and manage granular system permissions.
          </p>
        </div>

        <Button
          type="button"
          variant="primary"
          icon={UserPlus}
          onClick={() => {
            setAlertInfo(null);
            setIsAddUserModalOpen(true);
          }}
        >
          Create New User
        </Button>
      </div>

      {/* Reusable Alert for Success / Error notifications */}
      {alertInfo && (
        <Alert
          type={alertInfo.type}
          title={alertInfo.title}
          message={alertInfo.message}
        />
      )}

      {/* Reusable Table displaying Registered Accounts */}
      <Card
        title="Registered System Users"
        subtitle="Search and manage credentials stored in the system directory."
      >
        <Table
          columns={tableColumns}
          data={users}
          isLoading={isFetching} // Agara aapke table component mein isLoading prop hai toh
          searchPlaceholder="Search by name, username, or role..."
          itemsPerPage={5}
        />
      </Card>

      {/* 1. Modal: Add New User */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => setIsAddUserModalOpen(false)}
        title="Generate New User Credentials"
      >
        <DynamicForm
          fields={userFormFields}
          formData={newUserFormData}
          onChange={setNewUserFormData}
          onSubmit={handleCreateUser}
          isLoading={isAdding}
          submitButton={
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-4"
              isLoading={isAdding}
              icon={UserPlus}
            >
              Generate Credentials
            </Button>
          }
        />
      </Modal>

      {/* 2. Modal: Edit Permissions */}
      <Modal
        isOpen={isPermissionModalOpen}
        onClose={() => setIsPermissionModalOpen(false)}
        title={`Granular Permissions: ${selectedUser?.displayName || ""}`}
      >
        {selectedUser && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Configure operational privileges for user account <span className="font-mono font-bold">@{selectedUser.username}</span>.
            </p>

            <div className="space-y-3 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
              {/* Permission 1: Batch PDF Generation */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUser.permissions?.can_generate_pdf || false}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      permissions: {
                        ...selectedUser.permissions,
                        can_generate_pdf: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Allow Excel Upload & PDF Generation
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Upload master Excel sheet, run 3-tier grouping, and download zipped PDFs.
                  </span>
                </div>
              </label>

              {/* Permission 2: Template Uploading */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUser.permissions?.can_upload_template || false}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      permissions: {
                        ...selectedUser.permissions,
                        can_upload_template: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Allow Blank PDF Template Management
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Upload and map blank templates (Silver, Gold, Champions, MSD).
                  </span>
                </div>
              </label>

              {/* Permission 3: Signatory Management */}
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedUser.permissions?.can_manage_signatories || false}
                  onChange={(e) =>
                    setSelectedUser({
                      ...selectedUser,
                      permissions: {
                        ...selectedUser.permissions,
                        can_manage_signatories: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 block">
                    Allow Signatory & Designation Management
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Upload authorized signature images and configure official designations.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsPermissionModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSavePermissions}
                isLoading={isUpdatingPerms}
                icon={ShieldCheck}
              >
                Save Permissions
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}