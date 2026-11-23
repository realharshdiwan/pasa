let audioContext: AudioContext | null = null
let isMuted = false

function getContext(): AudioContext | null {
  if (isMuted) return null
  if (!audioContext) audioContext = new AudioContext()
  return audioContext
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  delay: number = 0,
): void {
  const ctx = getContext()
  if (!ctx) return

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay)
  gain.gain.setValueAtTime(0, ctx.currentTime + delay)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.005)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime + delay)
  osc.stop(ctx.currentTime + delay + duration)
}

function playNoise(duration: number, volume: number, delay: number = 0): void {
  const ctx = getContext()
  if (!ctx) return

  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1
  }

  const source = ctx.createBufferSource()
  source.buffer = buffer

  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0, ctx.currentTime + delay)
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)

  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.value = 3000

  source.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  source.start(ctx.currentTime + delay)
}

export function playMoveSound(): void {
  playTone(520, 0.06, 'sine', 0.1)
  playTone(660, 0.04, 'sine', 0.06, 0.03)
}

export function playCaptureSound(): void {
  playNoise(0.08, 0.08)
  playTone(400, 0.1, 'square', 0.12)
  playTone(250, 0.15, 'square', 0.08, 0.05)
}

export function playElephantStompSound(): void {
  playNoise(0.2, 0.15)
  playTone(85, 0.35, 'triangle', 0.22)
  playTone(55, 0.45, 'sine', 0.28, 0.04)
  playTone(40, 0.55, 'sine', 0.2, 0.1)
}

export function playRajaCaptureSound(): void {
  playNoise(0.18, 0.12)
  // Royal trumpet/horn fanfare: D4 -> F#4 -> A4 -> D5 -> F#5
  const fanfare = [293.66, 369.99, 440.0, 587.33, 739.99]
  fanfare.forEach((freq, idx) => {
    playTone(freq, 0.25, 'sawtooth', 0.12, idx * 0.09)
    playTone(freq * 0.5, 0.3, 'triangle', 0.1, idx * 0.09)
  })
  playTone(146.83, 0.6, 'sawtooth', 0.15, 0.45)
}

export function playDieRollSound(): void {
  for (let i = 0; i < 8; i++) {
    const freq = 600 + Math.random() * 600
    playTone(freq, 0.035, 'square', 0.04, i * 0.05)
    if (i % 2 === 0) playNoise(0.02, 0.03, i * 0.05)
  }
}

export function playDieResultSound(): void {
  playTone(880, 0.08, 'sine', 0.1)
  playTone(1100, 0.06, 'sine', 0.07, 0.06)
}

export function playPassTurnSound(): void {
  playTone(350, 0.08, 'triangle', 0.07)
  playTone(280, 0.1, 'triangle', 0.05, 0.06)
}

export function playEliminationSound(): void {
  playTone(300, 0.15, 'sawtooth', 0.1)
  playTone(200, 0.2, 'sawtooth', 0.08, 0.1)
  playTone(120, 0.3, 'sawtooth', 0.06, 0.2)
}

export function playVictorySound(): void {
  const fanfare = [523, 659, 784, 1047, 784, 1047, 1319]
  fanfare.forEach((freq, i) => {
    playTone(freq, 0.18, 'sine', 0.1, i * 0.12)
    playTone(freq * 0.5, 0.18, 'sine', 0.04, i * 0.12)
  })
}

export function playGameOverSound(): void {
  playVictorySound()
}

export function playLoreRevealSound(): void {
  playTone(220, 0.4, 'sine', 0.06)
  playTone(330, 0.35, 'sine', 0.04, 0.15)
  playTone(440, 0.3, 'sine', 0.03, 0.3)
}

export function setMuted(muted: boolean): void {
  isMuted = muted
}

export function getMuted(): boolean {
  return isMuted
}
