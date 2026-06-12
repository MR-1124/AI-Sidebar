// ─────────────────────────────────────────────────────────────
// Chrome API Mocks — For testing outside of Chrome Extension context
// ─────────────────────────────────────────────────────────────

// In-memory storage mock
const mockStorage: Record<string, any> = {};

const storageMethods = (area: Record<string, any>) => ({
  get: (keys: string | string[] | null, callback?: (result: Record<string, any>) => void): Promise<Record<string, any>> => {
    const result: Record<string, any> = {};
    if (keys === null) {
      Object.assign(result, area);
    } else {
      const keyArray = typeof keys === 'string' ? [keys] : keys;
      for (const key of keyArray) {
        if (key in area) result[key] = area[key];
      }
    }
    callback?.(result);
    return Promise.resolve(result);
  },
  set: (items: Record<string, any>, callback?: () => void): Promise<void> => {
    Object.assign(area, items);
    callback?.();
    return Promise.resolve();
  },
  remove: (keys: string | string[], callback?: () => void): Promise<void> => {
    const keyArray = typeof keys === 'string' ? [keys] : keys;
    for (const key of keyArray) {
      delete area[key];
    }
    callback?.();
    return Promise.resolve();
  },
  clear: (callback?: () => void): Promise<void> => {
    for (const key of Object.keys(area)) delete area[key];
    callback?.();
    return Promise.resolve();
  },
});

const listeners: Map<string, Function[]> = new Map();

function createEventTarget() {
  return {
    addListener: (fn: Function) => {
      const key = 'default';
      if (!listeners.has(key)) listeners.set(key, []);
      listeners.get(key)!.push(fn);
    },
    removeListener: (fn: Function) => {
      const key = 'default';
      const arr = listeners.get(key) || [];
      const idx = arr.indexOf(fn);
      if (idx >= 0) arr.splice(idx, 1);
    },
    hasListener: (fn: Function) => {
      const arr = listeners.get('default') || [];
      return arr.includes(fn);
    },
  };
}

export const chromeMock = {
  runtime: {
    id: 'mock-extension-id-for-testing',
    sendMessage: (_message: any, _callback?: Function) => {},
    onMessage: createEventTarget(),
    connect: (_info?: any) => ({
      name: 'mock-port',
      postMessage: (_msg: any) => {},
      onMessage: createEventTarget(),
      onDisconnect: createEventTarget(),
      disconnect: () => {},
    }),
    getManifest: () => ({ version: '0.1.0', name: 'Test' }),
  },
  storage: {
    local: storageMethods(mockStorage),
    sync: storageMethods({}),
    onChanged: createEventTarget(),
  },
  tabs: {
    query: async (_queryInfo: any) => [{ id: 1, url: 'https://example.com', title: 'Example', active: true }],
    update: async (_tabId: number, _props: any) => ({}),
    create: async (props: any) => ({ id: 2, ...props }),
    remove: async (_tabId: number) => {},
    onUpdated: createEventTarget(),
  },
  scripting: {
    executeScript: async (_injection: any) => [{ result: {} }],
  },
  sidePanel: {
    open: async () => {},
    setOptions: async (_options: any) => {},
  },
  contextMenus: {
    create: (_props: any) => {},
    onClicked: createEventTarget(),
  },
  action: {
    onClicked: createEventTarget(),
  },
};

// Install globally
(globalThis as any).chrome = chromeMock;

export function resetMockStorage(): void {
  for (const key of Object.keys(mockStorage)) delete mockStorage[key];
}
