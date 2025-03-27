import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ServerConfig {
  id: string
  name: string
  type: 'http' | 'command' | 'package'
  config: {
    baseUrl?: string
    command?: string
    packageManager?: 'npx' | 'bun' | 'uvx'
    packageName?: string
  }
}

interface ServerState {
  configs: ServerConfig[]
  activeConfigId: string | null
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
}

const initialState: ServerState = {
  configs: [],
  activeConfigId: null,
  connectionStatus: 'disconnected',
}

const serverSlice = createSlice({
  name: 'server',
  initialState,
  reducers: {
    initServerConfigs: (state, action: PayloadAction<ServerConfig[]>) => {
      state.configs = action.payload
    },
    addServerConfig: (state, action: PayloadAction<ServerConfig>) => {
      state.configs.push(action.payload)
    },
    removeServerConfig: (state, action: PayloadAction<string>) => {
      state.configs = state.configs.filter(config => config.id !== action.payload)
      if (state.activeConfigId === action.payload) {
        state.activeConfigId = null
      }
    },
    setActiveConfig: (state, action: PayloadAction<string>) => {
      state.activeConfigId = action.payload
    },
    setConnectionStatus: (state, action: PayloadAction<'connected' | 'disconnected' | 'connecting'>) => {
      state.connectionStatus = action.payload
    },
  },
})

export const {
  initServerConfigs,
  addServerConfig,
  removeServerConfig,
  setActiveConfig,
  setConnectionStatus,
} = serverSlice.actions

export default serverSlice.reducer 