import { useEffect, useState } from 'react'
import JoystickItem from './Joystick'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

import { useAppSelector } from '../hooks'
import { JoystickMovement } from './Joystick'

export const minimumScreenWidthSize = 650

function useIsSmallScreen(smallScreenSize: number) {
  const [width, setWidth] = useState(window.innerWidth)

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return width <= smallScreenSize
}

export default function MobileVirtualJoystick() {
  const showJoystick = useAppSelector((state) => state.user.showJoystick)
  const game = phaserGame.scene.keys.game as Game

  const handleMovement = (movement: JoystickMovement) => {
    game.myPlayer?.handleJoystickMovement(movement)
  }

  if (!showJoystick) return null

  return (
    <div className="fixed bottom-[100px] right-8 pointer-events-auto">
      <JoystickItem onDirectionChange={handleMovement} />
    </div>
  )
}
