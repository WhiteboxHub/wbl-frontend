'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Lightbulb,
  Maximize2,
  Trash2,
  Loader2,
} from 'lucide-react';

interface JdUploadStepProps {
  jdText: string;
  setJdText: (text: string) => void;
  jdFileName?: string;
  setJdFileName?: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];

export const JdUploadStep: React.FC<JdUploadStepProps> = ({
  jdText,
  setJdText,
  jdFileName: propJdFileName,
  setJdFileName: propSetJdFileName,
  onNext,
  onBack,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial file name from props or sessionStorage
  const [fileName, setFileName] = useState<string>(() => {
    if (propJdFileName) return propJdFileName;
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('aiprep_jd_filename') || '';
    }
    return '';
  });

  // Initial file size from sessionStorage
  const [fileSize, setFileSize] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const storedSize = sessionStorage.getItem('aiprep_jd_filesize');
      if (storedSize) return Number(storedSize);
    }
    return null;
  });

  // Initial pasted text: Only populate from jdText if there is NO file uploaded
  const [pastedText, setPastedText] = useState<string>(() => {
    const existingFile =
      propJdFileName ||
      (typeof window !== 'undefined' ? sessionStorage.getItem('aiprep_jd_filename') || '' : '');
    if (!existingFile) {
      if (jdText) return jdText;
      if (typeof window !== 'undefined') {
        return sessionStorage.getItem('aiprep_jd_text') || '';
      }
    }
    return '';
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync external file name prop
  useEffect(() => {
    if (propJdFileName !== undefined) {
      setFileName(propJdFileName);
    }
  }, [propJdFileName]);

  // Keep pastedText in sync if jdText is provided externally and there is no uploaded file
  useEffect(() => {
    if (!fileName && jdText && !pastedText) {
      setPastedText(jdText);
    }
  }, [jdText, fileName, pastedText]);

  const hasUploadedFile = Boolean(fileName && fileName.trim().length > 0);
  const hasValidJd = Boolean(jdText && jdText.trim().length > 0);

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes || bytes <= 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validateFile = (file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return `Invalid format "${ext}". Supported formats are PDF, DOC, DOCX, and TXT.`;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File size (${formatFileSize(file.size)}) exceeds the maximum 10 MB limit.`;
    }
    if (file.size === 0) {
      return 'The selected file is empty. Please choose a valid file.';
    }
    return null;
  };

  // Option A: Handle file upload and text extraction
  const processFile = useCallback(
    async (file: File) => {
      setErrorMessage(null);
      const validationError = validateFile(file);
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }

      setIsUploading(true);

      try {
        let extractedText = '';

        // If TXT, read text content directly in browser
        if (file.name.toLowerCase().endsWith('.txt')) {
          extractedText = await file.text();
        } else {
          // Frontend-only handling: extract file name & placeholder text for design/demo flow
          extractedText = `Job Description uploaded: ${file.name}\n\nPersonalized assessment will be tailored to this role.`;
        }

        if (!extractedText.trim()) {
          throw new Error('The uploaded file does not contain readable text.');
        }

        // Successfully extracted: Set file state & clear pastedText to avoid mixing JDs
        setJdText(extractedText);
        setFileName(file.name);
        setFileSize(file.size);
        setPastedText(''); // Clear pasted text
        if (propSetJdFileName) propSetJdFileName(file.name);

        if (typeof window !== 'undefined') {
          sessionStorage.setItem('aiprep_jd_text', extractedText);
          sessionStorage.setItem('aiprep_jd_filename', file.name);
          sessionStorage.setItem('aiprep_jd_filesize', String(file.size));
        }
      } catch (err: any) {
        console.error('[JdUploadStep] Upload error:', err);
        setErrorMessage(err?.message || 'Something went wrong while processing the file. Please try again.');
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [setJdText, propSetJdFileName]
  );

  // Option B: Handle candidate typing or pasting into textarea
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPastedText(newText);
    setErrorMessage(null);

    // If candidate switches to typing/pasting text, clear any attached file to avoid mixing JDs
    if (fileName) {
      setFileName('');
      setFileSize(null);
      if (propSetJdFileName) propSetJdFileName('');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('aiprep_jd_filename');
        sessionStorage.removeItem('aiprep_jd_filesize');
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    const trimmed = newText.trim();
    if (trimmed.length > 0) {
      setJdText(newText);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('aiprep_jd_text', newText);
      }
    } else {
      setJdText('');
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('aiprep_jd_text');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  const handleBrowseClick = () => {
    setErrorMessage(null);
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setJdText('');
    setFileName('');
    setFileSize(null);
    setPastedText('');
    setErrorMessage(null);
    if (propSetJdFileName) propSetJdFileName('');
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('aiprep_jd_text');
      sessionStorage.removeItem('aiprep_jd_filename');
      sessionStorage.removeItem('aiprep_jd_filesize');
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleNextClick = () => {
    if (!hasValidJd || isUploading) return;
    const effectiveText = jdText.trim();
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('aiprep_jd_text', effectiveText);
      if (fileName) {
        sessionStorage.setItem('aiprep_jd_filename', fileName);
        if (fileSize) sessionStorage.setItem('aiprep_jd_filesize', String(fileSize));
      } else {
        sessionStorage.removeItem('aiprep_jd_filename');
        sessionStorage.removeItem('aiprep_jd_filesize');
      }
    }
    onNext();
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 flex flex-col justify-between text-left overflow-hidden">
      {/* ── Content Area: Clean vertical hierarchy and proper divider placement ── */}
      <div className="flex-1 min-h-0 px-5 sm:px-7 md:px-8 py-3.5 sm:py-4 flex flex-col w-full overflow-y-auto">
        {/* ── Section 1: Header ── */}
        <div className="space-y-1 shrink-0 mb-3 sm:mb-3.5">
          <h2 className="text-lg sm:text-xl md:text-[22px] font-bold text-slate-900 dark:text-white leading-tight">
            Upload or Paste Your Job Description
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Upload your JD file or paste the job description below to personalize your assessment.
          </p>
        </div>

        {/* ── Section 2: Upload Dropzone & Tips Card ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-stretch shrink-0">
          {/* Left Column: Upload Dropzone */}
          <div className="lg:col-span-8 flex flex-col">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center text-center transition-all duration-200 min-h-[185px] sm:min-h-[195px] w-full ${
                isDragging
                  ? 'border-[#7C3AED] bg-purple-50/70 dark:bg-purple-950/40 ring-4 ring-purple-500/10'
                  : hasUploadedFile
                  ? 'border-emerald-300 dark:border-emerald-700/60 bg-emerald-50/30 dark:bg-emerald-950/10'
                  : 'border-purple-300 dark:border-purple-800/80 bg-white dark:bg-slate-900 hover:border-[#7C3AED] hover:bg-purple-50/20 dark:hover:bg-purple-950/10'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.txt"
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center justify-center space-y-2.5 py-3 animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-full bg-[#EDE9FE] dark:bg-purple-900/40 flex items-center justify-center text-[#7C3AED]">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Processing your Job Description...
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                      Extracting skills and role responsibilities
                    </p>
                  </div>
                </div>
              ) : hasUploadedFile ? (
                <div className="flex flex-col items-center justify-center space-y-2.5 w-full max-w-lg py-1 animate-in fade-in duration-200">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                  </div>
                  <div className="space-y-0.5">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                      Job Description Uploaded
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Your assessment will be tailored to this role.
                    </p>
                  </div>

                  {/* Uploaded File Badge */}
                  <div className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-white dark:bg-slate-900 shadow-2xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {fileName || 'Job_Description.pdf'}
                        </p>
                        {fileSize && (
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatFileSize(fileSize)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={handleBrowseClick}
                        className="text-xs sm:text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9] dark:text-purple-400 dark:hover:text-purple-300 px-2.5 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors cursor-pointer"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        title="Remove file"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-2 py-1">
                  <div className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 flex items-center justify-center text-[#7C3AED] dark:text-purple-400">
                    <UploadCloud className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-sm sm:text-base md:text-[16px] font-bold text-slate-900 dark:text-white mt-1">
                    Drag and drop your JD here
                  </h3>
                  <div className="flex items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs sm:text-[13px] my-0.5">
                    <span className="w-5 h-px bg-slate-300 dark:bg-slate-700" />
                    <span className="font-medium">or</span>
                    <span className="w-5 h-px bg-slate-300 dark:bg-slate-700" />
                  </div>

                  <button
                    type="button"
                    onClick={handleBrowseClick}
                    className="px-6 py-2 sm:px-7 sm:py-2.5 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-semibold text-xs sm:text-sm shadow-sm inline-flex items-center gap-2 transition-all duration-200 cursor-pointer active:scale-95"
                  >
                    <FileText className="w-4 h-4 stroke-[2]" />
                    <span>Browse files</span>
                  </button>

                  <p className="text-xs text-slate-400 dark:text-slate-500 pt-1">
                    PDF, DOC, DOCX, TXT <span className="mx-1">•</span> Maximum file size: 10 MB
                  </p>
                </div>
              )}
            </div>

            {/* Error Message Alert */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-2.5 mt-2 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/80 text-red-600 dark:text-red-400 text-xs sm:text-sm animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-medium flex-1">{errorMessage}</p>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-400 hover:text-red-600 cursor-pointer font-bold ml-2 text-xs"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Tips for a better upload card */}
          <div className="lg:col-span-4 flex flex-col">
            <div className="rounded-2xl p-4 sm:p-4.5 bg-[#F8FAFC]/90 dark:bg-slate-900/60 border border-blue-100/90 dark:border-slate-800 flex flex-col justify-between min-h-[185px] sm:min-h-[195px] h-full shadow-2xs">
              {/* Card Title */}
              <div className="flex items-center gap-2.5 text-slate-900 dark:text-white font-bold text-sm sm:text-[15px]">
                <div className="w-8 h-8 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-4 h-4 stroke-[2.2]" />
                </div>
                <h4>Tips for a better upload</h4>
              </div>

              {/* Tip 1 */}
              <div className="flex items-start gap-3 pt-2">
                <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Include role responsibilities and required skills.
                </p>
              </div>

              <div className="w-full h-px bg-slate-200/70 dark:bg-slate-800" />

              {/* Tip 2 */}
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Use PDF or DOCX for best results. You can also paste plain text.
                </p>
              </div>

              <div className="w-full h-px bg-slate-200/70 dark:bg-slate-800" />

              {/* Tip 3 */}
              <div className="flex items-start gap-3 pb-1">
                <div className="w-7 h-7 sm:w-7.5 sm:h-7.5 rounded-full bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Maximize2 className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <p className="text-xs sm:text-[13px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  Make sure uploaded files are under 10 MB.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 3: OR PASTE YOUR JD Separator (Clearly positioned between sections) ── */}
        <div className="relative flex items-center justify-center w-full my-3 sm:my-3.5 shrink-0">
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          <span className="flex-shrink mx-4 px-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-white dark:bg-slate-900 select-none">
            OR PASTE YOUR JD
          </span>
          <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        </div>

        {/* ── Section 4: Paste Job Description Textarea ── */}
        <div className="flex flex-col gap-1.5 flex-1 min-h-[120px]">
          <div className="flex items-center justify-between shrink-0">
            <label
              htmlFor="jd-textarea"
              className="text-xs sm:text-sm md:text-[14px] font-bold text-slate-900 dark:text-white"
            >
              Paste Job Description
            </label>
            <span className="text-xs sm:text-[12.5px] text-slate-400 dark:text-slate-500 font-medium">
              Choose one option: upload a file or paste text
            </span>
          </div>

          <textarea
            id="jd-textarea"
            value={pastedText}
            onChange={handleTextChange}
            placeholder="Paste your job description here... Include the role, responsibilities, required skills, and qualifications."
            rows={4}
            className="w-full flex-1 min-h-[95px] sm:min-h-[110px] md:min-h-[120px] p-3.5 sm:p-4 text-xs sm:text-sm md:text-[13.5px] text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/30 focus:border-[#7C3AED] placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-y transition-colors font-normal leading-relaxed shadow-2xs"
          />
        </div>
      </div>

      {/* ── Footer Navigation Buttons: Exactly matching ConsentStep ── */}
      <div className="shrink-0 px-4 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 mt-auto">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-1.5 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer shadow-2xs inline-flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <button
          type="button"
          onClick={handleNextClick}
          disabled={!hasValidJd || isUploading}
          className={`px-6 sm:px-7 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-all duration-200 ${
            hasValidJd && !isUploading
              ? 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white cursor-pointer active:scale-95 shadow-md shadow-purple-500/20'
              : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700 shadow-none'
          }`}
        >
          <span>Next</span>
          <ArrowRight className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};

export default JdUploadStep;
