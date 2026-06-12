import { trimMessagesToFit } from './src/lib/context-manager';

const messages = [
  { role: 'system', content: 'system prompt' },
  { role: 'user', content: 'hello' }
];

console.log('Test 1:');
console.log(trimMessagesToFit(messages, 4096));

const messages2 = [
  { role: 'system', content: 'system prompt' },
  { role: 'user', content: 'hello' },
  { role: 'assistant', content: 'hi' },
  { role: 'user', content: 'test' }
];

console.log('Test 2:');
console.log(trimMessagesToFit(messages2, 4096));
