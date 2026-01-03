/**
 * CLIENT-SIDE Resume Text Extractor
 * ✅ 100% Vercel-safe - runs in the browser only
 * Uses pdfjs-dist for PDF parsing (no server-side dependencies)
 * 
 * Why this works on Vercel:
 * - All parsing happens in the browser
 * - No Node.js native modules required
 * - No canvas or DOMMatrix dependencies on server
 * - Only sends extracted TEXT to backend API
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker - lazy load only when needed in browser
// This prevents Next.js from trying to bundle/import it during SSR
let workerConfigured = false;

function configureWorker() {
  if (typeof window !== 'undefined' && !workerConfigured) {
    // Use local worker from public directory (avoids CDN/CORS issues with Turbopack)
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';
    workerConfigured = true;
  }
}

/**
 * Extract text from PDF file (client-side only)
 * @param {File} file - PDF file from user upload
 * @returns {Promise<string>} Extracted text
 * @throws {Error} If PDF parsing fails
 */
async function extractTextFromPDF(file) {
  // Configure worker lazily (only in browser, only when needed)
  configureWorker();
  
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    console.log('📄 PDF loaded. Pages:', pdf.numPages);
    
    if (pdf.numPages === 0) {
      throw new Error('PDF file appears to be empty');
    }
    
    // Extract text from all pages
    const textPromises = [];
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      textPromises.push(
        pdf.getPage(pageNum).then(async (page) => {
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => item.str)
            .join(' ');
          return pageText;
        })
      );
    }
    
    // Wait for all pages to be processed
    const pagesText = await Promise.all(textPromises);
    const fullText = pagesText.join('\n\n');
    
    console.log('✅ PDF text extracted. Length:', fullText.length, 'characters');
    
    if (!fullText || fullText.trim().length === 0) {
      throw new Error('PDF contains no readable text. It may be scanned/image-based. Please use a text-based PDF.');
    }
    
    return fullText;
  } catch (error) {
    console.error('❌ PDF extraction error:', error);
    
    // Provide user-friendly error messages
    if (error.message.includes('Invalid PDF')) {
      throw new Error('Invalid PDF file. The file may be corrupted or not a valid PDF.');
    }
    if (error.message.includes('password')) {
      throw new Error('PDF is password-protected. Please unlock the PDF and try again.');
    }
    if (error.name === 'PasswordException') {
      throw new Error('This PDF is password-protected. Please remove the password and try again.');
    }
    
    throw error;
  }
}

/**
 * Extract text from DOCX file (client-side)
 * Note: For DOCX, we'll read as text and send to backend for parsing
 * @param {File} file - DOCX file
 * @returns {Promise<string>} File name (backend will handle DOCX parsing)
 */
async function extractTextFromDOCX(file) {
  // DOCX parsing requires mammoth which works better on server
  // We'll send the file to backend for this format
  throw new Error('DOCX files must be processed on server. Converting to server upload...');
}

/**
 * Extract text from DOC file (client-side)
 * @param {File} file - DOC file
 * @returns {Promise<string>} File name (backend will handle DOC parsing)
 */
async function extractTextFromDOC(file) {
  // DOC parsing requires server-side libraries
  throw new Error('DOC files must be processed on server. Converting to server upload...');
}

/**
 * Main function: Extract resume text from file (CLIENT-SIDE)
 * ✅ Works in browser - safe for Vercel
 * @param {File} file - Resume file from user upload
 * @returns {Promise<{text: string, fileName: string, fileSize: number}>} Extracted text and metadata
 */
export async function extractResumeTextClient(file) {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds 10MB limit`);
    }
    
    console.log('📋 Extracting text from:', file.name, file.type);
    
    let text = '';
    
    // Extract based on file type
    switch (file.type) {
      case 'application/pdf':
        text = await extractTextFromPDF(file);
        break;
      
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        // DOCX needs server-side processing
        return {
          requiresServerProcessing: true,
          fileType: 'docx',
          fileName: file.name,
          fileSize: file.size
        };
      
      case 'application/msword':
        // DOC needs server-side processing
        return {
          requiresServerProcessing: true,
          fileType: 'doc',
          fileName: file.name,
          fileSize: file.size
        };
      
      default:
        throw new Error(`Unsupported file type: ${file.type}. Only PDF, DOC, and DOCX are supported.`);
    }
    
    // Validate extracted text
    const validation = validateExtractedText(text);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    return {
      text: text.trim(),
      fileName: file.name,
      fileSize: file.size,
      warnings: validation.warnings || []
    };
  } catch (error) {
    console.error('❌ Client-side extraction error:', error);
    throw error;
  }
}

/**
 * Validate extracted text quality
 * @param {string} text - Extracted text
 * @returns {Object} Validation result
 */
function validateExtractedText(text) {
  const trimmedText = text.trim();
  const warnings = [];
  
  if (!trimmedText) {
    return {
      valid: false,
      error: 'No text could be extracted from the resume. The file may be empty or image-based.'
    };
  }
  
  if (trimmedText.length < 50) {
    return {
      valid: false,
      error: 'Resume text is too short. Please ensure the file is not corrupted and contains actual content.'
    };
  }
  
  // Check for common resume sections (soft validation)
  const hasEmail = /\S+@\S+\.\S+/.test(trimmedText);
  const hasPhone = /\+?\d{10,}/.test(trimmedText);
  const hasSections = /experience|education|skills|projects/i.test(trimmedText);
  
  if (!hasEmail && !hasPhone) {
    warnings.push('No contact information detected in resume');
  }
  
  if (!hasSections) {
    warnings.push('Standard resume sections (experience, education, skills) may be missing');
  }
  
  return {
    valid: true,
    textLength: trimmedText.length,
    warnings
  };
}

/**
 * Check if browser supports required APIs
 * @returns {boolean} True if browser can parse PDFs
 */
export function isBrowserCompatible() {
  if (typeof window === 'undefined') return false;
  
  // Check for required APIs
  const hasArrayBuffer = 'ArrayBuffer' in window;
  const hasPromise = 'Promise' in window;
  const hasWorker = 'Worker' in window;
  
  return hasArrayBuffer && hasPromise && hasWorker;
}
