export function capitalizeColor(color: string): string {
  return color.charAt(0).toUpperCase() + color.slice(1)
}

const COL_LETTERS = 'abcdefgh'

export function positionToNotation(row: number, col: number): string {
  return `${COL_LETTERS[col]}${row + 1}`
}
