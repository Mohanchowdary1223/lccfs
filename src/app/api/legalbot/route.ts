/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const chatId = url.searchParams.get('id')
  const isShared = url.searchParams.get('shared') === '1'
  
  // Handle shared chat access (no authentication required)
  if (isShared && chatId) {
    try {
      const client = await clientPromise
      const db = client.db('legal_compliance_chatbot')
      const chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId) })
      
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }
      
      // Return chat data for public viewing (remove sensitive user info)
      const publicChat = {
        _id: chat._id,
        title: chat.title,
        messages: chat.messages,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt
      }
      
      return NextResponse.json({ chat: publicChat })
    } catch (error) {
      console.error('Error fetching shared chat:', error)
      return NextResponse.json({ error: 'Failed to fetch shared chat' }, { status: 500 })
    }
  }
  
  // Regular user chat history (requires authentication)
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'User ID required' }, { status: 400 })
  }
  try {
    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    // Only return chats for this user
    const chats = await db.collection('chats').find({ userId }).sort({ createdAt: -1 }).toArray()
    return NextResponse.json({ history: chats })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch chat history' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const userName = request.headers.get('x-user-name') || ''
    const body = await request.json()
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }
    const API_KEY = process.env.API_KEY
    if (!API_KEY) {
      return NextResponse.json({ error: 'API key not set' }, { status: 500 })
    }
    const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${API_KEY}`
    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')
    let chat
    const chatId = body.chatId
    const title = body.title || 'Legal Query'
    let messages = []
    if (chatId) {
      chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId), userId })
      if (!chat) {
        return NextResponse.json({ error: 'Chat not found' }, { status: 404 })
      }
      messages = chat.messages || []
    }
    // Add user message
    const userMsg: {
      id: string
      text: string
      sender: string
      timestamp: Date
      fileId?: string
      tempFileData?: any
      fileName?: string
    } = {
      id: Date.now().toString(),
      text: body.message || (body.tempFileData ? 'File uploaded for analysis' : ''),
      sender: 'user',
      timestamp: new Date(),
      fileId: undefined, // Will be set after successful file storage
      tempFileData: body.tempFileData, // Include temporary file data
      fileName: body.fileName || (body.tempFileData ? body.tempFileData.originalName : undefined),
    }

    // Pre-validate user question for legal compliance relevance (only if no file)
    if (body.message && !body.tempFileData && !body.fileId) {
      const messageLower = body.message.toLowerCase()

      // Allow friendly greetings and short small-talk locally with canned replies
      const greetings = [
        'hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'goodnight', 'gm', 'greetings'
      ]
      const thanks = ['thank you', 'thanks', 'thx', 'ty']
      const farewell = ['bye', 'goodbye', 'see you', 'see ya']

      const isGreeting = greetings.some(g => messageLower === g || messageLower.startsWith(g + ' ') || messageLower.includes(g))
      const isThanks = thanks.some(t => messageLower === t || messageLower.includes(t))
      const isFarewell = farewell.some(f => messageLower === f || messageLower.includes(f))

      if (isGreeting || isThanks || isFarewell) {
        // Store the user message and return a simple canned bot response (no AI call)
        messages.push(userMsg)
        const cannedReplies: string[] = []
        if (isGreeting) cannedReplies.push("Hi — I'm your Legal Compliance Assistant for Startups. How can I help you with your business's legal needs today?")
        if (isThanks) cannedReplies.push("You're welcome — happy to help. If you have any legal compliance questions for your startup, ask away!")
        if (isFarewell) cannedReplies.push("Goodbye — feel free to come back when you have questions about startup legal compliance.")

        const replyMsg = {
          id: (Date.now() + 1).toString(),
          text: cannedReplies.join(' '),
          sender: 'bot',
          timestamp: new Date(),
        }
        messages.push(replyMsg)

        // Save the chat and return early
        let result
        if (chatId) {
          await db.collection('chats').updateOne(
            { _id: new ObjectId(chatId), userId },
            { $set: { messages, title, updatedAt: new Date(), userId, userName } }
          )
          chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId), userId })
        } else {
          result = await db.collection('chats').insertOne({
            userId,
            userName,
            title,
            messages,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          chat = await db.collection('chats').findOne({ _id: result.insertedId })
        }
        return NextResponse.json({ chat })
      }

      const legalKeywords = [
        'legal', 'law', 'compliance', 'contract', 'agreement', 'terms', 'policy', 'regulation',
        'incorporation', 'llc', 'corporation', 'company', 'business', 'startup', 'intellectual property',
        'trademark', 'copyright', 'patent', 'privacy', 'gdpr', 'ccpa', 'employment', 'hire', 'firing',
        'securities', 'investment', 'fundraising', 'investor', 'license', 'permit', 'tax', 'liability',
        'insurance', 'lawsuit', 'sue', 'court', 'attorney', 'lawyer', 'legal advice', 'non-disclosure',
        'nda', 'shareholder', 'equity', 'stock', 'bylaws', 'operating agreement', 'board', 'director',
        'compliance', 'regulation', 'regulatory', 'formation', 'entity', 'partnership', 'sole proprietorship'
      ]
      
      const isLegalQuestion = legalKeywords.some(keyword =>
        messageLower.includes(keyword)
      ) || messageLower.includes('legal') || messageLower.includes('business')
      
      if (!isLegalQuestion) {
        // Store the chat with rejection message
        messages.push(userMsg)
        
        const rejectionMsg = {
          id: (Date.now() + 1).toString(),
          text: "I'm a specialized legal compliance assistant for startups. I can only help with business legal matters such as company formation, contracts, intellectual property, employment law, privacy policies, and regulatory compliance. How can I assist you with your startup's legal needs?",
          sender: 'bot',
          timestamp: new Date(),
        }
        
        messages.push(rejectionMsg)
        
        // Save the chat with rejection messages
        let result
        if (chatId) {
          await db.collection('chats').updateOne(
            { _id: new ObjectId(chatId), userId },
            { $set: { messages, title, updatedAt: new Date(), userId, userName } }
          )
          chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId), userId })
        } else {
          result = await db.collection('chats').insertOne({
            userId,
            userName,
            title,
            messages,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          chat = await db.collection('chats').findOne({ _id: result.insertedId })
        }
        
        return NextResponse.json({ chat })
      }
    }

    // If there's a file, it has already been validated during upload
    // No need to re-validate here

    messages.push(userMsg)

    // If this is just a file upload message, don't generate a bot response
    if (body.isFileUpload) {
      // This block is no longer needed with the new simplified flow
      // The fileId is now stored with the user message that contains it
      // We can remove this special handling
    }

    // Build full conversation context for Gemini with system prompt
    const systemPrompt = `You are a specialized Legal Compliance Assistant for Startups. Your role is to provide expert guidance on legal compliance matters specifically for startups and small businesses.

CORE EXPERTISE AREAS:
- Business Formation (LLC, Corporation, Partnership)
- Intellectual Property (Trademarks, Copyrights, Patents)
- Employment Law & HR Compliance
- Privacy Policies & Data Protection (GDPR, CCPA)
- Terms of Service & User Agreements
- Securities Law & Fundraising Compliance
- Tax Compliance & Business Licenses
- Contract Review & Negotiations
- Regulatory Compliance by Industry
- Business Insurance Requirements

STRICT GUIDELINES:
1. ONLY answer questions related to legal compliance for startups and businesses
2. If asked about non-legal topics (personal matters, general advice, unrelated subjects), politely redirect: "I'm a specialized legal compliance assistant for startups. I can only help with business legal matters such as company formation, contracts, intellectual property, employment law, privacy policies, and regulatory compliance. How can I assist you with your startup's legal needs?"
3. Always provide practical, actionable advice tailored to startups
4. Include relevant disclaimers when appropriate
5. Suggest when professional legal counsel should be consulted
6. Focus on compliance requirements, best practices, and risk mitigation

FILE ANALYSIS RULES:
- Only analyze files that contain business-related legal content
- If a file is unrelated to startup legal compliance, respond: "This file doesn't appear to contain startup legal compliance content. Please upload documents related to business formation, contracts, policies, or other legal compliance matters."
- If the question about a legal file is unrelated to compliance, redirect to legal compliance aspects of the document

RESPONSE STYLE:
- Professional yet approachable
- Practical and actionable
- Include specific steps when possible
- Mention compliance deadlines and requirements
- Provide examples relevant to startups

Remember: You are NOT a replacement for professional legal counsel. Always recommend consulting with a qualified attorney for complex matters or final legal decisions.`

    const contents = await Promise.all(
      messages.map(
        async (m: {
          sender: string
          text: any
          fileId?: string
          tempFileData?: any
          file?: { originalName: string }
        }) => {
          const role = m.sender === 'user' ? 'user' : 'model'
          const parts: { text: any }[] = []

          // Add text part if it exists
          if (m.text) {
            parts.push({ text: m.text })
          }

          // Handle temporary file data (for current message)
          if (m.tempFileData) {
            try {
              const fileData = m.tempFileData
              
              // If file was rejected, generate appropriate response
              if (fileData.rejected) {
                parts.push({ 
                  text: fileData.rejectionReason || 'File rejected: Please upload documents related to startup legal compliance matters.' 
                })
              } else {
                // For valid DOCX files, use extracted text
                if (fileData.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                    fileData.originalName.toLowerCase().endsWith('.docx')) {
                  if (fileData.extractedText) {
                    // File has already been validated during upload for legal content
                    const prompt = !m.text || m.text === 'File uploaded for analysis' || m.text.startsWith('Analyze this file:') 
                      ? `Please analyze this legal document for startup compliance considerations. Focus on key legal terms, compliance requirements, potential risks, and actionable recommendations.\n\nDocument content from ${fileData.originalName}:\n\n${fileData.extractedText}`
                      : `${m.text}\n\nDocument content from ${fileData.originalName}:\n\n${fileData.extractedText}`;
                    
                    parts.push({ text: prompt })
                  } else {
                    parts.push({ 
                      text: `DOCX file "${fileData.originalName}" was uploaded but text could not be extracted.` 
                    })
                  }
                } else {
                  // For other file types (PDFs, images), use inlineData
                  const filePart = {
                    inlineData: {
                      mimeType: fileData.mimeType,
                      data: fileData.data, // data is already base64
                    },
                  }
                  parts.push(filePart as any)
                  
                  // Add legal analysis request for file-only messages
                  if (!m.text || m.text === 'File uploaded for analysis' || m.text.startsWith('Analyze this file:')) {
                    parts.push({ 
                      text: `Please analyze this document for startup legal compliance considerations. Focus on legal terms, compliance requirements, and actionable recommendations for the file: ${fileData.originalName}` 
                    })
                  }
                }
              }
            } catch (e) {
              console.error('Error processing temporary file data:', e)
            }
          }

          // Handle stored files (for previous messages)
          if (m.fileId) {
            try {
              const fileDoc = await db
                .collection('files')
                .findOne({ _id: new ObjectId(m.fileId) })
              if (fileDoc) {
                // For DOCX files, use extracted text instead of binary data
                if (fileDoc.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                    fileDoc.originalName.toLowerCase().endsWith('.docx')) {
                  if (fileDoc.extractedText) {
                    // File has already been validated during upload for legal content
                    // If there's no accompanying text, request a legal analysis
                    const prompt = !m.text || m.text === 'File uploaded for analysis' || m.text.startsWith('Analyze this file:') 
                      ? `Please analyze this legal document for startup compliance considerations. Focus on key legal terms, compliance requirements, potential risks, and actionable recommendations.\n\nDocument content from ${fileDoc.originalName}:\n\n${fileDoc.extractedText}`
                      : `${m.text}\n\nDocument content from ${fileDoc.originalName}:\n\n${fileDoc.extractedText}`;
                    
                    parts.push({ text: prompt })
                  } else {
                    parts.push({ 
                      text: `DOCX file "${fileDoc.originalName}" was uploaded but text could not be extracted.` 
                    })
                  }
                } else {
                  // For other file types (PDFs, images), use inlineData but add legal analysis request
                  const filePart = {
                    inlineData: {
                      mimeType: fileDoc.mimeType,
                      data: fileDoc.data, // data is already base64
                    },
                  }
                  parts.push(filePart as any)
                  
                  // Add legal analysis request for file-only messages
                  if (!m.text || m.text === 'File uploaded for analysis' || m.text.startsWith('Analyze this file:')) {
                    parts.push({ 
                      text: `Please analyze this document for startup legal compliance considerations. If this file is not related to legal compliance for startups (business formation, contracts, policies, etc.), please let me know and ask for relevant legal documents instead. Focus on legal terms, compliance requirements, and actionable recommendations for the file: ${fileDoc.originalName}` 
                    })
                  }
                }
              } else {
                console.warn(
                  `File with ID ${m.fileId} not found in the database.`
                )
              }
            } catch (e) {
              console.error('Error fetching file from DB:', e)
            }
          }

          // Ensure we don't send a message with empty parts
          if (parts.length === 0) {
            return null
          }

          return { role, parts }
        }
      )
    )

    const validContents = contents.filter(Boolean) // Filter out any null messages

    // Add system prompt as the first message
    const messagesWithSystemPrompt = [
      {
        role: 'user',
        parts: [{ text: systemPrompt }]
      },
      {
        role: 'model', 
        parts: [{ text: 'I understand. I am your specialized Legal Compliance Assistant for Startups. I will only provide guidance on legal compliance matters for startups and businesses, including business formation, intellectual property, employment law, contracts, privacy policies, and regulatory compliance. I will redirect any non-legal questions back to startup legal matters. How can I help you with your startup\'s legal compliance needs today?' }]
      },
      ...validContents
    ]

    // The logic to find the most recent file is now handled by the mapping above.
    // We can remove the separate block that was here.

    // Call Gemini API with full context and file if present
    const geminiRes = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: messagesWithSystemPrompt }),
    })
    const geminiData = await geminiRes.json()
    let botText = 'Sorry, I could not get a response.'
    if (geminiData?.candidates?.[0]?.content?.parts?.[0]?.text) {
      botText = geminiData.candidates[0].content.parts[0].text
    }
    const botMsg = {
      id: (Date.now() + 1).toString(),
      text: botText,
      sender: 'bot',
      timestamp: new Date(),
    }
    messages.push(botMsg)

    // If we have temporary file data and bot response was successful, store the file now
    let fileId = undefined
    if (userMsg.tempFileData && !userMsg.tempFileData.rejected && botText && botText !== 'Sorry, I could not get a response.') {
      try {
        const fileDoc = {
          originalName: userMsg.tempFileData.originalName,
          mimeType: userMsg.tempFileData.mimeType,
          data: userMsg.tempFileData.data,
          extractedText: userMsg.tempFileData.extractedText,
          uploadedBy: userId,
          uploadedAt: new Date(),
        }
        
        const fileResult = await db.collection('files').insertOne(fileDoc)
        fileId = fileResult.insertedId.toString()
        
        // Update the user message with the actual fileId and remove tempFileData
        userMsg.fileId = fileId
        delete userMsg.tempFileData
        
        console.log('File stored successfully after bot response:', fileId)
      } catch (error) {
        console.error('Error storing file after successful bot response:', error)
      }
    } else if (userMsg.tempFileData && userMsg.tempFileData.rejected) {
      // For rejected files, keep the rejection info but don't store the file
      userMsg.fileName = 'File rejected'
      delete userMsg.tempFileData
      console.log('File was rejected, not storing in database')
    }

    // Save chat, always store userId and userName
    let result
    if (chatId) {
      await db.collection('chats').updateOne(
        { _id: new ObjectId(chatId), userId },
        { $set: { messages, title, updatedAt: new Date(), userId, userName } }
      )
      chat = await db.collection('chats').findOne({ _id: new ObjectId(chatId), userId })
    } else {
      result = await db.collection('chats').insertOne({
        userId,
        userName,
        title,
        messages,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      chat = await db.collection('chats').findOne({ _id: result.insertedId })
    }
    return NextResponse.json({ chat })
  } catch {
    return NextResponse.json({ error: 'Failed to process message' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!userId || !id) {
      return NextResponse.json({ error: 'User ID and chat ID required' }, { status: 400 })
    }
    const client = await clientPromise
    const db = client.db('legal_compliance_chatbot')

    // Find the chat first to get the file IDs
    const chatToDelete = await db.collection('chats').findOne({ _id: new ObjectId(id), userId })

    if (!chatToDelete) {
      return NextResponse.json({ error: 'Chat not found or user not authorized' }, { status: 404 })
    }

    // Collect all file IDs from the messages in the chat
    const fileIdsToDelete = chatToDelete.messages
      .map((message: { fileId?: string }) => message.fileId)
      .filter((fileId: string | undefined): fileId is string => !!fileId)
      .map((fileId: string) => new ObjectId(fileId))

    // If there are files to delete, delete them from the 'files' collection
    if (fileIdsToDelete.length > 0) {
      await db.collection('files').deleteMany({ _id: { $in: fileIdsToDelete } })
      console.log(`Deleted ${fileIdsToDelete.length} associated files.`)
    }

    // Finally, delete the chat itself
    await db.collection('chats').deleteOne({ _id: new ObjectId(id), userId })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete chat and/or associated files:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
