// components/ui/DynamicForm.jsx
"use client";

import React from "react";
import Button from "@/components/ui/Button";

export default function DynamicForm({
  fields = [],
  formData = {},
  onChange,
  onSubmit,
  submitLabel = "Submit",
  isLoading = false,
  className = "",
  submitButton = null,
}) {
  const handleInputChange = (name, value) => {
    onChange({
      ...formData,
      [name]: value,
    });
  };

  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
      {fields.map((field) => {
        const {
          name,
          label,
          type = "text",
          placeholder = "",
          required = false,
          options = [],
          icon: Icon,
          rows = 3,
        } = field;

        const value = formData[name] ?? "";

        return (
          <div key={name} className="space-y-1.5 text-left">
            {label && (
              <label className="block text-xs font-semibold text-slate-700">
                {label} {required && <span className="text-red-500">*</span>}
              </label>
            )}

            <div className="relative">
              {Icon && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                  <Icon className="w-4 h-4" />
                </span>
              )}

              {/* Select dropdown */}
              {type === "select" ? (
                <select
                  name={name}
                  value={value}
                  required={required}
                  onChange={(e) => handleInputChange(name, e.target.value)}
                  className={`w-full py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all ${
                    Icon ? "pl-9 pr-4" : "px-3"
                  }`}
                >
                  <option value="" disabled>
                    {placeholder || `Select ${label}`}
                  </option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : type === "textarea" ? (
                /* Textarea */
                <textarea
                  name={name}
                  rows={rows}
                  value={value}
                  required={required}
                  placeholder={placeholder}
                  onChange={(e) => handleInputChange(name, e.target.value)}
                  className={`w-full py-2 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all ${
                    Icon ? "pl-9 pr-4" : "px-3"
                  }`}
                />
              ) : type === "file" ? (
                /* File Input */
                <input
                  type="file"
                  name={name}
                  required={required}
                  onChange={(e) => handleInputChange(name, e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              ) : (
                /* Standard Input (text, password, number, email, etc.) */
                <input
                  type={type}
                  name={name}
                  value={value}
                  required={required}
                  placeholder={placeholder}
                  onChange={(e) => handleInputChange(name, e.target.value)}
                  className={`w-full py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all ${
                    Icon ? "pl-9 pr-4" : "px-3"
                  }`}
                />
              )}
            </div>
          </div>
        );
      })}

      {submitButton ? (
        submitButton
      ) : (
        <Button
          type="submit"
          variant="primary"
          size="md"
          className="w-full mt-4"
          isLoading={isLoading}
        >
          {submitLabel}
        </Button>
      )}
    </form>
  );
}