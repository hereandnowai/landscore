import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY is missing in .env');
    return;
  }

  console.log('✅ Found GEMINI_API_KEY');
  const genAI = new GoogleGenerativeAI(apiKey);

  const modelName = 'gemini-2.5-flash-lite';
  console.log(`\nTesting model: ${modelName} with tools...`);
  
  const tools = [{
    functionDeclarations: [{
      name: 'get_weather',
      description: 'Get the weather',
      parameters: {
        type: 'OBJECT',
        properties: {
          location: { type: 'STRING' }
        }
      }
    }]
  }];

  try {
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      tools: tools as any
    });
    
    const chat = model.startChat();
    const result = await chat.sendMessage('What is the weather in Austin?');
    const response = await result.response;
    console.log(`✅ Success! Response: ${JSON.stringify(response.functionCalls())}`);
  } catch (error: any) {
    console.error(`❌ Failed: ${error.message}`);
    console.error(error);
  }
}

testGemini();
