/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Disc, Youtube, Tv, Music, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCustomAudio } from '../utils/audioDb';
import { VisibilityConfig } from '../types';

interface AudioPlayerProps {
  visibility?: VisibilityConfig;
  isAdminMode?: boolean;
}

export default function AudioPlayer({ visibility, isAdminMode = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);
  const [activeTrack, setActiveTrack] = useState<'theme' | 'stadium' | 'beats' | 'uploaded'>('theme');
  const [showVideo, setShowVideo] = useState(false);
  
  // YouTube states
  const [ytReady, setYtReady] = useState(false);
  const [isYtBuffering, setIsYtBuffering] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  
  // Synthesizer nodes & intervals
  const crowdBufferNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const drumIntervalRef = useRef<number | null>(null);
  const beatIntervalRef = useRef<number | null>(null);
  
  // YouTube Player ref
  const ytPlayerRef = useRef<any>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const customAudioRef = useRef<HTMLAudioElement | null>(null);

  const loadCustomFile = async (autoPlayIfNew: boolean = false) => {
    try {
      const file = await getCustomAudio();
      if (file) {
        setUploadedFile(file);
        const url = URL.createObjectURL(file);
        setUploadedUrl(url);
        setActiveTrack('uploaded');
        setIsPlaying(true);
      } else {
        setUploadedFile(null);
        if (activeTrack === 'uploaded') {
          setActiveTrack('theme');
        }
      }
    } catch (e) {
      console.error('Error loading custom background music file:', e);
    }
  };

  useEffect(() => {
    loadCustomFile();

    const handleUpdate = () => {
      loadCustomFile(true);
    };

    window.addEventListener('custom-audio-updated', handleUpdate);
    return () => {
      window.removeEventListener('custom-audio-updated', handleUpdate);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (uploadedUrl) {
        URL.revokeObjectURL(uploadedUrl);
      }
    };
  }, [uploadedUrl]);

  // Synchronize custom audio volume
  useEffect(() => {
    if (customAudioRef.current) {
      customAudioRef.current.volume = volume;
    }
  }, [volume]);

  // Handle playing custom background music
  useEffect(() => {
    if (!customAudioRef.current) return;
    if (isPlaying && activeTrack === 'uploaded' && uploadedUrl) {
      customAudioRef.current.play().catch((err) => {
        console.warn('Autoplay/play blocked by browser, waiting for user interaction:', err);
      });
    } else {
      customAudioRef.current.pause();
    }
  }, [isPlaying, activeTrack, uploadedUrl]);

  // Handle playing background music upon first user interaction if autoplay was blocked by the browser
  useEffect(() => {
    const handleInteraction = () => {
      if (isPlaying && activeTrack === 'uploaded' && customAudioRef.current) {
        if (customAudioRef.current.paused) {
          customAudioRef.current.play().catch((err) => {
            console.warn('Interaction play still blocked:', err);
          });
        }
      }
    };

    window.addEventListener('click', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    window.addEventListener('keydown', handleInteraction);

    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [isPlaying, activeTrack]);

  // Initialize Web Audio Context
  const initAudio = () => {
    if (audioContextRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);

      audioContextRef.current = ctx;
      gainNodeRef.current = masterGain;
    } catch (e) {
      console.error('Failed to initialize Web Audio API', e);
    }
  };

  // Sync volume with GainNode
  useEffect(() => {
    if (gainNodeRef.current && audioContextRef.current) {
      gainNodeRef.current.gain.linearRampToValueAtTime(volume, audioContextRef.current.currentTime + 0.1);
    }
  }, [volume]);

  // Handle Stop All Synthesizers
  const stopSynthesizers = () => {
    if (drumIntervalRef.current) {
      window.clearInterval(drumIntervalRef.current);
      drumIntervalRef.current = null;
    }
    if (beatIntervalRef.current) {
      window.clearInterval(beatIntervalRef.current);
      beatIntervalRef.current = null;
    }
    if (crowdBufferNodeRef.current) {
      try {
        crowdBufferNodeRef.current.stop();
        crowdBufferNodeRef.current.disconnect();
      } catch (e) {}
      crowdBufferNodeRef.current = null;
    }
  };

  // Create White Noise for Crowd Simulation
  const playCrowdNoise = () => {
    const ctx = audioContextRef.current;
    const master = gainNodeRef.current;
    if (!ctx || !master) return;

    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(320, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const crowdGain = ctx.createGain();
    crowdGain.gain.setValueAtTime(0.08, ctx.currentTime);

    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    source.connect(filter);
    filter.connect(crowdGain);
    crowdGain.connect(master);

    source.start();
    crowdBufferNodeRef.current = source;

    const cheerInterval = window.setInterval(() => {
      if (!isPlaying || activeTrack !== 'stadium') {
        window.clearInterval(cheerInterval);
        return;
      }
      const now = ctx.currentTime;
      crowdGain.gain.cancelScheduledValues(now);
      crowdGain.gain.setValueAtTime(crowdGain.gain.value, now);
      crowdGain.gain.exponentialRampToValueAtTime(0.25, now + 1.2);
      crowdGain.gain.exponentialRampToValueAtTime(0.08, now + 4.5);

      filter.frequency.exponentialRampToValueAtTime(450, now + 1.0);
      filter.frequency.exponentialRampToValueAtTime(320, now + 4.0);
    }, 8000);

    drumIntervalRef.current = cheerInterval;
  };

  // Synthesize a Cricket Clap & Drum rhythm
  const playRhythmicClaps = () => {
    const ctx = audioContextRef.current;
    const master = gainNodeRef.current;
    if (!ctx || !master) return;

    let step = 0;
    const bpm = 120;
    const stepTime = 60 / bpm;

    const scheduleBeats = () => {
      const now = ctx.currentTime;
      const drumPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0];
      const clapPattern = [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 1, 1];

      if (drumPattern[step % 16] === 1) {
        const osc = ctx.createOscillator();
        const drumGain = ctx.createGain();
        osc.connect(drumGain);
        drumGain.connect(master);

        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.18);

        drumGain.gain.setValueAtTime(0.6, now);
        drumGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.22);
      }

      if (clapPattern[step % 16] === 1) {
        const osc = ctx.createOscillator();
        const clapGain = ctx.createGain();
        osc.type = 'triangle';
        osc.connect(clapGain);
        clapGain.connect(master);

        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);

        clapGain.gain.setValueAtTime(0.18, now);
        clapGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.1);
      }

      step++;
    };

    const interval = window.setInterval(scheduleBeats, stepTime * 1000);
    beatIntervalRef.current = interval;
  };

  // Trigger synthesizer based on track selection
  const updatePlayback = () => {
    stopSynthesizers();

    if (!isPlaying) return;
    if (activeTrack === 'theme' || activeTrack === 'uploaded') return; // Handled by YouTube API or native audio element

    initAudio();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }

    if (activeTrack === 'stadium') {
      playCrowdNoise();
      playRhythmicClaps();
    } else if (activeTrack === 'beats') {
      playRhythmicClaps();
    }
  };

  useEffect(() => {
    updatePlayback();
    return () => stopSynthesizers();
  }, [isPlaying, activeTrack]);

  // YouTube Player Loader & Controller
  useEffect(() => {
    // Load YouTube IFrame Player API if not already present
    if (!(window as any).YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const checkYT = setInterval(() => {
      if ((window as any).YT && (window as any).YT.Player) {
        clearInterval(checkYT);
        initializePlayer();
      }
    }, 100);

    function initializePlayer() {
      if (ytPlayerRef.current) return;
      
      try {
        ytPlayerRef.current = new (window as any).YT.Player('youtube-player-element', {
          height: '100%',
          width: '100%',
          videoId: 'AR2vOMyK1wQ',
          playerVars: {
            autoplay: 0,
            controls: 1,
            disablekb: 0,
            fs: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            loop: 1,
            playlist: 'AR2vOMyK1wQ',
          },
          events: {
            onReady: (event: any) => {
              setYtReady(true);
              event.target.setVolume(volume * 100);
              if (isPlaying && activeTrack === 'theme') {
                event.target.playVideo();
              }
            },
            onStateChange: (event: any) => {
              const state = event.data;
              // YT.PlayerState: ENDED = 0, PLAYING = 1, PAUSED = 2, BUFFERING = 3
              if (state === 1) {
                setIsPlaying(true);
                setIsYtBuffering(false);
              } else if (state === 2) {
                setIsPlaying(false);
              } else if (state === 3) {
                setIsYtBuffering(true);
              } else if (state === 0) {
                event.target.playVideo(); // Loop
              }
            }
          }
        });
      } catch (err) {
        console.error('Error initializing YouTube player:', err);
      }
    }

    return () => {
      clearInterval(checkYT);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.destroy === 'function') {
        try {
          ytPlayerRef.current.destroy();
        } catch (e) {}
        ytPlayerRef.current = null;
      }
    };
  }, []);

  // Synchronize playback state with YouTube Player
  useEffect(() => {
    if (!ytPlayerRef.current || !ytReady) return;

    try {
      if (activeTrack === 'theme') {
        if (isPlaying) {
          const state = ytPlayerRef.current.getPlayerState?.();
          if (state !== 1) {
            ytPlayerRef.current.playVideo();
          }
        } else {
          const state = ytPlayerRef.current.getPlayerState?.();
          if (state === 1) {
            ytPlayerRef.current.pauseVideo();
          }
        }
      } else {
        ytPlayerRef.current.pauseVideo();
      }
    } catch (e) {
      console.error('Error controlling YouTube playback:', e);
    }
  }, [isPlaying, activeTrack, ytReady]);

  // Synchronize volume with YouTube Player
  useEffect(() => {
    if (!ytPlayerRef.current || !ytReady) return;
    try {
      ytPlayerRef.current.setVolume(volume * 100);
    } catch (e) {}
  }, [volume, ytReady]);

  // Visualizer Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.width = canvas.parentElement?.clientWidth || 250;
    let height = canvas.height = 40;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      ctx.clearRect(0, 0, width, height);

      const barCount = 18;
      const barWidth = width / barCount - 3;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          const multiplier = activeTrack === 'theme' ? 32 : (activeTrack === 'stadium' ? 22 : 35);
          const speed = activeTrack === 'theme' ? 0.008 : 0.005;
          const noise = Math.sin(Date.now() * speed + i * 0.4) * Math.cos(Date.now() * 0.002 + i * 0.8);
          barHeight = Math.abs(noise) * multiplier + 5;
        }

        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        if (activeTrack === 'theme') {
          gradient.addColorStop(0, '#ef4444');
          gradient.addColorStop(0.5, '#f43f5e');
          gradient.addColorStop(1, '#ec4899');
        } else {
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(0.5, '#8b5cf6');
          gradient.addColorStop(1, '#14b8a6');
        }

        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.roundRect(i * (barWidth + 3), height - barHeight, barWidth, barHeight, 2);
        ctx.fill();
      }
    };

    draw();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, activeTrack]);

  const togglePlayback = () => {
    if (activeTrack !== 'theme') {
      initAudio();
    }
    setIsPlaying(!isPlaying);
  };

  if (!isAdminMode && (!visibility || visibility.bgMusicPlayer === false)) {
    return (
      <audio 
        ref={customAudioRef} 
        src={uploadedUrl || undefined} 
        loop 
        preload="auto"
      />
    );
  }

  return (
    <div className="glass-panel p-4 rounded-3xl flex flex-col gap-4 max-w-2xl mx-auto mb-8 relative overflow-hidden transition-all duration-300 border border-white/10 shadow-2xl">
      {/* Decorative Light Glows */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl transition-colors duration-500 ${
        activeTrack === 'theme' ? 'bg-red-500/20' : 'bg-blue-500/20'
      }`} />
      <div className={`absolute -bottom-10 -left-10 w-24 h-24 rounded-full blur-2xl transition-colors duration-500 ${
        activeTrack === 'theme' ? 'bg-rose-500/20' : 'bg-purple-500/20'
      }`} />

      {/* Primary Control Row */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 z-10 w-full">
        
        {/* Play/Pause Button & Details */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={togglePlayback}
              id="audio-play-toggle"
              className={`p-3.5 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isPlaying 
                  ? (activeTrack === 'theme' 
                      ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30' 
                      : activeTrack === 'uploaded'
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/20')
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
              }`}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </motion.button>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-xs sm:text-sm tracking-wide text-white uppercase flex items-center gap-1.5 max-w-[150px] sm:max-w-xs truncate">
                  {activeTrack === 'uploaded' ? (
                    <>
                      <Music className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />
                      <span className="truncate">{uploadedFile ? uploadedFile.name : 'Custom Music'}</span>
                    </>
                  ) : activeTrack === 'theme' ? (
                    <>
                      <Youtube className="w-4 h-4 text-red-500 animate-pulse flex-shrink-0" />
                      APL 2026 Anthem
                    </>
                  ) : (
                    <>
                      <Music className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      APL Atmosphere
                    </>
                  )}
                </span>
                {isPlaying && (
                  <motion.span 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="flex items-center"
                  >
                    <Disc className={`w-3.5 h-3.5 ${activeTrack === 'theme' ? 'text-red-400' : activeTrack === 'uploaded' ? 'text-emerald-400' : 'text-blue-400'}`} />
                  </motion.span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5 font-medium max-w-[200px] sm:max-w-sm truncate">
                {isPlaying 
                  ? (isYtBuffering && activeTrack === 'theme' 
                      ? '⚡ Tuning track stream...' 
                      : activeTrack === 'theme' 
                        ? '🎶 YouTube Background Track playing...' 
                        : activeTrack === 'uploaded'
                          ? '✨ Playing uploaded background music...'
                          : activeTrack === 'stadium' 
                            ? '🏟️ Grand Stadium crowd noise active' 
                            : '👏 High-energy clap rhythm active') 
                  : '🔇 Audio system standby'}
              </p>
            </div>
          </div>

          {/* Visualizer inside control */}
          <div className="w-20 md:w-28 hidden sm:block opacity-90 h-10 overflow-hidden relative">
            <canvas ref={canvasRef} className="w-full h-full" />
          </div>
        </div>

        {/* Preset Selection & Volume */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-white/5">
            {uploadedFile && (
              <button
                onClick={() => {
                  setActiveTrack('uploaded');
                  if (!isPlaying) setIsPlaying(true);
                }}
                id="audio-preset-uploaded"
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                  activeTrack === 'uploaded' 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                ✨ Custom BG
              </button>
            )}
            <button
              onClick={() => {
                setActiveTrack('theme');
                if (!isPlaying) setIsPlaying(true);
              }}
              id="audio-preset-theme"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                activeTrack === 'theme' 
                  ? 'bg-red-500/20 text-red-300 border border-red-500/30 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🎵 Theme Song
            </button>
            <button
              onClick={() => {
                setActiveTrack('stadium');
                if (!isPlaying) setIsPlaying(true);
              }}
              id="audio-preset-stadium"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTrack === 'stadium' 
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏟️ Stadium
            </button>
            <button
              onClick={() => {
                setActiveTrack('beats');
                if (!isPlaying) setIsPlaying(true);
              }}
              id="audio-preset-clapping"
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTrack === 'beats' 
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              👏 Claps
            </button>
          </div>

          {/* Toggle Video Button (Only available for Theme Song track) */}
          {activeTrack === 'theme' && (
            <button
              onClick={() => setShowVideo(!showVideo)}
              id="toggle-video-player"
              className={`p-2 rounded-xl transition-all border cursor-pointer flex items-center justify-center gap-1.5 text-xs font-semibold ${
                showVideo 
                  ? 'bg-red-500/25 text-red-200 border-red-500/40' 
                  : 'bg-slate-900/80 text-slate-400 border-white/5 hover:text-white hover:border-white/15'
              }`}
              title="Toggle cinematic video frame"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>{showVideo ? 'Hide Clip' : 'Watch clip'}</span>
            </button>
          )}

          {/* Volume controls */}
          <div className="flex items-center gap-2 bg-slate-950/40 px-2.5 py-1.5 rounded-xl border border-white/5">
            <button 
              onClick={() => setVolume(volume === 0 ? 0.4 : 0)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              {volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16 sm:w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>
      </div>

      {/* Expandable YouTube Video Screen (Cinematic Mode) */}
      <div 
        id="youtube-player-container" 
        className={`relative rounded-2xl overflow-hidden border transition-all duration-500 ease-out bg-black/90 ${
          showVideo && activeTrack === 'theme' 
            ? 'h-48 sm:h-96 w-full opacity-100 mt-2 border-red-500/20 shadow-lg shadow-red-500/5' 
            : 'h-0 w-full opacity-0 pointer-events-none border-transparent overflow-hidden'
        }`}
      >
        <div id="youtube-player-element" className="absolute inset-0 w-full h-full" />
      </div>

      {/* Hidden audio tag for custom background music */}
      <audio 
        ref={customAudioRef} 
        src={uploadedUrl || undefined} 
        loop 
        preload="auto"
      />
    </div>
  );
}
