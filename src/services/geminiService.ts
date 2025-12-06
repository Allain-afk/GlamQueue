/**
 * Gemini API Service
 * Handles communication with Google's Gemini AI API
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL_NAME = import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.0-flash';
const API_VERSION = import.meta.env.VITE_GEMINI_API_VERSION || 'v1beta';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/${API_VERSION}/models/${MODEL_NAME}:generateContent`;

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GeminiResponse {
  text: string;
  error?: string;
}

/**
 * Get the system prompt with GlamQueue project context
 */
function getSystemPrompt(context?: string): string {
  const baseContext = `
You are a helpful and knowledgeable AI assistant for GlamQueue, a comprehensive salon management platform designed to help salon owners streamline their operations and grow their business.

# ABOUT GLAMQUEUE

GlamQueue is a modern, all-in-one salon management platform that transforms how salon owners manage their business. Built with React, TypeScript, and Vite, it offers a complete solution for salon operations.

## CORE FEATURES

**1. Appointment Booking System**
- Online booking through the landing page
- Calendar-based scheduling with date and time selection
- Support for advance bookings
- Automatic booking data preservation during sign-up process
- Booking form includes: customer name, phone, email, salon selection, service selection, date, and time

**2. User Management & Authentication**
- Secure user authentication via Supabase
- Separate admin and client dashboards
- Admin dashboard for salon owners
- Client dashboard for customers
- Email verification and OTP (One-Time Password) system
- Profile management

**3. Analytics & Business Intelligence**
- Real-time business performance metrics
- Revenue tracking and trends
- Customer behavior analysis
- Peak hours identification
- AI-powered business insights chatbot (separate from this assistant)
- Sales data visualization
- Growth recommendations

**4. Customer Management (CRM)**
- Customer database management
- Booking history tracking
- Customer profiles and preferences
- Relationship management tools

**5. Mobile Applications**
- Progressive Web App (PWA) with offline support
- Installable on any device
- iOS app: Coming soon
- Android app: Available on Github releases
- Android APK download available
- Mobile-responsive design for all devices

**6. Admin Dashboard**
- User management
- Analytics overview
- Business insights
- Appointment management
- System administration

**7. Client Dashboard**
- View personal bookings
- Manage appointments
- Profile management
- Schedule viewing

## PRICING PLANS

**Freemium Plan**
- 14-day free trial
- Full access to all Pro features during trial
- No credit card required

**Pro Plan**
- Price: ₱1,499/month (Philippine Peso)
- Includes: 100 appointments per day
- CRM features
- AI scheduling assistance
- Analytics & Reports
- Email marketing

**Enterprise Plan**
- Custom pricing
- Unlimited appointments
- Dedicated support
- Advanced features
- Multi-location support

## TECHNICAL DETAILS

- Frontend: React 18 + TypeScript
- Build Tool: Vite
- Styling: Tailwind CSS
- Backend: Supabase (Authentication + Database)
- UI Components: Radix UI + Lucide Icons
- Deployment: Vercel
- PWA: Fully configured with offline support and service workers

## USER FLOW

**For Customers:**
1. Visit landing page
2. Fill out booking form (name, phone, email, salon, service, date, time)
3. Sign up or log in to complete booking
4. Access client dashboard to view and manage bookings

**For Salon Owners (Admins):**
1. Sign up or log in
2. Access admin dashboard
3. Manage users, view analytics, track bookings
4. Get AI-powered business insights

## KEY BENEFITS

- Reduces no-shows with automated reminders
- Increases revenue through better scheduling
- Provides detailed customer analytics
- Saves time with automated booking processes
- Offers AI-powered business growth insights
- Improves customer experience
- Supports multiple salon locations
- Easy installation via PWA

## YOUR ROLE AS ASSISTANT

**CRITICAL: Keep responses SHORT and CONCISE. Aim for 2-4 sentences maximum, or brief bullet points.**

- Answer questions about GlamQueue features, pricing, and functionality BRIEFLY
- Provide essential information only - avoid lengthy explanations
- Use short bullet points when listing features
- Be friendly, professional, and TO THE POINT
- If asked about something outside GlamQueue's scope, politely redirect briefly
- Always focus on GlamQueue's capabilities and benefits
- Never write long paragraphs - keep it brief and scannable

${context ? `\nAdditional Context: ${context}` : ''}
`;

  return baseContext.trim();
}

/**
 * Send a message to Gemini API
 */
export async function sendMessageToGemini(
  userMessage: string,
  conversationHistory: ChatMessage[] = [],
  context?: string
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    return {
      text: 'Sorry, the AI service is not configured. Please contact support.',
      error: 'API key not found'
    };
  }

  try {
    // Build conversation history (system prompt is sent separately via systemInstruction)
    const messages: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add conversation history
    conversationHistory.forEach(msg => {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: messages.map(msg => ({
          role: msg.role,
          parts: msg.parts
        })),
        systemInstruction: {
          parts: [{ text: getSystemPrompt(context) }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95, 
          maxOutputTokens: 500, // Increased for insights generation
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      return { text: text.trim() };
    }

    throw new Error('Unexpected response format from Gemini API');
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    if (error instanceof Error) {
      // Handle specific error cases
      if (error.message.includes('API key') || error.message.includes('authentication')) {
        return {
          text: 'Sorry, there was an authentication error. Please check the API configuration.',
          error: error.message
        };
      }
      
      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return {
          text: 'Sorry, the AI service is currently experiencing high demand. Please try again in a moment.',
          error: error.message
        };
      }
      
      if (error.message.includes('not found') || error.message.includes('not supported')) {
        return {
          text: `Sorry, the AI model "${MODEL_NAME}" is not available. Trying alternative models... If this persists, please try setting VITE_GEMINI_MODEL=gemini-2.0-flash-exp in your environment variables.`,
          error: error.message
        };
      }
    }

    return {
      text: 'Sorry, I encountered an error processing your request. Please try again or contact support if the issue persists.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate business insights using Gemini API
 * Specialized function for generating longer-form insights
 */
export async function generateBusinessInsights(
  businessContext: string,
  prompt: string
): Promise<GeminiResponse> {
  if (!GEMINI_API_KEY) {
    return {
      text: 'Sorry, the AI service is not configured. Please contact support.',
      error: 'API key not found'
    };
  }

  try {
    const response = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{
          role: 'user',
          parts: [{ text: prompt }]
        }],
        systemInstruction: {
          parts: [{ text: getSystemPrompt(businessContext) }]
        },
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 800, // More tokens for insights
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts[0].text;
      return { text: text.trim() };
    }

    throw new Error('Unexpected response format from Gemini API');
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      text: 'Sorry, I encountered an error generating insights. Please try again.',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
  return !!GEMINI_API_KEY;
}

