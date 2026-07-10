import { callAI } from './src/lib/ai/providers'; 

callAI('groq', { messages: [{ role: 'user', content: 'hello' }], jsonMode: false, model: 'llama-3.3-70b-versatile' })
  .then(console.log)
  .catch(console.error);
