import fsSync from 'fs';
import { promises as fs } from 'fs';
import { GoogleGenAI } from "@google/genai";
import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
// 🚀 NEW: Import workflow functions
import {    
  detectWorkflowType,    
  createWorkflowFromTemplate,    
  workflowResponses  
} from "./workflows.js";

dotenv.config();

let shouldZoom = false;

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "AIzaSyB81fWNEHZ80iscjLzWH2Vl8lgfZqu5tDM"
});
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "9BWtsMINqrJLrRacOk9x";

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

// Simple RAG helper
async function rag(question) {
  const mem = JSON.parse(fsSync.readFileSync('mem.json', 'utf8'));
  const context = mem
    .filter(item =>
      question.toLowerCase().split(/\W+/)
        .some(w => item.q.toLowerCase().includes(w))
    )
    .map(item => item.a)
    .join('\n');

  const prompt = `Use the following context to answer the question.\n\nContext:\n${context}\n\nSystem:\nYou are a teacher.\nYou will always reply with a JSON array of messages. With a maximum of 3 messages.\nEach message has a text, facialExpression, and animation property.\nThe different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.\nThe different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry.\n\nUser: ${question}\n\nAnswer:`;

  const res = await gemini.models.generateContent({
    model: 'gemini-2.0-flash-001',
    contents: prompt,
    temperature: 0.6
  });
  const answer = res.text.trim();

  mem.push({ q: question, a: answer });
  fsSync.writeFileSync('mem.json', JSON.stringify(mem, null, 2));

  return answer;
}

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/voices", async (req, res) => {
  res.send(await voice.getVoices(elevenLabsApiKey));
});

const execCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) reject(error);
      resolve(stdout);
    });
  });
};

// Helper function to retry audio generation
const generateAudioWithRetry = async (apiKey, voiceId, fileName, text, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔊 Audio attempt ${attempt}/${maxRetries} for: "${text.substring(0, 50)}..."`);
      await voice.textToSpeech(apiKey, voiceId, fileName, text);
      console.log(`✅ Audio generated successfully on attempt ${attempt}`);
      return true;
    } catch (error) {
      console.error(`❌ Audio attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        const delay = attempt * 1000;
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
};

const lipSyncMessage = async (message) => {
  const time = new Date().getTime();
  console.log(`Starting conversion for message ${message}`);
  await execCommand(
    `ffmpeg -y -i audios/message_${message}.mp3 audios/message_${message}.wav`
  );
  console.log(`Conversion done in ${new Date().getTime() - time}ms`);
  await execCommand(
    `./bin/rhubarb -f json -o audios/message_${message}.json audios/message_${message}.wav -r phonetic`
  );
  console.log(`Lip sync done in ${new Date().getTime() - time}ms`);
};

// 🚀 UPDATED: Enhanced workflow creation function
async function sendWorkflowToNextJS(workflowType, userMessage) {
  try {
    const newWorkflow = createWorkflowFromTemplate(workflowType, userMessage);
    if (!newWorkflow) return;
    await fetch('http://localhost:3001/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workflow: newWorkflow, workflowType, originalMessage: userMessage })
    });
  } catch {}
}

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    // ... (unchanged welcome messages)
    return;
  }
  if (!elevenLabsApiKey) {
    // ... (unchanged API-key warning messages)
    return;
  }

  const workflowType = detectWorkflowType(userMessage);
  if (workflowType) {
    const messages = [...workflowResponses[workflowType]];
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const fileName = `audios/message_${i}.mp3`;
      const textInput = message.text;
      const audioSuccess = await generateAudioWithRetry(elevenLabsApiKey, voiceID, fileName, textInput);
      if (audioSuccess) {
        try {
          await lipSyncMessage(i);
          message.audio = await audioFileToBase64(fileName);
          message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
        } catch {
          message.audio = await audioFileToBase64(fileName);
          message.lipsync = null;
        }
      } else {
        message.audio = "";
        message.lipsync = null;
      }
    }
    sendWorkflowToNextJS(workflowType, userMessage).catch(() => {});
    res.send({ messages });
    return;
  }

  // 🚀 FALLBACK: RAG with Gemini instead of OpenAI
  console.log('❌ No workflow detected, using Gemini RAG for response');
  const rawAnswer = await rag(userMessage);
  let messages = JSON.parse(rawAnswer);
  if (!Array.isArray(messages)) messages = [messages];

  console.log(`🎤 Processing ${messages.length} Gemini messages for audio generation...`);
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const fileName = `audios/message_${i}.mp3`;
    const textInput = message.text;
    const audioSuccess = await generateAudioWithRetry(elevenLabsApiKey, voiceID, fileName, textInput);
    if (audioSuccess) {
      try {
        await lipSyncMessage(i);
        message.audio = await audioFileToBase64(fileName);
        message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
      } catch {
        message.audio = await audioFileToBase64(fileName);
        message.lipsync = null;
      }
    } else {
      message.audio = "";
      message.lipsync = null;
    }
  }

  res.send({ messages });
});

const readJsonTranscript = async (file) => {
  const data = await fs.readFile(file, "utf8");
  return JSON.parse(data);
};

const audioFileToBase64 = async (file) => {
  const data = await fs.readFile(file);
  return data.toString("base64");
};

app.post('/zoom', (req, res) => {
  shouldZoom = true;
  res.json({ success: true });
});

app.get('/should-zoom', (req, res) => {
  const current = shouldZoom;
  shouldZoom = false;
  res.json({ shouldZoom: current });
});

app.listen(port, () => {
  console.log(`🎭 UofTHacks Bot with AI Agent Workflows listening on port ${port}`);
});

console.log('🎭 AI Agent Workflow system ready!');