let audioContext: AudioContext | null = null
let isMuted = false

function getContext(): AudioContext | null {
  if (isMuted) {
    return null
  }

  if (!audioContext) {
    audioContext = new AudioContext()
  }

  return audioContext
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
): void {
  const ctx = getContext()
  if (!ctx) {
    return
  }

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

  gainNode.gain.setValueAtTime(volume, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

export function playMoveSound(): void {
  playTone(440, 0.08, 'sine', 0.1)
  setTimeout(() => playTone(520, 0.06, 'sine', 0.08), 40)
}

export function playCaptureSound(): void {
  playTone(300, 0.12, 'square', 0.12)
  setTimeout(() => playTone(200, 0.15, 'square', 0.1), 60)
}

export function playRajaCaptureSound(): void {
  playTone(200, 0.3, 'sawtooth', 0.15)
  setTimeout(() => playTone(150, 0.4, 'sawtooth', 0.12), 100)
  setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.1), 250)
}

export function playDieRollSound(): void {
  for (let i = 0; i < 6; i += 1) {
    setTimeout(() => {
      playTone(800 + Math.random() * 400, 0.04, 'square', 0.06)
    }, i * 60)
  }
}

export function playPassTurnSound(): void {
  playTone(350, 0.1, 'triangle', 0.08)
}

export function playGameOverSound(): void {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.2, 'sine', 0.12), i * 150)
  })
}

export function playLoreRevealSound(): void {
  playTone(220, 0.4, 'sine', 0.08)
  setTimeout(() => playTone(330, 0.3, 'sine', 0.06), 200)
}

export function setMuted(muted: boolean): void {
  isMuted = muted
}

export function getMuted(): boolean {
  return isMuted
}
