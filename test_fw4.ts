import { callAI } from './src/lib/ai/providers'; 

callAI('fireworks', { messages: [{ role: 'user', content: 'test' }], jsonMode: true, model: 'accounts/fireworks/models/deepseek-v4-pro' })
  .then(console.log)
  .catch(console.error);
