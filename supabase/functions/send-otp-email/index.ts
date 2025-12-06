import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// Brevo API configuration (no domain required!)
const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || ''
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'alegaspi_ccs@uspf.edu.ph'
const FROM_NAME = Deno.env.get('FROM_NAME') || 'GlamQueue'

interface RequestBody {
  email: string
  code: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { email, code }: RequestBody = await req.json()

    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Check if Brevo API key is configured
    if (!BREVO_API_KEY) {
      console.error('BREVO_API_KEY environment variable is not set')
      return new Response(
        JSON.stringify({ 
          error: 'Email service not configured',
          details: 'BREVO_API_KEY secret is missing. Please set it in Supabase Dashboard > Edge Functions > send-otp-email > Settings > Secrets',
          fix: 'Go to Supabase Dashboard > Edge Functions > send-otp-email > Settings > Secrets and add BREVO_API_KEY. Get your API key from https://app.brevo.com/settings/keys/api'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Validate code format (should be 6 digits)
    if (!/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format. Code must be 6 digits' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Prepare email HTML and text content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your GlamQueue Verification Code</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #e91e8c 0%, #f06292 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">GlamQueue</h1>
          </div>
          <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Email Verification</h2>
            <p style="color: #666; font-size: 16px;">Thank you for signing up! Please use the following code to verify your email address:</p>
            <div style="background: #f9fafb; border: 2px dashed #e91e8c; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
              <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e91e8c; font-family: 'Courier New', monospace;">
                ${code}
              </div>
            </div>
            <p style="color: #666; font-size: 14px; margin-bottom: 0;">
              This code will expire in <strong>5 minutes</strong>.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you didn't request this code, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} GlamQueue. All rights reserved.</p>
          </div>
        </body>
      </html>
    `

    const emailText = `
GlamQueue Email Verification

Thank you for signing up! Please use the following code to verify your email address:

${code}

This code will expire in 5 minutes.

If you didn't request this code, please ignore this email.

© ${new Date().getFullYear()} GlamQueue. All rights reserved.
    `

    // Send email via Brevo API
    const brevoUrl = 'https://api.brevo.com/v3/smtp/email'
    
    // Log request details (without sensitive data)
    console.log('Sending email via Brevo:', {
      to: email,
      from: FROM_EMAIL,
      fromName: FROM_NAME,
      apiKeyPrefix: BREVO_API_KEY.substring(0, 10) + '...',
      apiKeyLength: BREVO_API_KEY.length
    })
    
    const requestBody = {
      sender: {
        name: FROM_NAME,
        email: FROM_EMAIL,
      },
      to: [
        {
          email: email,
        },
      ],
      subject: 'Your GlamQueue Verification Code',
      htmlContent: emailHtml,
      textContent: emailText,
    }
    
    const response = await fetch(brevoUrl, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
    console.log('Brevo API response status:', response.status, response.statusText)

    // Parse response - handle both success and error cases
    let responseData: Record<string, unknown> = {}
    try {
      const contentType = response.headers.get('content-type')
      const responseText = await response.text()
      
      console.log('Brevo API response content-type:', contentType)
      console.log('Brevo API response body:', responseText.substring(0, 500)) // Log first 500 chars
      
      if (contentType && contentType.includes('application/json')) {
        responseData = JSON.parse(responseText)
      } else if (responseText) {
        try {
          responseData = JSON.parse(responseText)
        } catch {
          responseData = { message: responseText || 'Unknown error' }
        }
      }
    } catch (parseError) {
      console.error('Failed to parse Brevo API response:', parseError)
      responseData = { message: 'Invalid response from email service' }
    }
    
    console.log('Parsed Brevo response data:', JSON.stringify(responseData, null, 2))

    if (!response.ok) {
      console.error('Brevo API error:', JSON.stringify(responseData, null, 2))
      
      let errorMessage = 'Failed to send email'
      const errorDetails = responseData
      let fixInstructions = 'Check: 1) BREVO_API_KEY is correct, 2) FROM_EMAIL is set, 3) Brevo account is active'
      
      if (responseData.message) {
        if (responseData.message.includes('Invalid API key') || responseData.message.includes('unauthorized')) {
          errorMessage = 'Invalid Brevo API key. Please check BREVO_API_KEY secret in Supabase Dashboard'
          fixInstructions = 'Get your API key from https://app.brevo.com/settings/keys/api and add it as BREVO_API_KEY secret'
        } else if (responseData.message.includes('sender')) {
          errorMessage = `Invalid sender email: ${FROM_EMAIL}. Please set a valid FROM_EMAIL secret`
        } else if (responseData.message.includes('quota') || responseData.message.includes('limit')) {
          errorMessage = 'Brevo email quota exceeded. Free tier allows 300 emails/day'
          fixInstructions = 'Wait for daily reset or upgrade your Brevo plan'
        }
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: errorDetails,
          fromEmail: FROM_EMAIL,
          fix: fixInstructions
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

    // Check if Brevo actually returned success
    // Brevo returns 201 Created on success, not 200
    if (response.status === 201 || response.status === 200) {
      console.log('Email sent successfully via Brevo:', responseData)

      // Brevo returns messageId in the response
      const messageId = responseData.messageId || responseData.id || 'unknown'
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          messageId,
          status: response.status,
          brevoResponse: responseData
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    } else {
      // Unexpected status code
      console.error('Unexpected Brevo API status:', response.status, responseData)
      return new Response(
        JSON.stringify({ 
          error: 'Email service returned unexpected status',
          details: responseData,
          status: response.status
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }
  } catch (error) {
    console.error('Error in send-otp-email function:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: errorMessage,
        stack: errorStack,
        fix: 'Check Edge Function logs in Supabase Dashboard for more details'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})

