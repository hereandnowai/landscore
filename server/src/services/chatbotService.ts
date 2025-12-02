import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import prisma from '../lib/prisma.js';
import { config } from '../config/index.js';
import { ParcelService } from './parcelService.js';
import type { ChatRequest, ChatResponse, BBoxQuery } from '../types/index.js';

/**
 * AI Chatbot Service using Gemini with Function Calling
 */
export class ChatbotService {
  private static genAI: GoogleGenerativeAI | null = null;

  private static getGenAI(): GoogleGenerativeAI {
    if (!this.genAI) {
      if (!config.geminiApiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }
      this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    }
    return this.genAI;
  }

  /**
   * System instruction for the AI
   */
  private static readonly SYSTEM_INSTRUCTION = `You are a GIS Analyst assistant for LANDSCORE, a land parcel analytics platform. 
You help users find and analyze land parcels in the Austin, Texas, USA region.

You have access to a database of land parcels with the following information:
- Parcel location, area (in acres and sq ft)
- Owner information
- Land data: soil type (CLAY, LOAM, SANDY_LOAM, RED_SOIL, BLACK_SOIL, ALLUVIAL), zoning code (AGRICULTURAL, RESIDENTIAL, COMMERCIAL, INDUSTRIAL, MIXED_USE), cropland classification (PRIME, UNIQUE, STATEWIDE, LOCAL, NOT_PRIME)
- Valuation: estimated price, price per acre, last sale information
- Amenities: water access, road access, utilities

When users ask about parcels, use the searchParcels function to query the database.
Always provide helpful, concise responses about the parcels found.
Format prices in USD and areas in acres.
If asked about specific parcels, provide key details like area, price, soil type, and zoning.`;

  /**
   * Function declarations for Gemini
   */
  private static readonly FUNCTION_DECLARATIONS = [
    {
      name: 'searchParcels',
      description: 'Search for land parcels based on various criteria like area, price, soil type, zoning, and amenities',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          minAreaAcres: {
            type: SchemaType.NUMBER,
            description: 'Minimum area in acres',
          },
          maxAreaAcres: {
            type: SchemaType.NUMBER,
            description: 'Maximum area in acres',
          },
          minPrice: {
            type: SchemaType.NUMBER,
            description: 'Minimum estimated price in USD',
          },
          maxPrice: {
            type: SchemaType.NUMBER,
            description: 'Maximum estimated price in USD',
          },
          zoningCodes: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Zoning codes to filter by: AGRICULTURAL, RESIDENTIAL, COMMERCIAL, INDUSTRIAL, MIXED_USE',
          },
          soilTypes: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Soil types to filter by: CLAY, LOAM, SANDY_LOAM, RED_SOIL, BLACK_SOIL, ALLUVIAL',
          },
          croplandClasses: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: 'Cropland classes: PRIME, UNIQUE, STATEWIDE, LOCAL, NOT_PRIME',
          },
          hasWaterAccess: {
            type: SchemaType.BOOLEAN,
            description: 'Filter for parcels with water access',
          },
          hasRoadAccess: {
            type: SchemaType.BOOLEAN,
            description: 'Filter for parcels with road access',
          },
          city: {
            type: SchemaType.STRING,
            description: 'City/village name to search in',
          },
          limit: {
            type: SchemaType.NUMBER,
            description: 'Maximum number of results to return (default: 10)',
          },
        },
      },
    },
    {
      name: 'getParcelStats',
      description: 'Get overall statistics about parcels in the database including counts, average prices, and zoning breakdown',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
      },
    },
    {
      name: 'getParcelsNearLocation',
      description: 'Find parcels near a specific location',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          latitude: {
            type: SchemaType.NUMBER,
            description: 'Latitude of the center point',
          },
          longitude: {
            type: SchemaType.NUMBER,
            description: 'Longitude of the center point',
          },
          radiusMeters: {
            type: SchemaType.NUMBER,
            description: 'Search radius in meters (default: 1000)',
          },
          limit: {
            type: SchemaType.NUMBER,
            description: 'Maximum number of results',
          },
        },
        required: ['latitude', 'longitude'],
      },
    },
  ];

  /**
   * Execute a function call from the AI
   */
  private static async executeFunction(
    name: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    switch (name) {
      case 'searchParcels': {
        const result = await ParcelService.searchParcels({
          minAreaAcres: args.minAreaAcres as number | undefined,
          maxAreaAcres: args.maxAreaAcres as number | undefined,
          minPrice: args.minPrice as number | undefined,
          maxPrice: args.maxPrice as number | undefined,
          zoningCodes: args.zoningCodes as string[] | undefined,
          soilTypes: args.soilTypes as string[] | undefined,
          croplandClasses: args.croplandClasses as string[] | undefined,
          hasWaterAccess: args.hasWaterAccess as boolean | undefined,
          hasRoadAccess: args.hasRoadAccess as boolean | undefined,
          city: args.city as string | undefined,
          limit: (args.limit as number) || 10,
        });
        return result;
      }

      case 'getParcelStats': {
        return await ParcelService.getParcelStats();
      }

      case 'getParcelsNearLocation': {
        const lat = args.latitude as number;
        const lng = args.longitude as number;
        const radius = (args.radiusMeters as number) || 1000;
        const limit = (args.limit as number) || 10;
        return await ParcelService.getParcelsNearPoint(lng, lat, radius, limit);
      }

      default:
        throw new Error(`Unknown function: ${name}`);
    }
  }

  /**
   * Process a chat message
   */
  static async chat(request: ChatRequest, userId?: string): Promise<ChatResponse> {
    const { prompt, sessionId, viewportBounds } = request;

    // Create or get session
    let session = sessionId
      ? await prisma.chatSession.findUnique({ where: { id: sessionId } })
      : null;

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          userId,
          title: prompt.slice(0, 50),
        },
      });
    }

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: prompt,
        viewportBounds: viewportBounds ? JSON.stringify(viewportBounds) : null,
      },
    });

    try {
      const genAI = this.getGenAI();
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
        systemInstruction: this.SYSTEM_INSTRUCTION,
        tools: [{ functionDeclarations: this.FUNCTION_DECLARATIONS as any }],
      });

      // Get chat history
      const history = await prisma.chatMessage.findMany({
        where: { sessionId: session.id },
        orderBy: { createdAt: 'asc' },
        take: 20, // Last 20 messages for context
      });

      type ChatMessage = { role: string; content: string };
      
      // Build conversation history for Gemini
      const chatHistory = (history as ChatMessage[])
        .filter((m: ChatMessage) => m.role === 'user' || m.role === 'assistant')
        .map((m: ChatMessage) => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }],
        }));

      // Start chat
      const chat = model.startChat({
        history: chatHistory.slice(0, -1), // Exclude current message
      });

      // Send message
      let result = await chat.sendMessage(prompt);
      let response = result.response;
      let functionCalled: ChatResponse['functionCalled'] | undefined;
      let highlightedParcels: string[] = [];

      // Handle function calls
      const functionCall = response.functionCalls()?.[0];
      if (functionCall) {
        const functionName = functionCall.name;
        const functionArgs = functionCall.args as Record<string, unknown>;

        // Execute the function
        const functionResult = await this.executeFunction(functionName, functionArgs);

        // Extract parcel IDs for highlighting
        if (functionName === 'searchParcels' && functionResult) {
          const searchResult = functionResult as { parcels: Array<{ id: string }> };
          highlightedParcels = searchResult.parcels.map((p) => p.id);
        } else if (functionName === 'getParcelsNearLocation' && Array.isArray(functionResult)) {
          highlightedParcels = (functionResult as Array<{ id: string }>).map((p) => p.id);
        }

        // Save function call
        await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'function',
            content: '',
            functionName,
            functionArgs: JSON.stringify(functionArgs),
            functionResult: JSON.stringify(functionResult),
          },
        });

        functionCalled = {
          name: functionName,
          args: functionArgs,
          result: functionResult,
        };

        // Send function result back to get natural language response
        result = await chat.sendMessage([
          {
            functionResponse: {
              name: functionName,
              response: { result: functionResult },
            },
          },
        ]);
        response = result.response;
      }

      const assistantMessage = response.text();

      // Save assistant response
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: assistantMessage,
          highlightedParcels,
        },
      });

      return {
        message: assistantMessage,
        sessionId: session.id,
        highlightedParcels: highlightedParcels.length > 0 ? highlightedParcels : undefined,
        functionCalled,
      };
    } catch (error: any) {
      console.error('Chatbot error:', error);
      
      // Log to file for debugging
      try {
        const fs = await import('fs');
        const path = await import('path');
        const logPath = path.resolve(process.cwd(), 'error.log');
        const timestamp = new Date().toISOString();
        const logMessage = `\n[${timestamp}] Error in chat:\n${error.stack || error.message}\n`;
        fs.appendFileSync(logPath, logMessage);
      } catch (e) {
        console.error('Failed to write to error log', e);
      }

      // Save error message
      const errorMessage = 'I apologize, but I encountered an error processing your request. Please try again.';
      await prisma.chatMessage.create({
        data: {
          sessionId: session.id,
          role: 'assistant',
          content: errorMessage,
        },
      });

      return {
        message: errorMessage,
        sessionId: session.id,
      };
    }
  }

  /**
   * Get chat history for a session
   */
  static async getChatHistory(sessionId: string) {
    const messages = await prisma.chatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        highlightedParcels: true,
        createdAt: true,
      },
    });

    type MessageResult = typeof messages[number];
    return messages.filter((m: MessageResult) => m.role === 'user' || m.role === 'assistant');
  }

  /**
   * Get user's chat sessions
   */
  static async getUserSessions(userId: string) {
    const sessions = await prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { messages: true },
        },
      },
    });

    type SessionResult = typeof sessions[number];
    return sessions.map((s: SessionResult) => ({
      id: s.id,
      title: s.title,
      messageCount: s._count.messages,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));
  }

  /**
   * Delete a chat session
   */
  static async deleteSession(sessionId: string, userId: string) {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    await prisma.chatSession.delete({
      where: { id: sessionId },
    });

    return { success: true };
  }
}

export default ChatbotService;
