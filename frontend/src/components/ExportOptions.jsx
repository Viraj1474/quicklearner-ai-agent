import React, { useState, forwardRef, useImperativeHandle, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./theme";

// Export format icons
const FormatIcons = {
  pdf: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6"/>
      <path d="M10 9v6M10 12h2.5a1.5 1.5 0 0 0 0-3H10"/>
    </svg>
  ),
  markdown: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="5" width="18" height="14" rx="2"/>
      <path d="M7 15V9l2.5 3L12 9v6M17 15v-6l-2 3"/>
    </svg>
  ),
  json: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/>
      <path d="M16 3h1a2 2 0 0 1 2 2v5a2 2 0 0 0 2 2 2 2 0 0 0-2 2v5a2 2 0 0 1-2 2h-1"/>
    </svg>
  ),
  txt: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>
    </svg>
  ),
};

// Convert data to different formats
const exportConverters = {
  // PDF export (creates a printable HTML that can be saved as PDF)
  pdf: async (data, title) => {
    const printContent = generatePrintableHTML(data, title);
    const printWindow = window.open("", "_blank");
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  },

  // Markdown export
  markdown: (data, title) => {
    let md = `# ${title}\n\n`;
    md += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
    
    if (data.summary) {
      md += `## Summary\n\n${data.summary}\n\n`;
    }
    
    if (data.flashcards?.length) {
      md += `## Flashcards\n\n`;
      data.flashcards.forEach((card, i) => {
        md += `### Card ${i + 1}\n\n`;
        md += `**Q:** ${card.front || card.question}\n\n`;
        md += `**A:** ${card.back || card.answer}\n\n`;
      });
    }
    
    if (data.quiz?.length) {
      md += `## Quiz Questions\n\n`;
      data.quiz.forEach((q, i) => {
        md += `### Question ${i + 1}\n\n`;
        md += `${q.question}\n\n`;
        if (q.options) {
          q.options.forEach((opt, j) => {
            const letter = String.fromCharCode(65 + j);
            md += `- ${letter}) ${opt}\n`;
          });
          md += `\n**Answer:** ${q.answer}\n\n`;
        }
      });
    }
    
    if (data.notes) {
      md += `## Notes\n\n${data.notes}\n\n`;
    }
    
    return md;
  },

  // JSON export
  json: (data, title) => {
    return JSON.stringify({ title, exportedAt: new Date().toISOString(), ...data }, null, 2);
  },

  // Plain text export
  txt: (data, title) => {
    let txt = `${title}\n${"=".repeat(title.length)}\n\n`;
    txt += `Exported on ${new Date().toLocaleDateString()}\n\n`;
    
    if (data.summary) {
      txt += `SUMMARY\n${"-".repeat(40)}\n${data.summary}\n\n`;
    }
    
    if (data.flashcards?.length) {
      txt += `FLASHCARDS\n${"-".repeat(40)}\n`;
      data.flashcards.forEach((card, i) => {
        txt += `\n[Card ${i + 1}]\n`;
        txt += `Q: ${card.front || card.question}\n`;
        txt += `A: ${card.back || card.answer}\n`;
      });
      txt += "\n";
    }
    
    if (data.quiz?.length) {
      txt += `QUIZ\n${"-".repeat(40)}\n`;
      data.quiz.forEach((q, i) => {
        txt += `\n[Question ${i + 1}]\n${q.question}\n`;
        if (q.options) {
          q.options.forEach((opt, j) => {
            txt += `  ${String.fromCharCode(65 + j)}) ${opt}\n`;
          });
          txt += `Answer: ${q.answer}\n`;
        }
      });
    }
    
    return txt;
  },
};

// Generate printable HTML for PDF
const generatePrintableHTML = (data, title) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1a1a1a; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #333; margin-top: 30px; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .question { font-weight: 600; margin-bottom: 8px; }
        .answer { color: #666; }
        .quiz-option { margin: 4px 0; padding: 4px 0; }
        .correct { color: #059669; font-weight: 600; }
        .meta { color: #999; font-size: 12px; margin-bottom: 20px; }
        @media print { body { padding: 20px; } }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <p class="meta">Exported on ${new Date().toLocaleDateString()}</p>
      ${data.summary ? `<h2>Summary</h2><p>${data.summary}</p>` : ''}
      ${data.flashcards?.length ? `
        <h2>Flashcards</h2>
        ${data.flashcards.map((card, i) => `
          <div class="card">
            <div class="question">Q: ${card.front || card.question}</div>
            <div class="answer">A: ${card.back || card.answer}</div>
          </div>
        `).join('')}
      ` : ''}
      ${data.quiz?.length ? `
        <h2>Quiz Questions</h2>
        ${data.quiz.map((q, i) => `
          <div class="card">
            <div class="question">${i + 1}. ${q.question}</div>
            ${q.options ? q.options.map((opt, j) => `
              <div class="quiz-option ${q.answer === opt ? 'correct' : ''}">
                ${String.fromCharCode(65 + j)}) ${opt}
              </div>
            `).join('') : ''}
          </div>
        `).join('')}
      ` : ''}
    </body>
    </html>
  `;
};

// Download file helper
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ExportOptions = forwardRef(({ 
  data = {},
  title = "Study Materials",
  onExportComplete,
}, ref) => {
  const { darkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(null);
  const [selectedFormats, setSelectedFormats] = useState([]);

  useImperativeHandle(ref, () => ({
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    exportAs: (format) => handleExport(format),
  }));

  const formats = [
    { id: "pdf", name: "PDF Document", ext: "pdf", mime: "application/pdf", desc: "Best for printing" },
    { id: "markdown", name: "Markdown", ext: "md", mime: "text/markdown", desc: "For note apps" },
    { id: "json", name: "JSON Data", ext: "json", mime: "application/json", desc: "For developers" },
    { id: "txt", name: "Plain Text", ext: "txt", mime: "text/plain", desc: "Universal format" },
  ];

  const toggleFormat = (formatId) => {
    setSelectedFormats(prev => 
      prev.includes(formatId) 
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  const handleExport = async (format) => {
    setExporting(format);
    
    try {
      const converter = exportConverters[format];
      const formatInfo = formats.find(f => f.id === format);
      
      if (format === "pdf") {
        await converter(data, title);
      } else {
        const content = converter(data, title);
        const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${formatInfo.ext}`;
        downloadFile(content, filename, formatInfo.mime);
      }
      
      onExportComplete?.(format);
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(null);
    }
  };

  const handleExportSelected = async () => {
    for (const format of selectedFormats) {
      await handleExport(format);
    }
    setIsOpen(false);
    setSelectedFormats([]);
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFormats([]);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed top-1/2 left-1/2 w-full max-w-lg z-50"
            style={{ x: "-50%", y: "-50%" }}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <div className={`
              mx-4 rounded-2xl border shadow-2xl overflow-hidden
              ${darkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-gray-200'}
            `}>
              {/* Header */}
              <div className={`flex items-center justify-between px-5 py-4 border-b ${
                darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'
              }`}>
                <div>
                  <h2 className={`text-lg font-semibold ${
                    darkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    Export Study Materials
                  </h2>
                  <p className={`text-sm mt-1 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Choose your preferred format
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode ? 'hover:bg-[#2a2a2a]' : 'hover:bg-gray-100'
                  }`}
                >
                  <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>

              {/* Format Options */}
              <div className="p-4 space-y-3">
                {formats.map((format) => (
                  <motion.button
                    key={format.id}
                    onClick={() => toggleFormat(format.id)}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 text-left
                      ${selectedFormats.includes(format.id)
                        ? darkMode
                          ? 'border-white bg-white/5'
                          : 'border-black bg-black/5'
                        : darkMode
                          ? 'border-[#2a2a2a] hover:border-[#3a3a3a]'
                          : 'border-gray-200 hover:border-gray-300'
                      }
                    `}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <div className={`p-3 rounded-xl ${
                      darkMode ? 'bg-[#2a2a2a] text-gray-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {FormatIcons[format.id]}
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {format.name}
                      </div>
                      <div className={`text-sm ${
                        darkMode ? 'text-gray-500' : 'text-gray-500'
                      }`}>
                        {format.desc}
                      </div>
                    </div>
                    <div className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
                      ${selectedFormats.includes(format.id)
                        ? darkMode
                          ? 'border-white bg-white'
                          : 'border-black bg-black'
                        : darkMode
                          ? 'border-[#3a3a3a]'
                          : 'border-gray-300'
                      }
                    `}>
                      {selectedFormats.includes(format.id) && (
                        <motion.svg 
                          className={darkMode ? 'text-black' : 'text-white'} 
                          width="14" 
                          height="14" 
                          viewBox="0 0 24 24" 
                          fill="none" 
                          stroke="currentColor" 
                          strokeWidth="3"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                        >
                          <path d="M20 6L9 17l-5-5"/>
                        </motion.svg>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Quick Export Buttons */}
              <div className={`px-4 pb-4 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                <p className="text-xs mb-2 text-center">Or export directly:</p>
                <div className="flex gap-2 justify-center">
                  {formats.map((format) => (
                    <button
                      key={format.id}
                      onClick={() => handleExport(format.id)}
                      disabled={exporting === format.id}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${darkMode 
                          ? 'bg-[#2a2a2a] hover:bg-[#333] text-gray-300' 
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                        }
                        ${exporting === format.id ? 'opacity-50' : ''}
                      `}
                    >
                      {exporting === format.id ? (
                        <motion.span
                          className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                      ) : (
                        `.${format.ext}`
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className={`flex items-center justify-end gap-3 px-5 py-4 border-t ${
                darkMode ? 'border-[#2a2a2a]' : 'border-gray-200'
              }`}>
                <button
                  onClick={handleClose}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    darkMode 
                      ? 'text-gray-400 hover:bg-[#2a2a2a]' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Cancel
                </button>
                <motion.button
                  onClick={handleExportSelected}
                  disabled={selectedFormats.length === 0}
                  className={`
                    px-5 py-2 rounded-xl text-sm font-medium transition-all
                    ${darkMode ? 'bg-white text-black' : 'bg-black text-white'}
                    ${selectedFormats.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}
                  `}
                  whileHover={selectedFormats.length > 0 ? { scale: 1.02 } : {}}
                  whileTap={selectedFormats.length > 0 ? { scale: 0.98 } : {}}
                >
                  Export {selectedFormats.length > 0 && `(${selectedFormats.length})`}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

ExportOptions.displayName = "ExportOptions";

// Hook for using export
export const useExport = () => {
  const exportRef = useRef(null);

  return {
    exportRef,
    openExport: () => exportRef.current?.open(),
    closeExport: () => exportRef.current?.close(),
    exportAs: (format) => exportRef.current?.exportAs(format),
  };
};

export default ExportOptions;
