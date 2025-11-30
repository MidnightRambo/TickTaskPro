import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Tasks
  tasks: {
    getAll: () => ipcRenderer.invoke('db:tasks:getAll'),
    getById: (id: string) => ipcRenderer.invoke('db:tasks:getById', id),
    create: (task: unknown) => ipcRenderer.invoke('db:tasks:create', task),
    update: (task: unknown) => ipcRenderer.invoke('db:tasks:update', task),
    delete: (id: string) => ipcRenderer.invoke('db:tasks:delete', id),
  },
  
  // Lists
  lists: {
    getAll: () => ipcRenderer.invoke('db:lists:getAll'),
    create: (list: unknown) => ipcRenderer.invoke('db:lists:create', list),
    update: (list: unknown) => ipcRenderer.invoke('db:lists:update', list),
    delete: (id: string) => ipcRenderer.invoke('db:lists:delete', id),
  },
  
  // Tags
  tags: {
    getAll: () => ipcRenderer.invoke('db:tags:getAll'),
    create: (tag: unknown) => ipcRenderer.invoke('db:tags:create', tag),
    update: (tag: unknown) => ipcRenderer.invoke('db:tags:update', tag),
    delete: (id: string) => ipcRenderer.invoke('db:tags:delete', id),
  },
  
  // Settings
  settings: {
    get: () => ipcRenderer.invoke('db:settings:get'),
    update: (settings: unknown) => ipcRenderer.invoke('db:settings:update', settings),
  },
  
  // Eisenhower Rules
  rules: {
    getAll: () => ipcRenderer.invoke('db:rules:getAll'),
    update: (rules: unknown) => ipcRenderer.invoke('db:rules:update', rules),
  },
  
  // Notifications
  notification: {
    show: (options: { title: string; body: string; taskId: string }) =>
      ipcRenderer.invoke('notification:show', options),
  },
  
  // Event listeners
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const validChannels = ['trigger-quick-add', 'notification-clicked']
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (_, ...args) => callback(...args))
    }
  },
  
  removeListener: (channel: string, callback: (...args: unknown[]) => void) => {
    ipcRenderer.removeListener(channel, callback)
  },
})


