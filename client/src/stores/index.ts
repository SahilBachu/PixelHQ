import { configureStore } from '@reduxjs/toolkit'
import userReducer from './UserStore'
import agentReducer from './AgentStore'

const store = configureStore({
  reducer: {
    user: userReducer,
    agent: agentReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export default store
