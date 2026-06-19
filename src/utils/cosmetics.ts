export type BoardTheme = 'classic' | 'parchment' | 'rosewood' | 'stone' | 'ivory'
export type PieceTheme = 'classic' | 'geometric' | 'minimal'
export type DieTheme = 'classic' | 'bone' | 'jade' | 'clay'

export interface CosmeticsState {
  gamesPlayed: number
  wins: number
  unlockedBoardThemes: BoardTheme[]
  unlockedPieceThemes: PieceTheme[]
  unlockedDieThemes: DieTheme[]
  selectedBoardTheme: BoardTheme
  selectedPieceTheme: PieceTheme
  selectedDieTheme: DieTheme
}

const STORAGE_KEY = 'pasa-cosmetics'

const DEFAULT_STATE: CosmeticsState = {
  gamesPlayed: 0,
  wins: 0,
  unlockedBoardThemes: ['classic'],
  unlockedPieceThemes: ['classic'],
  unlockedDieThemes: ['classic'],
  selectedBoardTheme: 'classic',
  selectedPieceTheme: 'classic',
  selectedDieTheme: 'classic',
}

const UNLOCK_THRESHOLDS = {
  boardThemes: [
    { theme: 'parchment' as BoardTheme, games: 3 },
    { theme: 'rosewood' as BoardTheme, games: 7 },
    { theme: 'stone' as BoardTheme, games: 12 },
    { theme: 'ivory' as BoardTheme, games: 20 },
  ],
  pieceThemes: [
    { theme: 'geometric' as PieceTheme, games: 5 },
    { theme: 'minimal' as PieceTheme, games: 15 },
  ],
  dieThemes: [
    { theme: 'bone' as DieTheme, games: 4 },
    { theme: 'jade' as DieTheme, games: 10 },
    { theme: 'clay' as DieTheme, games: 18 },
  ],
}

function loadState(): CosmeticsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_STATE }
    }
    return { ...DEFAULT_STATE, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_STATE }
  }
}

function saveState(state: CosmeticsState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // localStorage unavailable
  }
}

export function getCosmetics(): CosmeticsState {
  return loadState()
}

export function recordGame(won: boolean): CosmeticsState {
  const state = loadState()
  state.gamesPlayed += 1
  if (won) {
    state.wins += 1
  }

  for (const { theme, games } of UNLOCK_THRESHOLDS.boardThemes) {
    if (state.gamesPlayed >= games && !state.unlockedBoardThemes.includes(theme)) {
      state.unlockedBoardThemes.push(theme)
    }
  }
  for (const { theme, games } of UNLOCK_THRESHOLDS.pieceThemes) {
    if (state.gamesPlayed >= games && !state.unlockedPieceThemes.includes(theme)) {
      state.unlockedPieceThemes.push(theme)
    }
  }
  for (const { theme, games } of UNLOCK_THRESHOLDS.dieThemes) {
    if (state.gamesPlayed >= games && !state.unlockedDieThemes.includes(theme)) {
      state.unlockedDieThemes.push(theme)
    }
  }

  saveState(state)
  return state
}

export function setBoardTheme(theme: BoardTheme): void {
  const state = loadState()
  state.selectedBoardTheme = theme
  saveState(state)
}

export function setPieceTheme(theme: PieceTheme): void {
  const state = loadState()
  state.selectedPieceTheme = theme
  saveState(state)
}

export function setDieTheme(theme: DieTheme): void {
  const state = loadState()
  state.selectedDieTheme = theme
  saveState(state)
}

export const BOARD_THEME_COLORS: Record<BoardTheme, { light: string; dark: string }> = {
  classic: { light: '#F0D9B5', dark: '#B58863' },
  parchment: { light: '#E8D5A3', dark: '#C4A265' },
  rosewood: { light: '#D4A574', dark: '#8B4513' },
  stone: { light: '#A9A9A9', dark: '#696969' },
  ivory: { light: '#FFFFF0', dark: '#DDD8C0' },
}

export const PIECE_THEME_STYLES: Record<PieceTheme, 'filled' | 'outlined' | 'simple'> = {
  classic: 'filled',
  geometric: 'outlined',
  minimal: 'simple',
}

export const DIE_THEME_COLORS: Record<DieTheme, { bg: string; dots: string; border: string }> = {
  classic: { bg: '#F5F5F5', dots: '#1a1a1a', border: '#999' },
  bone: { bg: '#F5F0E1', dots: '#3a3020', border: '#C4B998' },
  jade: { bg: '#00A86B', dots: '#FFFFFF', border: '#007A4D' },
  clay: { bg: '#CD853F', dots: '#3E2723', border: '#8B5E3C' },
}

export function getNextUnlock(): { type: string; theme: string; gamesNeeded: number } | null {
  const state = loadState()
  const all = [
    ...UNLOCK_THRESHOLDS.boardThemes.map((t) => ({ ...t, type: 'board' })),
    ...UNLOCK_THRESHOLDS.pieceThemes.map((t) => ({ ...t, type: 'piece' })),
    ...UNLOCK_THRESHOLDS.dieThemes.map((t) => ({ ...t, type: 'die' })),
  ]

  for (const { theme, games, type } of all) {
    if (state.gamesPlayed < games) {
      return { type, theme, gamesNeeded: games - state.gamesPlayed }
    }
  }
  return null
}

export const BOARD_THEME_LABELS: Record<BoardTheme, string> = {
  classic: 'Classic',
  parchment: 'Parchment',
  rosewood: 'Rosewood',
  stone: 'Stone',
  ivory: 'Ivory',
}

export const PIECE_THEME_LABELS: Record<PieceTheme, string> = {
  classic: 'Classic',
  geometric: 'Geometric',
  minimal: 'Minimal',
}

export const DIE_THEME_LABELS: Record<DieTheme, string> = {
  classic: 'Classic',
  bone: 'Bone',
  jade: 'Jade',
  clay: 'Clay',
}
