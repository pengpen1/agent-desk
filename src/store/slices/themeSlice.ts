import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface ThemeState {
  mode: 'light' | 'dark'
}

const initialState: ThemeState = {
  mode: 'light',
}

const themeSlice = createSlice({
  name: 'theme',
  initialState,
  reducers: {
    initTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.mode = action.payload
    },
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light'
    },
  },
})

export const { initTheme, toggleTheme } = themeSlice.actions
export default themeSlice.reducer 