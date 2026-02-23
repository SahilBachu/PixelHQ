import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface ChatMessage {
  role: 'user' | 'agent'
  content: string
  timestamp: number
}

export interface Agent {
  id: string
  name: string
  title: string
  avatar: string // character sprite key: 'adam' | 'ash' | 'lucy' | 'nancy' or color avatar
  position: { x: number; y: number }
  status: 'idle' | 'busy' | 'thinking'
  knowledgeBase: string[]
  conversationHistory: ChatMessage[]
}

export type AvatarOption = {
  key: string
  label: string
  color: string
}

export const AVATAR_OPTIONS: AvatarOption[] = [
  { key: 'adam', label: 'Adam', color: '#4ade80' },
  { key: 'ash', label: 'Ash', color: '#60a5fa' },
  { key: 'lucy', label: 'Lucy', color: '#c084fc' },
  { key: 'nancy', label: 'Nancy', color: '#facc15' },
]

export interface PlacementState {
  isActive: boolean
  agentData: Omit<Agent, 'position'> | null
}

interface AgentState {
  agents: Agent[]
  selectedAgentId: string | null
  rightSidebarOpen: boolean
  placementMode: PlacementState
  creationDialogOpen: boolean
}

const initialState: AgentState = {
  agents: [],
  selectedAgentId: null,
  rightSidebarOpen: false,
  placementMode: {
    isActive: false,
    agentData: null,
  },
  creationDialogOpen: false,
}

export const agentSlice = createSlice({
  name: 'agent',
  initialState,
  reducers: {
    addAgent: (state, action: PayloadAction<Agent>) => {
      state.agents.push(action.payload)
    },
    updateAgent: (state, action: PayloadAction<{ id: string; updates: Partial<Agent> }>) => {
      const idx = state.agents.findIndex((a) => a.id === action.payload.id)
      if (idx !== -1) {
        state.agents[idx] = { ...state.agents[idx], ...action.payload.updates }
      }
    },
    removeAgent: (state, action: PayloadAction<string>) => {
      state.agents = state.agents.filter((a) => a.id !== action.payload)
      if (state.selectedAgentId === action.payload) {
        state.selectedAgentId = null
        state.rightSidebarOpen = false
      }
    },
    selectAgent: (state, action: PayloadAction<string>) => {
      state.selectedAgentId = action.payload
      state.rightSidebarOpen = true
    },
    deselectAgent: (state) => {
      state.selectedAgentId = null
      state.rightSidebarOpen = false
    },
    toggleRightSidebar: (state) => {
      state.rightSidebarOpen = !state.rightSidebarOpen
      if (!state.rightSidebarOpen) {
        state.selectedAgentId = null
      }
    },
    startPlacement: (state, action: PayloadAction<Omit<Agent, 'position'>>) => {
      state.placementMode = {
        isActive: true,
        agentData: action.payload,
      }
      state.creationDialogOpen = false
    },
    cancelPlacement: (state) => {
      state.placementMode = {
        isActive: false,
        agentData: null,
      }
    },
    finishPlacement: (state, action: PayloadAction<{ x: number; y: number }>) => {
      if (state.placementMode.agentData) {
        const agent: Agent = {
          ...state.placementMode.agentData,
          position: action.payload,
        }
        state.agents.push(agent)
        state.selectedAgentId = agent.id
        state.rightSidebarOpen = true
      }
      state.placementMode = {
        isActive: false,
        agentData: null,
      }
    },
    openCreationDialog: (state) => {
      state.creationDialogOpen = true
    },
    closeCreationDialog: (state) => {
      state.creationDialogOpen = false
    },
    addMessage: (
      state,
      action: PayloadAction<{ agentId: string; role: 'user' | 'agent'; content: string }>
    ) => {
      const agent = state.agents.find((a) => a.id === action.payload.agentId)
      if (agent) {
        agent.conversationHistory.push({
          role: action.payload.role,
          content: action.payload.content,
          timestamp: Date.now(),
        })
      }
    },
  },
})

export const {
  addAgent,
  updateAgent,
  removeAgent,
  selectAgent,
  deselectAgent,
  toggleRightSidebar,
  startPlacement,
  cancelPlacement,
  finishPlacement,
  openCreationDialog,
  closeCreationDialog,
  addMessage,
} = agentSlice.actions

export default agentSlice.reducer
