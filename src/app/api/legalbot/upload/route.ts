import { NextRequest, NextResponse } from 'next/server'
import mammoth from 'mammoth'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const userId = formData.get('userId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('Processing file for validation:', file.name, 'Size:', file.size)

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    let extractedText = null

    // Extract text from DOCX files for validation
    if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
        file.name.toLowerCase().endsWith('.docx')) {
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer })
        extractedText = result.value
        console.log('Extracted text from DOCX:', extractedText.substring(0, 200) + '...')
        
        // Validate if the extracted text contains legal compliance content
        if (extractedText) {
          const fileContentLower = extractedText.toLowerCase()
          const legalKeywords = [
            'contract', 'agreement', 'terms', 'policy', 'legal', 'compliance', 'law', 'regulation',
            'incorporation', 'llc', 'corporation', 'partnership', 'intellectual property', 'trademark',
            'copyright', 'patent', 'privacy', 'gdpr', 'ccpa', 'employment', 'securities', 'investment',
            'fundraising', 'license', 'permit', 'tax', 'liability', 'insurance', 'non-disclosure',
            'nda', 'shareholder', 'equity', 'bylaws', 'operating agreement', 'board resolution',
            'business', 'company', 'startup', 'entity', 'formation', 'regulatory'
          ]
          
          const isLegalContent = legalKeywords.some(keyword => fileContentLower.includes(keyword))
          
          if (!isLegalContent) {
            // Return rejection data instead of error so chat can be stored
            return NextResponse.json({
              tempFileData: {
                originalName: 'File rejected',
                mimeType: 'text/plain',
                data: '',
                extractedText: '',
                rejected: true,
                rejectionReason: 'File rejected: This document does not appear to contain startup legal compliance content. Please upload documents related to business formation, contracts, policies, or other legal compliance matters.'
              },
              rejected: true,
              success: true,
            })
          }
        }
      } catch (extractError) {
        console.error('Failed to extract text from DOCX:', extractError)
      }
    } else {
      // For non-DOCX files (PDFs, images), validate based on filename patterns
      const fileName = file.name.toLowerCase()
      const legalFilePatterns = [
        'contract', 'agreement', 'terms', 'policy', 'legal', 'compliance', 'law', 'regulation',
        'incorporation', 'llc', 'corp', 'partnership', 'ip', 'trademark', 'copyright', 'patent',
        'privacy', 'gdpr', 'ccpa', 'employment', 'securities', 'investment', 'fundraising',
        'license', 'permit', 'tax', 'liability', 'insurance', 'nda', 'shareholder', 'equity',
        'bylaws', 'operating', 'board', 'business', 'company', 'startup', 'entity', 'formation'
      ]
      
      const isLegalFileName = legalFilePatterns.some(pattern => fileName.includes(pattern))
      
      if (!isLegalFileName) {
        // Return rejection data for non-legal file names
        return NextResponse.json({
          tempFileData: {
            originalName: 'File rejected',
            mimeType: 'text/plain',
            data: '',
            extractedText: '',
            rejected: true,
            rejectionReason: 'File rejected: This file does not appear to be related to startup legal compliance. Please upload documents with legal-related names or content such as contracts, agreements, policies, or compliance documents.'
          },
          rejected: true,
          success: true,
        })
      }
    }

    // Convert to base64 for temporary storage (not in database yet)
    const base64Data = fileBuffer.toString('base64')

    // Return file data for temporary client-side storage
    // File will only be stored in database after successful bot response
    return NextResponse.json({
      tempFileData: {
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        data: base64Data,
        extractedText,
        userId
      },
      originalFileName: file.name,
      success: true,
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('File processing error:', errorMessage)
    return NextResponse.json(
      {
        error: 'Internal server error during file processing',
        details: errorMessage,
      },
      { status: 500 }
    )
  }
}
