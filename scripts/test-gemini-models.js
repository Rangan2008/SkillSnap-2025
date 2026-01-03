const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🔑 API Key (first 10 chars):', GEMINI_API_KEY.substring(0, 10) + '...');
console.log('📦 Testing Gemini API...\n');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Test models to try
const modelsToTest = [
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash-exp'
];

async function testModel(modelName) {
  try {
    console.log(`\n🧪 Testing: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });
    
    const result = await model.generateContent('Say "Hello, I am working!" in JSON format: {"status": "working", "message": "..."}');
    const response = await result.response;
    const text = response.text();
    
    console.log(`✅ ${modelName} - WORKS!`);
    console.log(`📝 Response: ${text.substring(0, 100)}...`);
    return { model: modelName, status: 'success', response: text };
  } catch (error) {
    console.log(`❌ ${modelName} - FAILED`);
    console.log(`   Error: ${error.message}`);
    return { model: modelName, status: 'failed', error: error.message };
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════');
  console.log('Testing all available Gemini models...');
  console.log('═══════════════════════════════════════════════');
  
  const results = [];
  
  for (const modelName of modelsToTest) {
    const result = await testModel(modelName);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s between tests
  }
  
  console.log('\n\n═══════════════════════════════════════════════');
  console.log('📊 RESULTS SUMMARY:');
  console.log('═══════════════════════════════════════════════');
  
  const working = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status === 'failed');
  
  if (working.length > 0) {
    console.log('\n✅ WORKING MODELS:');
    working.forEach(r => console.log(`   - ${r.model}`));
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED MODELS:');
    failed.forEach(r => console.log(`   - ${r.model}: ${r.error.substring(0, 80)}...`));
  }
  
  if (working.length === 0) {
    console.log('\n⚠️  NO MODELS WORKING!');
    console.log('   This suggests your API key may be invalid or doesn\'t have access to Gemini models.');
    console.log('   Please verify your API key at: https://aistudio.google.com/app/apikey');
  } else {
    console.log(`\n✨ RECOMMENDED MODEL: ${working[0].model}`);
  }
}

runTests().catch(console.error);
