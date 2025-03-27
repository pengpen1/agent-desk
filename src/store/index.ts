import { configureStore } from '@reduxjs/toolkit'
import themeReducer from './slices/themeSlice'
import serverReducer from './slices/serverSlice'

export const store = configureStore({
  reducer: {
    theme: themeReducer,
    server: serverReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch 