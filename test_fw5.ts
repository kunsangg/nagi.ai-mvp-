import { callAI } from './src/lib/ai/providers'; 

callAI('fireworks', { messages: [{ role: 'user', content: 'test' }], jsonMode: true, model: 'accounts/fireworks/models/llama-v3p1-8b-instruct' })
  .then(console.log)
  .catch(console.error);
