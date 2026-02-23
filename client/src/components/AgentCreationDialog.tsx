import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../hooks'
import { closeCreationDialog, startPlacement, AVATAR_OPTIONS } from '../stores/AgentStore'

export default function AgentCreationDialog() {
  const isOpen = useAppSelector((state) => state.agent.creationDialogOpen)
  const dispatch = useAppDispatch()

  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0].key)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [errors, setErrors] = useState<{ name?: string }>({})

  if (!isOpen) return null

  const handleCreate = () => {
    const newErrors: { name?: string } = {}
    if (!name.trim()) newErrors.name = 'Name is required'
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const agentData = {
      id: `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      title: title.trim() || 'Agent',
      avatar: selectedAvatar,
      status: 'idle' as const,
      knowledgeBase: [],
      conversationHistory: [],
    }

    dispatch(startPlacement(agentData))
    // Reset form
    setName('')
    setTitle('')
    setSelectedAvatar(AVATAR_OPTIONS[0].key)
    setErrors({})
  }

  const handleClose = () => {
    dispatch(closeCreationDialog())
    setName('')
    setTitle('')
    setSelectedAvatar(AVATAR_OPTIONS[0].key)
    setErrors({})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />

      {/* Dialog */}
      <div className="relative glass-panel rounded-2xl w-[400px] max-w-[90vw] shadow-2xl border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold text-white">Add New Agent</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5">
          {/* Avatar Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Select Avatar</label>
            <div className="flex gap-3">
              {AVATAR_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setSelectedAvatar(opt.key)}
                  className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${
                    selectedAvatar === opt.key
                      ? 'border-primary scale-110 shadow-lg shadow-primary/20'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                  style={{ background: `${opt.color}20` }}
                >
                  <div
                    className="w-8 h-8 rounded-full"
                    style={{ background: opt.color }}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Agent Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
              }}
              placeholder="e.g. Alice"
              className={`w-full glass-input rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50 ${
                errors.name ? 'border-red-400/50' : ''
              }`}
            />
            {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
          </div>

          {/* Title Input - optional */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Agent Title / Role <span className="text-gray-500 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Developer, Designer (default: Agent)"
              className="w-full glass-input rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none transition-all focus:border-primary/50"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-white/5">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/80 rounded-lg transition-all cursor-pointer"
          >
            Create & Place
          </button>
        </div>
      </div>
    </div>
  )
}
