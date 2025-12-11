import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { OpenAI } from 'openai';

const app = express();
const port = Number(process.env.PORT || 4000);
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/computer-use/step', async (req: Request, res: Response) => {
  try {
    const {
      previousResponseId,
      callId,
      screenshotBase64,
      acknowledgedSafetyChecks = [],
      currentUrl,
      prompt,
    } = req.body ?? {};

    if (!prompt && (!callId || !screenshotBase64)) {
      return res.status(400).json({
        error: 'Provide prompt for first call or callId + screenshotBase64 for subsequent calls.',
      });
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

    res.json(response);
  } catch (error) {
    console.error('computer-use/step error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
