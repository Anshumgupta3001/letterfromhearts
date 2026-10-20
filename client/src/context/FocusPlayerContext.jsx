// src/context/FocusPlayerContext.jsx
// ─────────────────────────────────────────────────────────────────
// Global audio player state. The <audio> element lives HERE, in the
// provider — outside the page switcher — so playback continues no
// matter where the user navigates on the site.
//
// Queue behaviour:
//   play(track, queueTracks) sets the active queue (the tracks of
//   the category the user is browsing). When a track ends, playback
//   advances to the next track in the queue and wraps around at the
//   end. A track only repeats if it is alone in its queue.
//   updateQueue(tracks) rebuilds the queue when the user switches
//   category while something is playing.
//
// Transitions: tracks fade out ~200ms, swap source, fade in ~200ms.
// ─────────────────────────────────────────────────────────────────
import { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react'

const FocusPlayerContext = createContext(null)

const FADE_MS = 200
const FADE_STEP = 20 // ms per volume step

export function FocusPlayerProvider({ children }) {
  const audioRef = useRef(null)
  const queueRef = useRef([])   // tracks in the active queue
  const indexRef = useRef(-1)   // position of current track in queue
  const volumeRef = useRef(0.8) // user-chosen target volume
  const fadeRef = useRef(null)  // active fade interval
  const trackRef = useRef(null) // mirrors currentTrack for event handlers

  const [currentTrack, setCurrentTrack] = useState(null)
  const [isPlaying,    setIsPlaying]    = useState(false)
  const [volume,       setVolumeState]  = useState(0.8)
  const [progress,     setProgress]     = useState(0)

  const clearFade = () => {
    if (fadeRef.current) { clearInterval(fadeRef.current); fadeRef.current = null }
  }

  // Ramp audio.volume toward `target` over `ms`, then call `done`
  const fadeTo = useCallback((target, ms, done) => {
    const audio = audioRef.current
    if (!audio) return
    clearFade()
    const steps = Math.max(1, Math.round(ms / FADE_STEP))
    const start = audio.volume
    let i = 0
    fadeRef.current = setInterval(() => {
      i++
      audio.volume = Math.min(1, Math.max(0, start + (target - start) * (i / steps)))
      if (i >= steps) { clearFade(); done?.() }
    }, FADE_STEP)
  }, [])

  // Load a track and fade it in
  const startTrack = useCallback((track) => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = track.src
    audio.volume = 0
    audio.play()
      .then(() => fadeTo(volumeRef.current, FADE_MS))
      .catch(err => {
        console.error('[FocusPlayer] Failed to play:', err.message)
        setIsPlaying(false)
      })
    trackRef.current = track
    setCurrentTrack(track)
    setIsPlaying(true)
    setProgress(0)
  }, [fadeTo])

  // Fade the current sound out, then start `track`
  const switchTrack = useCallback((track) => {
    const audio = audioRef.current
    if (!audio) return
    if (!audio.paused && audio.src) fadeTo(0, FADE_MS, () => startTrack(track))
    else startTrack(track)
  }, [fadeTo, startTrack])

  // Step through the queue (dir = 1 next, -1 previous), wrapping
  const advance = useCallback((dir) => {
    const q = queueRef.current
    const audio = audioRef.current
    if (!audio || q.length === 0) return
    if (q.length === 1) {
      // Only track in this category — restart it
      audio.currentTime = 0
      audio.play().catch(() => {})
      setIsPlaying(true)
      return
    }
    const i = (indexRef.current + dir + q.length) % q.length
    indexRef.current = i
    switchTrack(q[i])
  }, [switchTrack])

  const advanceRef = useRef(advance)
  useEffect(() => { advanceRef.current = advance }, [advance])

  // Create the audio element once
  useEffect(() => {
    const audio = new Audio()
    audio.volume = 0.8
    audioRef.current = audio

    const onTime = () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration)
    }
    const onEnded = () => advanceRef.current(1)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    return () => {
      clearFade()
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio.src = ''
    }
  }, [])

  // Play a track. `queueTracks` is the list it belongs to (the
  // filtered category); the queue loops inside that list.
  const play = useCallback((track, queueTracks) => {
    const audio = audioRef.current
    if (!audio) return

    if (queueTracks?.length) {
      queueRef.current = queueTracks
      indexRef.current = queueTracks.findIndex(t => t.id === track.id)
    }

    if (trackRef.current?.id === track.id) {
      // Same track — toggle
      if (isPlaying) { fadeTo(0, 150, () => { audio.pause() }); setIsPlaying(false) }
      else { audio.play().catch(() => {}); fadeTo(volumeRef.current, 150); setIsPlaying(true) }
      return
    }

    if (indexRef.current === -1 || queueRef.current.length === 0) {
      queueRef.current = [track]
      indexRef.current = 0
    }
    switchTrack(track)
  }, [isPlaying, fadeTo, switchTrack])

  // Rebuild the queue (category change) without interrupting playback
  const updateQueue = useCallback((tracks) => {
    queueRef.current = tracks
    indexRef.current = tracks.findIndex(t => t.id === trackRef.current?.id)
  }, [])

  const next = useCallback(() => advance(1),  [advance])
  const prev = useCallback(() => advance(-1), [advance])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !trackRef.current) return
    if (isPlaying) { fadeTo(0, 150, () => audio.pause()); setIsPlaying(false) }
    else { audio.play().catch(() => {}); fadeTo(volumeRef.current, 150); setIsPlaying(true) }
  }, [isPlaying, fadeTo])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    clearFade()
    audio.pause()
    audio.src = ''
    queueRef.current = []
    indexRef.current = -1
    trackRef.current = null
    setCurrentTrack(null)
    setIsPlaying(false)
    setProgress(0)
  }, [])

  const setVolume = useCallback((v) => {
    clearFade()
    volumeRef.current = v
    const audio = audioRef.current
    if (audio) audio.volume = v
    setVolumeState(v)
  }, [])

  const seek = useCallback((fraction) => {
    const audio = audioRef.current
    if (!audio || !audio.duration) return
    audio.currentTime = fraction * audio.duration
    setProgress(fraction)
  }, [])

  return (
    <FocusPlayerContext.Provider value={{
      currentTrack, isPlaying, volume, progress,
      play, togglePlay, stop, setVolume, next, prev, seek, updateQueue,
    }}>
      {children}
    </FocusPlayerContext.Provider>
  )
}

export function useFocusPlayer() {
  const ctx = useContext(FocusPlayerContext)
  if (!ctx) throw new Error('useFocusPlayer must be used within FocusPlayerProvider')
  return ctx
}
