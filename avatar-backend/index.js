import { exec } from "child_process";
import cors from "cors";
import dotenv from "dotenv";
import voice from "elevenlabs-node";
import express from "express";
import { promises as fs } from "fs";
import OpenAI from "openai";
// 🚀 NEW: Import workflow functions
import { 
  detectWorkflowType, 
  createWorkflowFromTemplate, 
  workflowResponses 
} from "./workflows.js";

dotenv.config();

let shouldZoom = false;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "-",
});

const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;
const voiceID = "9BWtsMINqrJLrRacOk9x";

const app = express();
app.use(express.json());
app.use(cors());
const port = 3000;

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
        const delay = attempt * 1000; // 1s, 2s, 3s delays
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
    
    if (!newWorkflow) {
      console.error('❌ Failed to create workflow from template');
      return;
    }
    
    const response = await fetch('http://localhost:3001/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        workflow: newWorkflow,
        workflowType: workflowType,
        originalMessage: userMessage 
      })
    });
    
    if (response.ok) {
      console.log(`✅ ${workflowType} workflow sent to Next.js successfully`);
    } else {
      console.error('❌ Failed to send workflow:', response.status);
    }
  } catch (error) {
    console.error('❌ Error sending workflow:', error);
  }
}

app.post("/chat", async (req, res) => {
  const userMessage = req.body.message;
  
  if (!userMessage) {
    res.send({
      messages: [
        {
          text: "Hey! How was your day.",
          audio: await audioFileToBase64("audios/intro_0.wav"),
          lipsync: await readJsonTranscript("audios/intro_0.json"),
          facialExpression: "smile",
          animation: "Talking_1",
        },
        {
          text: "What's up! I'm the UofTHacks Bot, ready to chat with you.",
          audio: await audioFileToBase64("audios/intro_1.wav"),
          lipsync: await readJsonTranscript("audios/intro_1.json"),
          facialExpression: "sad",
          animation: "Crying",
        },
      ],
    });
    return;
  }
  
  if (!elevenLabsApiKey || openai.apiKey === "-") {
    res.send({
      messages: [
        {
          text: "Please my dear, don't forget to add your API keys!",
          audio: await audioFileToBase64("audios/api_0.wav"),
          lipsync: await readJsonTranscript("audios/api_0.json"),
          facialExpression: "angry",
          animation: "Angry",
        },
        {
          text: "You don't want to ruin this with a crazy ChatGPT and ElevenLabs bill, right?",
          audio: await audioFileToBase64("audios/api_1.wav"),
          lipsync: await readJsonTranscript("audios/api_1.json"),
          facialExpression: "smile",
          animation: "Laughing",
        },
      ],
    });
    return;
  }

  // 🚀 NEW: Check for specific workflow triggers first
  const workflowType = detectWorkflowType(userMessage);
  
  console.log(`🔍 Checking message: "${userMessage}"`);
  console.log(`🎯 Detected workflow type: ${workflowType}`);
  
  if (workflowType) {
    console.log(`✅ WORKFLOW DETECTED: ${workflowType} from: "${userMessage}"`);
    console.log('📤 Sending workflow to Next.js and returning predefined response');
    
    // Send workflow to Next.js in background
    sendWorkflowToNextJS(workflowType, userMessage).catch(err => 
      console.error('Workflow send failed:', err)
    );
    
    // Return predefined workflow response
    const messages = [...workflowResponses[workflowType]]; // Create a copy
    
    console.log(`🎤 Generating audio for ${messages.length} predefined messages...`);
    
    // Generate audio and lipsync for predefined messages
    for (let i = 0; i < messages.length; i++) {
      const message = messages[i];
      const fileName = `audios/message_${i}.mp3`;
      const textInput = message.text;
      
      console.log(`🔊 Processing message ${i + 1}/${messages.length}`);
      
      // Try to generate audio with retries
      const audioSuccess = await generateAudioWithRetry(elevenLabsApiKey, voiceID, fileName, textInput);
      
      if (audioSuccess) {
        try {
          await lipSyncMessage(i);
          message.audio = await audioFileToBase64(fileName);
          message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
          console.log(`✅ Complete audio processing for message ${i + 1}`);
        } catch (lipSyncError) {
          console.error(`❌ Lip sync failed for message ${i}:`, lipSyncError.message);
          message.audio = await audioFileToBase64(fileName);
          message.lipsync = null;
        }
      } else {
        console.log(`⚠️ Sending message ${i + 1} without audio due to API issues`);
        message.audio = "";
        message.lipsync = null;
      }
    }
    
    console.log('✅ Workflow response ready, sending to client');
    res.send({ messages });
    return;
  }

  // 🚀 FALLBACK: Original OpenAI logic for non-workflow messages
  console.log('❌ No workflow detected, using OpenAI for response');
  
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1000,
    temperature: 0.6,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: `
        You are a teacher.
        You will always reply with a JSON array of messages. With a maximum of 3 messages.
        Each message has a text, facialExpression, and animation property.
        The different facial expressions are: smile, sad, angry, surprised, funnyFace, and default.
        The different animations are: Talking_0, Talking_1, Talking_2, Crying, Laughing, Rumba, Idle, Terrified, and Angry. 
        `,
      },
      {
        role: "user",
        content: userMessage || "Hello",
      },
    ],
  });
  
  let messages = JSON.parse(completion.choices[0].message.content);
  if (messages.messages) {
    messages = messages.messages; // ChatGPT is not 100% reliable, sometimes it directly returns an array and sometimes a JSON object with a messages property
  }

  // Generate audio and lipsync for OpenAI messages
  for (let i = 0; i < messages.length; i++) {
    const message = messages[i];
    const fileName = `audios/message_${i}.mp3`;
    const textInput = message.text;
    
    await voice.textToSpeech(elevenLabsApiKey, voiceID, fileName, textInput);
    await lipSyncMessage(i);
    message.audio = await audioFileToBase64(fileName);
    message.lipsync = await readJsonTranscript(`audios/message_${i}.json`);
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
  console.log('Got should-zoom request');
  const current = shouldZoom;
  shouldZoom = false;
  res.json({ shouldZoom: current });
});

app.listen(port, () => {
  console.log(`🎭 UofTHacks Bot with AI Agent Workflows listening on port ${port}`);
  console.log(`📤 Will send workflows to Next.js at: http://localhost:3001`);
  console.log(`🤖 Trigger phrases loaded for: onboarding, followup, meeting workflows`);
});

console.log('🎭 AI Agent Workflow system ready!');