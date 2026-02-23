import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../hooks'
import { deselectAgent, updateAgent, addMessage, AVATAR_OPTIONS, Agent } from '../stores/AgentStore'

const tabs = ['Overview', 'Chat', 'Tasks'] as const
type Tab = (typeof tabs)[number]

export default function RightSidebar() {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [width, setWidth] = useState(360)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const sidebarRef = useRef<HTMLDivElement>(null)

  const agents = useAppSelector((state) => state.agent.agents)
  const selectedAgentId = useAppSelector((state) => state.agent.selectedAgentId)
  const dispatch = useAppDispatch()

  const agent = agents.find((a) => a.id === selectedAgentId)

  // Dragging
  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, input')) return
      setIsDragging(true)
      const rect = sidebarRef.current?.getBoundingClientRect()
      if (rect) {
        const currentX = position?.x ?? rect.left
        const currentY = position?.y ?? rect.top
        dragOffset.current = { x: e.clientX - currentX, y: e.clientY - currentY }
      }
    },
    [position]
  )

  useEffect(() => {
    if (!isDragging) return
    const handleMove = (e: MouseEvent) => {
      const newX = Math.max(0, Math.min(window.innerWidth - width, e.clientX - dragOffset.current.x))
      const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.current.y))
      setPosition({ x: newX, y: newY })
    }
    const handleUp = () => setIsDragging(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, width])

  // Resizing
  useEffect(() => {
    if (!isResizing) return
    const handleMove = (e: MouseEvent) => {
      const rect = sidebarRef.current?.getBoundingClientRect()
      if (!rect) return
      const newWidth = Math.min(600, Math.max(300, rect.right - e.clientX))
      setWidth(newWidth)
      if (position) {
        setPosition((prev) => prev && { ...prev, x: rect.right - newWidth })
      }
    }
    const handleUp = () => setIsResizing(false)
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isResizing, position])

  // Reset position when agent changes
  useEffect(() => {
    setPosition(null)
    setActiveTab('Overview')
  }, [selectedAgentId])

  if (!agent) return null

  const handleAgentUpdate = (updates: Partial<Agent>) => {
    dispatch(updateAgent({ id: agent.id, updates }))
  }

  const sidebarStyle: React.CSSProperties = position
    ? {
        position: 'fixed',
        left: position.x,
        top: position.y,
        width,
        height: '80vh',
        zIndex: 40,
      }
    : {
        width,
        height: '100%',
      }

  return (
    <div
      ref={sidebarRef}
      style={sidebarStyle}
      className={`glass-panel flex flex-col border-l border-white/5 rounded-l-xl ${
        position ? 'rounded-xl shadow-2xl' : ''
      } ${isDragging ? 'select-none' : ''}`}
    >
      {/* Resize handle (left edge) */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 transition-colors z-10"
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing(true)
        }}
      />

      {/* Header - draggable */}
      <div
        className="p-4 border-b border-white/5 flex items-center justify-between cursor-grab active:cursor-grabbing"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-500 text-sm">drag_indicator</span>
          <h2 className="text-base font-semibold text-white">{agent.name}</h2>
        </div>
        <button
          onClick={() => dispatch(deselectAgent())}
          className="text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex p-2 mx-3 mt-3 rounded-lg bg-white/5">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-all cursor-pointer ${
              activeTab === tab ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {activeTab === 'Overview' && (
          <OverviewTab agent={agent} onUpdate={handleAgentUpdate} />
        )}
        {activeTab === 'Chat' && <ChatTab agent={agent} />}
        {activeTab === 'Tasks' && <TasksTab />}
      </div>
    </div>
  )
}

/* ─── Overview Tab ───────────────────────────────────────── */

const statusConfig: Record<Agent['status'], { color: string; label: string; dot: string }> = {
  idle: { color: 'text-green-400', label: 'Idle', dot: 'bg-green-400' },
  thinking: { color: 'text-yellow-400', label: 'Thinking', dot: 'bg-yellow-400' },
  busy: { color: 'text-red-400', label: 'Busy', dot: 'bg-red-400' },
}

function OverviewTab({
  agent,
  onUpdate,
}: {
  agent: Agent
  onUpdate: (updates: Partial<Agent>) => void
}) {
  const [editingName, setEditingName] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [nameValue, setNameValue] = useState(agent.name)
  const [titleValue, setTitleValue] = useState(agent.title)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [editingKB, setEditingKB] = useState(false)
  const [newTopic, setNewTopic] = useState('')

  // Sync when agent changes
  useEffect(() => {
    setNameValue(agent.name)
    setTitleValue(agent.title)
  }, [agent.id, agent.name, agent.title])

  const status = statusConfig[agent.status]
  const avatarColor = AVATAR_OPTIONS.find((o) => o.key === agent.avatar)?.color ?? '#6b7280'

  const saveName = () => {
    if (nameValue.trim() && nameValue.trim() !== agent.name) {
      onUpdate({ name: nameValue.trim() })
    } else {
      setNameValue(agent.name)
    }
    setEditingName(false)
  }

  const saveTitle = () => {
    if (titleValue.trim() && titleValue.trim() !== agent.title) {
      onUpdate({ title: titleValue.trim() })
    } else {
      setTitleValue(agent.title)
    }
    setEditingTitle(false)
  }

  const addKnowledgeTopic = () => {
    const topic = newTopic.trim()
    if (topic && !agent.knowledgeBase.includes(topic)) {
      onUpdate({ knowledgeBase: [...agent.knowledgeBase, topic] })
      setNewTopic('')
    }
  }

  const removeKnowledgeTopic = (topic: string) => {
    onUpdate({ knowledgeBase: agent.knowledgeBase.filter((t) => t !== topic) })
  }

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => setShowAvatarPicker(!showAvatarPicker)}
          className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold cursor-pointer transition-all hover:scale-105"
          style={{ background: `${avatarColor}25`, color: avatarColor }}
        >
          {agent.name.charAt(0).toUpperCase()}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-xs text-gray-400">edit</span>
          </div>
        </button>

        {showAvatarPicker && (
          <div className="flex gap-2 mt-3 p-2 glass-input rounded-lg">
            {AVATAR_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => {
                  onUpdate({ avatar: opt.key })
                  setShowAvatarPicker(false)
                }}
                className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all border ${
                  agent.avatar === opt.key
                    ? 'border-primary scale-110'
                    : 'border-transparent hover:border-white/20'
                }`}
                style={{ background: `${opt.color}20` }}
              >
                <div className="w-5 h-5 rounded-full" style={{ background: opt.color }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Name */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Name</label>
        {editingName ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => e.key === 'Enter' && saveName()}
            className="w-full glass-input rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="w-full text-left px-3 py-2 text-sm text-white glass-input rounded-lg hover:border-white/20 transition-all cursor-pointer"
          >
            {agent.name}
          </button>
        )}
      </div>

      {/* Title */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Title / Role</label>
        {editingTitle ? (
          <input
            autoFocus
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onBlur={saveTitle}
            onKeyDown={(e) => e.key === 'Enter' && saveTitle()}
            className="w-full glass-input rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-primary/50"
          />
        ) : (
          <button
            onClick={() => setEditingTitle(true)}
            className="w-full text-left px-3 py-2 text-sm text-white glass-input rounded-lg hover:border-white/20 transition-all cursor-pointer"
          >
            {agent.title}
          </button>
        )}
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs text-gray-500 mb-1">Status</label>
        <div className="flex items-center gap-2 px-3 py-2 glass-input rounded-lg">
          <div className={`w-2.5 h-2.5 rounded-full ${status.dot}`} />
          <span className={`text-sm ${status.color}`}>{status.label}</span>
        </div>
      </div>

      {/* Knowledge Base */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">Knowledge Base</label>
          <button
            onClick={() => setEditingKB(!editingKB)}
            className="text-xs text-primary hover:text-primary/80 cursor-pointer"
          >
            {editingKB ? 'Done' : 'Edit'}
          </button>
        </div>

        <div className="glass-input rounded-lg p-3 max-h-[200px] overflow-y-auto">
          {agent.knowledgeBase.length === 0 && !editingKB && (
            <p className="text-xs text-gray-500 text-center py-2">
              No topics yet. Click Edit to add.
            </p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {agent.knowledgeBase.map((topic) => (
              <span
                key={topic}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 text-xs text-gray-300"
              >
                {topic}
                {editingKB && (
                  <button
                    onClick={() => removeKnowledgeTopic(topic)}
                    className="text-gray-500 hover:text-red-400 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                )}
              </span>
            ))}
          </div>

          {editingKB && (
            <div className="flex gap-2 mt-2">
              <input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKnowledgeTopic()}
                placeholder="Add topic..."
                className="flex-1 bg-transparent text-xs text-white placeholder-gray-500 outline-none border-b border-white/10 py-1"
              />
              <button
                onClick={addKnowledgeTopic}
                className="text-primary text-xs hover:text-primary/80 cursor-pointer"
              >
                Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ─── Chat Tab ───────────────────────────────────────────── */

function ChatTab({ agent }: { agent: Agent }) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const dispatch = useAppDispatch()

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [agent.conversationHistory.length])

  const handleSend = () => {
    const text = message.trim()
    if (!text) return
    dispatch(addMessage({ agentId: agent.id, role: 'user', content: text }))
    setMessage('')

    // Simulate agent response after a short delay
    setTimeout(() => {
      dispatch(
        addMessage({
          agentId: agent.id,
          role: 'agent',
          content: `Thanks for your message! I'm ${agent.name}, your ${agent.title}. I received: "${text}"`,
        })
      )
    }, 800)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="text-xs text-gray-500 mb-3">Chat with {agent.name}</div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 min-h-0 mb-3">
        {agent.conversationHistory.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <span className="material-symbols-outlined text-3xl mb-2 block">chat</span>
            <p className="text-sm">Start a conversation</p>
            <p className="text-xs mt-1">Send a message to {agent.name}</p>
          </div>
        )}

        {agent.conversationHistory.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-sm'
                  : 'glass-input text-gray-300 rounded-bl-sm'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2 mt-auto">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="flex-1 glass-input rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-primary/50"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="px-3 py-2.5 bg-primary hover:bg-primary/80 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-white text-lg">send</span>
        </button>
      </div>
    </div>
  )
}

/* ─── Tasks Tab ──────────────────────────────────────────── */

function TasksTab() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center text-gray-500">
        <span className="material-symbols-outlined text-4xl mb-2 block">task_alt</span>
        <p className="text-sm font-medium">No tasks yet</p>
        <p className="text-xs mt-1 max-w-[200px]">
          Tasks will appear here when you assign work to this agent.
        </p>
        <button className="mt-4 px-4 py-2 text-xs text-gray-400 glass-input rounded-lg hover:border-white/20 transition-all cursor-pointer">
          Create Task
        </button>
      </div>
    </div>
  )
}
