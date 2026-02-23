import React, { useEffect } from 'react'

import { useAppSelector } from './hooks'
import LoginDialog from './components/LoginDialog'
import LeftSidebar from './components/LeftSidebar'
import RightSidebar from './components/RightSidebar'
import AgentCreationDialog from './components/AgentCreationDialog'
import MobileVirtualJoystick from './components/MobileVirtualJoystick'

import phaserGame from './PhaserGame'
import Bootstrap from './scenes/Bootstrap'
import Game from './scenes/Game'

function PlacementOverlay() {
  const isPlacing = useAppSelector((state) => state.agent.placementMode.isActive)
  const agentData = useAppSelector((state) => state.agent.placementMode.agentData)

  if (!isPlacing || !agentData) return null

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <div className="glass-panel rounded-xl px-5 py-3 border border-white/10 shadow-lg">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary animate-pulse">place</span>
          <div>
            <p className="text-sm font-medium text-white">
              Click on the map to place {agentData.name}
            </p>
            <p className="text-xs text-gray-400">Press ESC to cancel</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  const loggedIn = useAppSelector((state) => state.user.loggedIn)
  const rightSidebarOpen = useAppSelector((state) => state.agent.rightSidebarOpen)

  useEffect(() => {
    // Auto-launch the game scene once Bootstrap finishes preloading
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap
    bootstrap.launchGame()
  }, [])

  // Ensure keyboard is registered when user is logged in (covers refresh, restore, etc.)
  useEffect(() => {
    if (!loggedIn) return
    const game = phaserGame.scene.keys.game as Game
    if (game?.registerKeys) {
      game.registerKeys()
    } else {
      // Retry once after a short delay in case Game scene wasn't ready yet
      const t = setTimeout(() => {
        const g = phaserGame.scene.keys.game as Game
        if (g?.registerKeys) g.registerKeys()
      }, 500)
      return () => clearTimeout(t)
    }
  }, [loggedIn])

  if (!loggedIn) {
    return <LoginDialog />
  }

  return (
    <div className="absolute inset-0 flex pointer-events-none">
      {/* Left Sidebar */}
      <div className="pointer-events-auto">
        <LeftSidebar />
      </div>

      {/* Center - Phaser game canvas shows through; pointer-events-none so clicks reach canvas */}
      <div className="flex-1 pointer-events-none" />

      {/* Right Sidebar */}
      {rightSidebarOpen && (
        <div className="pointer-events-auto">
          <RightSidebar />
        </div>
      )}

      {/* Mobile joystick */}
      <MobileVirtualJoystick />

      {/* Agent Creation Dialog */}
      <AgentCreationDialog />

      {/* Placement Mode Overlay */}
      <PlacementOverlay />
    </div>
  )
}

export default App
