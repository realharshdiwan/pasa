import { PLAYER_COLORS } from '../constants/colors'
import { useGameStore } from '../store/gameStore'
import { capitalizeColor } from '../utils/format'

export default function TurnIndicator() {
  const currentTurn = useGameStore((state) => state.gameState.currentTurn)

  return (
    <div
      className="w-full rounded-lg px-4 py-2 text-center text-sm font-semibold text-white shadow-md"
      style={{ backgroundColor: PLAYER_COLORS[currentTurn] }}
    >
      Current Turn: {capitalizeColor(currentTurn)}
    </div>
  )
}
