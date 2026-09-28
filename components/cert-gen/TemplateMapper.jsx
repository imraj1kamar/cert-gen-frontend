'use client';
import React, { useState, useRef } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Rnd } from 'react-rnd';

// Initialize PDF.js worker using unpkg (guaranteed to sync with npm versions)
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DEFAULT_FIELDS = {
  empName: { label: '[Employee Name]', x: 100, y: 100, size: 26, color: '#083069', isSig: false },
  empCode: { label: '[(Emp Code)]', x: 100, y: 150, size: 20, color: '#083069', isSig: false },
  month: { label: '[Month]', x: 100, y: 200, size: 22, color: '#083069', isSig: false },
  signature1: { label: '[Signature 1]', x: 160, y: 300, size: 12, color: '#083069', isSig: true },
  signature2: { label: '[Signature 2]', x: 500, y: 300, size: 12, color: '#083069', isSig: true }
};

export default function TemplateMapper({ fileUrl, onMappingSave, initialData }) {
  const [numPages, setNumPages] = useState(null);
  const [pdfDimensions, setPdfDimensions] = useState({ width: 0, height: 0 });
  
  // Use initialData if provided (for updating existing templates)
  const [fields, setFields] = useState(() => {
    if (initialData) {
      const merged = { ...DEFAULT_FIELDS };
      Object.keys(initialData).forEach(key => {
        if (merged[key]) {
          merged[key] = {
            ...merged[key],
            x: initialData[key].uiX !== undefined ? initialData[key].uiX : initialData[key].x,
            y: initialData[key].uiY !== undefined ? initialData[key].uiY : initialData[key].y,
            size: initialData[key].size || merged[key].size,
            color: initialData[key].color || merged[key].color,
          };
        }
      });
      return merged;
    }
    return DEFAULT_FIELDS;
  });
  
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  function onPageLoadSuccess(page) {
    setPdfDimensions({ width: page.originalWidth, height: page.originalHeight });
  }

  const handleDrag = (key, e, d) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], x: d.x, y: d.y }
    }));
  };

  const handleDragStop = (key, e, d) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], x: d.x, y: d.y }
    }));
  };

  const handleConfigChange = (key, prop, value) => {
    setFields(prev => ({
      ...prev,
      [key]: { ...prev[key], [prop]: value }
    }));
  };

  const saveMapping = () => {
    const mappingData = {};
    Object.keys(fields).forEach(key => {
      const field = fields[key];
      // Convert UI y to PDF-lib Bottom-Left Y coordinate
      const pdfY = pdfDimensions.height - field.y - (field.size || 12);
      
      mappingData[key] = {
        x: field.x,
        y: pdfY,
        uiX: field.x,
        uiY: field.y,
        size: Number(field.size),
        color: field.color
      };
    });
    
    onMappingSave(mappingData);
  };

  return (
    <div className="flex flex-col xl:flex-row gap-6 mt-4">
      {/* PDF Preview Area */}
      <div className="flex-1 overflow-auto border border-gray-300 relative shadow-sm rounded-md bg-gray-100 p-4 flex justify-center min-h-[600px]">
        <Document file={fileUrl} onLoadSuccess={onDocumentLoadSuccess}>
          <Page 
            pageNumber={1} 
            renderTextLayer={false} 
            renderAnnotationLayer={false}
            onLoadSuccess={onPageLoadSuccess}
            scale={1}
            className="shadow-md"
          />
        </Document>

        {/* Draggable Overlays */}
        {pdfDimensions.width > 0 && Object.entries(fields).map(([key, field]) => (
          <Rnd
            key={key}
            position={{ x: field.x, y: field.y }}
            onDrag={(e, d) => handleDrag(key, e, d)}
            onDragStop={(e, d) => handleDragStop(key, e, d)}
            bounds="parent"
            enableResizing={false}
            className={`flex items-center justify-center p-2 border-2 border-dashed border-blue-500 cursor-move shadow-sm ${field.isSig ? 'bg-blue-100/50' : 'bg-yellow-100/50'}`}
            style={{ color: field.color, fontSize: `${field.size}px`, whiteSpace: 'nowrap', position: 'absolute' }}
          >
            {field.label}
          </Rnd>
        ))}
      </div>

      {/* Configuration Panel */}
      <div className="w-full xl:w-80 bg-white p-4 rounded-lg shadow-sm border border-gray-200 h-fit">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">Element Settings</h3>
        <p className="text-sm text-gray-500 mb-4">Drag the elements on the PDF preview to set coordinates.</p>
        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
          {Object.entries(fields).map(([key, field]) => (
            <div key={key} className="p-3 border border-gray-200 rounded bg-gray-50">
              <p className="font-medium text-sm text-gray-700 mb-2">{field.label}</p>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Size (px)</label>
                  <input 
                    type="number" 
                    value={field.size} 
                    onChange={(e) => handleConfigChange(key, 'size', e.target.value)}
                    className="w-full text-sm p-1.5 border rounded text-black"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Color (Hex)</label>
                  <div className="flex gap-1 items-center bg-white border rounded px-1">
                    <input 
                      type="color" 
                      value={field.color} 
                      onChange={(e) => handleConfigChange(key, 'color', e.target.value)}
                      className="w-6 h-6 p-0 border-0 cursor-pointer text-black"
                    />
                    <input 
                      type="text" 
                      value={field.color} 
                      onChange={(e) => handleConfigChange(key, 'color', e.target.value)}
                      className="w-full text-xs p-1 border-0 focus:ring-0 text-black"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">X (px)</label>
                  <input 
                    type="number" 
                    value={Math.round(field.x)} 
                    onChange={(e) => handleConfigChange(key, 'x', Number(e.target.value))}
                    className="w-full text-sm p-1.5 border rounded text-black"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Y (px)</label>
                  <input 
                    type="number" 
                    value={Math.round(field.y)} 
                    onChange={(e) => handleConfigChange(key, 'y', Number(e.target.value))}
                    className="w-full text-sm p-1.5 border rounded text-black"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <button 
          onClick={saveMapping}
          type="button"
          className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded transition-colors shadow-sm"
        >
          Confirm & Save Mapping
        </button>
      </div>
    </div>
  );
}
