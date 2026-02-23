import React, { useState } from 'react'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'

import Adam from '../images/login/Adam_login.png'
import Ash from '../images/login/Ash_login.png'
import Lucy from '../images/login/Lucy_login.png'
import Nancy from '../images/login/Nancy_login.png'
import { useAppDispatch } from '../hooks'
import { setLoggedIn } from '../stores/UserStore'

import phaserGame from '../PhaserGame'
import Game from '../scenes/Game'

const avatars = [
  { name: 'adam', img: Adam },
  { name: 'ash', img: Ash },
  { name: 'lucy', img: Lucy },
  { name: 'nancy', img: Nancy },
]

// shuffle the avatars array
for (let i = avatars.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1))
  ;[avatars[i], avatars[j]] = [avatars[j], avatars[i]]
}

export default function LoginDialog() {
  const [name, setName] = useState<string>('')
  const [avatarIndex, setAvatarIndex] = useState<number>(0)
  const [nameFieldEmpty, setNameFieldEmpty] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const game = phaserGame.scene.keys.game as Game

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (name === '') {
      setNameFieldEmpty(true)
    } else {
      game.registerKeys()
      game.myPlayer.setPlayerName(name)
      game.myPlayer.setPlayerTexture(avatars[avatarIndex].name)
      dispatch(setLoggedIn(true))
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="glass-panel rounded-2xl p-9 w-[520px] flex flex-col items-center gap-6"
      >
        <h2 className="text-xl font-semibold text-white">Welcome to PixelHQ</h2>
        <p className="text-sm text-gray-400">Choose your character and enter a name</p>

        <div className="flex gap-3">
          {avatars.map((avatar, index) => (
            <button
              key={avatar.name}
              type="button"
              onClick={() => setAvatarIndex(index)}
              className={`w-20 h-24 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                index === avatarIndex
                  ? 'bg-primary/20 ring-2 ring-primary'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              <img src={avatar.img} alt={avatar.name} className="w-12 h-[68px] object-contain" />
            </button>
          ))}
        </div>

        <TextField
          autoFocus
          fullWidth
          label="Name"
          variant="outlined"
          color="secondary"
          error={nameFieldEmpty}
          helperText={nameFieldEmpty && 'Name is required'}
          onInput={(e) => {
            setName((e.target as HTMLInputElement).value)
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: 'white',
              '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.4)' },
            },
            '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
          }}
        />

        <Button
          variant="contained"
          size="large"
          type="submit"
          sx={{
            background: '#0d59f2',
            '&:hover': { background: '#0b4ad4' },
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '12px',
            px: 6,
          }}
        >
          Enter PixelHQ
        </Button>
      </form>
    </div>
  )
}
