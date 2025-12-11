import { Handler } from '@netlify/functions';
import { OpenAI } from 'openai';

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Mock response for testing when API access is not available
const createMockResponse = (prompt?: string) => ({
  id: `mock-${Date.now()}`,
  object: 'response',
  created: Math.floor(Date.now() / 1000),
  model: 'computer-use-preview',
  output: [
    {
      type: 'message',
      role: 'assistant',
      content: [
        {
          type: 'text',
          text: `[MOCK MODE] Received prompt: "${prompt || 'screenshot'}". The computer-use-preview model is not accessible. Please request access from OpenAI.`,
        },
      ],
    },
  ],
});

export const handler: Handler = async (event) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const {
      previousResponseId,
      callId,
      screenshotBase64,
      acknowledgedSafetyChecks = [],
      currentUrl,
      prompt,
    } = JSON.parse(event.body || '{}');

    if (!prompt && (!callId || !screenshotBase64)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error: 'Provide prompt for first call or callId + screenshotBase64 for subsequent calls.',
        }),
      };
    }

    const inputs: any = prompt
      ? [
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: prompt,
              },
            ],
          },
        ]
      : [
          {
            type: 'computer_call_output',
            call_id: callId,
            acknowledged_safety_checks: acknowledgedSafetyChecks,
            current_url: currentUrl,
            output: {
              type: 'input_image',
              image_url: `data:image/png;base64,${screenshotBase64}`,
            },
          },
        ];

    const response = await client.responses.create({
      model: 'computer-use-preview',
      previous_response_id: previousResponseId,
      truncation: 'auto',
      reasoning: { summary: 'concise' },
      tools: [
        {
          type: 'computer_use_preview',
          display_width: 1024,
          display_height: 768,
          environment: 'browser',
        },
      ],
      input: inputs,
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('computer-use/step error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // If model access is denied, return mock response for testing
    if (errorMessage.includes('does not exist') || errorMessage.includes('access')) {
      const { prompt } = JSON.parse(event.body || '{}');
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createMockResponse(prompt)),
      };
    }

    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: errorMessage }),
    };
  }
};
