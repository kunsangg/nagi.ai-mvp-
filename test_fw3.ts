import { callAI } from './src/lib/ai/providers'; 

callAI('fireworks', { messages: [{ role: 'user', content: 'hello' }], jsonMode: false, model: 'accounts/fireworks/models/llama-v3p1-70b-instruct' })
  .then(console.log)
  .catch(console.error);
