import React from 'react'
import { useAppSelector, useAppDispatch } from '../hooks'
import { selectAgent, openCreationDialog, AVATAR_OPTIONS, Agent } from '../stores/AgentStore'

import AdamLogin from '../images/login/Adam_login.png'
import AshLogin from '../images/login/Ash_login.png'
import LucyLogin from '../images/login/Lucy_login.png'
import NancyLogin from '../images/login/Nancy_login.png'

const AVATAR_IMAGES: Record<string, string> = {
  adam: AdamLogin,
  ash: AshLogin,
  lucy: LucyLogin,
  nancy: NancyLogin,
}

const statusConfig: Record<Agent['status'], { color: string; label: string }> = {
  idle: { color: 'bg-green-400', label: 'Idle' },
  thinking: { color: 'bg-yellow-400', label: 'Thinking' },
  busy: { color: 'bg-red-400', label: 'Busy' },
}

function getAvatarColor(avatarKey: string): string {
  return AVATAR_OPTIONS.find((o) => o.key === avatarKey)?.color ?? '#6b7280'
}

export default function LeftSidebar() {
  const agents = useAppSelector((state) => state.agent.agents)
  const selectedAgentId = useAppSelector((state) => state.agent.selectedAgentId)
  const dispatch = useAppDispatch()

  return (
    <div className="w-[280px] h-full glass-panel flex flex-col border-r border-white/5">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <h1 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">hub</span>
          PixelHQ Agents
        </h1>
      </div>

      {/* Add Agent Button */}
      <div className="p-3">
        <button
          onClick={() => dispatch(openCreationDialog())}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white glass-input hover:bg-primary/10 hover:border-primary/30 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Add New Agent
        </button>
      </div>

      {/* Agent list */}
      <div className="flex-1 overflow-y-auto px-2">
        {agents.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <span className="material-symbols-outlined text-3xl mb-2 block">smart_toy</span>
            <p className="text-sm">No agents yet</p>
            <p className="text-xs mt-1">Click + to create your first agent</p>
          </div>
        )}
        {agents.map((agent) => {
          const status = statusConfig[agent.status]
          const avatarColor = getAvatarColor(agent.avatar)
          return (
            <button
              key={agent.id}
              onClick={() => dispatch(selectAgent(agent.id))}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 text-left transition-all cursor-pointer ${
                selectedAgentId === agent.id
                  ? 'bg-primary/15 text-white'
                  : 'text-gray-300 hover:bg-white/5 hover:scale-[1.01]'
              }`}
            >
              {/* Avatar - sprite character image */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-12 rounded-xl flex items-center justify-center overflow-hidden bg-white/5">
                  {AVATAR_IMAGES[agent.avatar] ? (
                    <img
                      src={AVATAR_IMAGES[agent.avatar]}
                      alt={agent.name}
                      className="w-8 h-10 object-contain object-bottom"
                    />
                  ) : (
                    <span
                      className="text-white font-bold text-sm"
                      style={{ color: avatarColor }}
                    >
                      {agent.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div
                  className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#161b2e] ${status.color}`}
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{agent.name}</div>
                <div className="text-xs text-gray-500 truncate">{agent.title}</div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Bottom - Settings */}
      <div className="p-3 border-t border-white/5">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all cursor-pointer">
          <span className="material-symbols-outlined text-lg">settings</span>
          Settings
        </button>
      </div>
    </div>
  )
}
