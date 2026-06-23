/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Simple in-memory rate limiting middleware to prevent uncontrolled resource consumption (CWE-400)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

const rateLimiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const ipStr = Array.isArray(ip) ? ip[0] : ip;
  const now = Date.now();

  const record = rateLimitStore.get(ipStr);
  if (!record || now > record.resetTime) {
    rateLimitStore.set(ipStr, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    next();
  } else if (record.count < MAX_REQUESTS) {
    record.count++;
    next();
  } else {
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  }
};

app.use(rateLimiter);
app.use(express.json());

// Lazy-initialize GoogleGenAI client to avoid crashing on startup
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing. Please set it in the Settings > Secrets configuration panel.');
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint to verify if the Gemini api key is configured
app.get('/api/key-status', (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: hasKey ? 'configured' : 'missing',
    message: hasKey 
      ? 'Gemini API key is configured and active.' 
      : 'Gemini API key is missing. Please add the GEMINI_API_KEY secret in Settings > Secrets.',
  });
});

// REST API endpoint to generate dynamic multi-agent search mission using Gemini with structure
app.post('/api/generate-swarm', async (req, res) => {
  let { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    prompt = "Optimize package distribution routes across logistics depots";
  }

  try {
    const ai = getAiClient();

    const systemInstruction = 
      "You are a complex Multi-Agent System Architect. Your task is to design a customized physical search " +
      "or optimization problem configuration matching the user's request. Create a list of 4-6 target coordinates, " +
      "appropriate hyperparameters tuned for optimization, distinct agent roles with customized task statuses, " +
      "and precise solver output logs. Return a standard JSON response matching the provided schema rules.";

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Design a custom multi-agent swarm search configuration for this task: "${prompt}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['name', 'description', 'metricLabel', 'params', 'dataPoints', 'agentRoles', 'simulatedLogs'],
          properties: {
            name: {
              type: Type.STRING,
              description: 'Appropriate title of this swarm mission, e.g., "Seattle Aerial Delivery Node Optimization"'
            },
            description: {
              type: Type.STRING,
              description: 'Detailed description of what the swarm agents are solving and current physical state constraints'
            },
            metricLabel: {
              type: Type.STRING,
              description: 'Physical metric being optimized, e.g., "Wind Shear Delta", "Thermal Draft Lift", "Liquidity Ratio"'
            },
            params: {
              type: Type.OBJECT,
              required: ['agentCount', 'cohesion', 'exploration', 'maxIterations', 'algorithm'],
              properties: {
                agentCount: { type: Type.INTEGER, description: 'Number of active agent nodes to spawn (50-450)' },
                cohesion: { type: Type.NUMBER, description: 'Tuned spatial cohesion index (0.1 to 1.0)' },
                exploration: { type: Type.NUMBER, description: 'Tuned exploration random walk rate (0.05 to 0.8)' },
                maxIterations: { type: Type.INTEGER, description: 'Tuned target analytical epochs/iterations (50-250)' },
                algorithm: { type: Type.STRING, description: 'Best swarm algorithm for this: PSO, ACO, ABC, or FLOCK' }
              }
            },
            dataPoints: {
              type: Type.ARRAY,
              description: 'Collection of 4 to 6 target coordination nodes within 10-90% relative canvas coordinates.',
              items: {
                type: Type.OBJECT,
                required: ['x', 'y', 'val', 'label'],
                properties: {
                  x: { type: Type.INTEGER, description: 'Percentage coordinate x axis (10 to 90)' },
                  y: { type: Type.INTEGER, description: 'Percentage coordinate y axis (15 to 85)' },
                  val: { type: Type.NUMBER, description: 'Standard metric intensity value (e.g. 0.05 to 1.5)' },
                  label: { type: Type.STRING, description: 'Descriptive human label of the location or asset point' }
                }
              }
            },
            agentRoles: {
              type: Type.ARRAY,
              description: 'Specific drone or agent types allocated to this multi-agent search.',
              items: {
                type: Type.OBJECT,
                required: ['role', 'status', 'battery', 'type'],
                properties: {
                  role: { type: Type.STRING, description: 'Distinct role title, e.g. "Scout Sensor Agent"' },
                  status: { type: Type.STRING, description: 'Current active status, e.g. "Broadcasting lidar mapping"' },
                  battery: { type: Type.INTEGER, description: 'Current nominal charge percentage (60-100)' },
                  type: { type: Type.STRING, description: 'Technical agent sub-class, e.g. "Sensor", "Carrier", "Relay"' }
                }
              }
            },
            simulatedLogs: {
              type: Type.ARRAY,
              description: 'Collection of 4 to 6 realistic logging lines describing agent coordination phases.',
              items: {
                type: Type.STRING
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error('Received empty text response from Gemini model.');
    }

    // Parse safety check
    const payload = JSON.parse(text);
    res.json({
      success: true,
      data: payload
    });

  } catch (error: any) {
    console.error('Gemini generate-swarm error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred while generating the swarm agent topology.'
    });
  }
});

// Setup Vite & Static Assets
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server fully operational on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start full-stack server application:', err);
});
