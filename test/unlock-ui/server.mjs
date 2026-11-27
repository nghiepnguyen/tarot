import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
const vitePath = require.resolve('vite', { paths: [path.dirname(require.resolve('vitest'))] });
const { createServer } = await import(vitePath);
const root = process.cwd();
const server = await createServer({
  configFile: false, root,
  server: { host: '127.0.0.1', port: 4178, strictPort: true },
  resolve: { alias: [
    { find: '@/components/tarot/ArcDeck', replacement: path.join(root, 'test/unlock-ui/deck.tsx') },
    { find: '@/app/actions/readings', replacement: path.join(root, 'test/unlock-ui/readings.ts') },
    { find: '@/components/tarot/ReadingView', replacement: path.join(root, 'test/unlock-ui/reading-view.tsx') },
    { find: '@/components/ui/Toast', replacement: path.join(root, 'test/unlock-ui/toast.ts') },
    { find: '@/app/actions/ai', replacement: path.join(root, 'test/unlock-ui/actions.ts') },
    { find: '@/components/tarot/InterpretationReviewBox', replacement: path.join(root, 'test/unlock-ui/stubs.tsx') },
    { find: 'next/link', replacement: path.join(root, 'test/unlock-ui/link.tsx') },
    { find: 'next/image', replacement: path.join(root, 'test/unlock-ui/image.tsx') },
    { find: '@', replacement: root },
  ] },
});
await server.listen();
