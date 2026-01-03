const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found');
  process.exit(1);
}

console.log('🔑 API Key:', GEMINI_API_KEY.substring(0, 20) + '...');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    console.log('\n📋 Attempting to list available models...\n');
    
    // Try to fetch list of models using REST API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`
    );
    
    if (!response.ok) {
      console.error('❌ Failed to list models:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const data = await response.json();
    
    if (!data.models || data.models.length === 0) {
      console.log('⚠️  No models found for this API key');
      return;
    }
    
    console.log(`✅ Found ${data.models.length} available models:\n`);
    
    // Filter models that support generateContent
    const contentModels = data.models.filter(m => 
      m.supportedGenerationMethods?.includes('generateContent')
    );
    
    console.log('🤖 MODELS SUPPORTING generateContent:');
    console.log('════════════════════════════════════════\n');
    
    contentModels.forEach(model => {
      console.log(`✓ ${model.name.replace('models/', '')}`);
      console.log(`  Display Name: ${model.displayName}`);
      console.log(`  Description: ${model.description}`);
      console.log(`  Methods: ${model.supportedGenerationMethods.join(', ')}`);
      console.log('');
    });
    
    if (contentModels.length === 0) {
      console.log('⚠️  No models support generateContent method');
    } else {
      console.log('\n✨ RECOMMENDED MODEL TO USE:');
      console.log(`   ${contentModels[0].name.replace('models/', '')}`);
    }
    
  } catch (error) {
    console.error('❌ Error listing models:', error.message);
  }
}

listModels();
