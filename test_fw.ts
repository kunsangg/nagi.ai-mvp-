import { callAI } from './src/lib/ai/providers'; 

callAI('fireworks', { messages: [{ role: 'user', content: 'test' }], jsonMode: true })
  .then(console.log)
  .catch(console.error);
