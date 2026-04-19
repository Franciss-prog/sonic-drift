# Sonic Drift - Architecture & Implementation Guide

> A real-time audio-reactive visual playground where music shapes motion, color, and atmosphere.

## Project Overview

Sonic Drift transforms audio input into mesmerizing, abstract visuals using the Web Audio API and Canvas rendering. The application analyzes incoming audio (microphone or file) in real-time, extracts frequency data via FFT, and maps that data to dynamic visual parameters.

## Architecture

### Three-Layer Design

```
┌─────────────────────────────────────────────────────────┐
│                   UI Layer (Svelte)                      │
│            Controls.svelte + Layout                      │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│              Core Engines (TypeScript)                   │
│        AudioEngine.ts + SonicCanvas.ts                   │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│                Browser APIs                              │
│    Web Audio API + Canvas 2D + requestAnimationFrame    │
└─────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. **AudioEngine** (`src/lib/audioEngine.ts`)

Manages all audio input and frequency analysis.

**Key Responsibilities:**

- Initialize Web Audio API context
- Capture audio from microphone or file
- Perform FFT analysis using AnalyserNode
- Extract frequency bands (bass, mid, treble)
- Calculate overall energy level

**Main Methods:**

```typescript
startMicrophone(); // Start capturing microphone input
loadAudioFile(file); // Load an audio file
getAudioData(); // Get current frequency/waveform data
play / pause / stop(); // Control playback
```

**Audio Data Structure:**

```typescript
interface AudioBands {
	bass: number; // 0-1 (0-250 Hz)
	mid: number; // 0-1 (250Hz - 2kHz)
	treble: number; // 0-1 (2kHz+)
	waveform: Uint8Array; // Raw time-domain data
	frequency: Uint8Array; // FFT frequency data (128 bins)
	energy: number; // Overall energy 0-1
}
```

**FFT Configuration:**

- FFT Size: 256 (yields 128 frequency bins)
- Frequency Range: ~6000 Hz (adjusted for visual display)
- Smoothing: 0.8 (temporal smoothing)

### 2. **SonicCanvas** (`src/lib/sonicCanvas.ts`)

Renders all visual effects to canvas using audio-reactive parameters.

**Visual Effects:**

#### Particle System

- **Spawning:** Audio energy drives particle creation rate
- **Physics:** Velocity, damping, gravity based on audio bands
- **Lifecycle:** Particles fade out over time
- **Color:** Hue determined by frequency distribution

```typescript
Particle {
  x, y               // Position
  vx, vy            // Velocity (affected by bass for gravity)
  life: 0-1         // Fades from 1 to 0
  hue               // Color (treble drives brighter hues)
}
```

#### Wave Distortion

- **Rings:** Multiple concentric waves distorted by waveform data
- **Distortion:** Bass frequency bends the geometry
- **Intensity:** Configurable via `distortionIntensity` slider
- **Animation:** Continuous ring generation driven by mid frequencies

#### Glow/Bloom Effect

- **Method:** Canvas blur filter + radial gradient
- **Center:** Screen center with dynamic radius
- **Color:** Shifts with treble frequencies
- **Intensity:** Driven by overall energy and `glowIntensity` setting

#### Background

- **Motion Trail:** Semi-transparent overlay creates persistence effect
- **Frequency Visualization:** Bar chart at screen bottom showing FFT data
- **Color Mapping:** Each frequency bin maps to hue (0-360°)

**Rendering Loop:**

```
requestAnimationFrame → getAudioData() → render effects → present
```

Target: 60 FPS with 150 max particles for smooth performance.

### 3. **Controls Component** (`src/lib/Controls.svelte`)

Interactive UI for user control and parameter adjustment.

**Features:**

- Play/Pause toggle
- Microphone ↔ File mode switch
- Audio file upload
- Color theme selector (neon/pastel/dark)
- Three sensitivity sliders:
  - Particle Energy (0-1)
  - Wave Distortion (0-1)
  - Glow Bloom (0-1)

**Design:**

- Bottom-mounted control panel with glass-morphism effect
- Gradient buttons with hover states
- Responsive range sliders with value display
- Error handling and loading states

## Audio-to-Visual Mapping

### Frequency Bands → Visual Parameters

| Frequency            | Visual Effect                    | Parameter               |
| -------------------- | -------------------------------- | ----------------------- |
| **Bass** (0-250Hz)   | Particle gravity, wave ring size | vy += bass × 0.15       |
| **Mid** (250Hz-2kHz) | Ring count, distortion amount    | ringCount = 3 + mid × 3 |
| **Treble** (2kHz+)   | Particle color, glow hue         | hue = treble × 120°     |
| **Energy** (Overall) | Particle spawn rate, brightness  | spawnCount ∝ energy     |

### Color Schemes

**Neon:** Bright, saturated colors

```css
hsl(hue, 80%-100%, 40%-70%)
```

**Pastel:** Soft, desaturated colors

```css
hsl(hue, 40%-60%, 60%-80%)
```

**Dark:** Deep, moody colors

```css
hsl(hue, 80%-100%, 20%-60%)
```

## Data Flow

```
User Action (play/pause/upload)
    ↓
AudioEngine.getAudioData()
    ↓
FFT Analysis → Frequency Bands (bass, mid, treble)
    ↓
SonicCanvas.render(audioData)
    ├→ updateParticles(audioData)      // Physics & colors
    ├→ drawBackground(audioData)        // Trail effect & frequency bars
    ├→ drawWaveDistortion(audioData)    // Animated rings
    ├→ drawParticles(audioData)         // Particle rendering
    └→ drawGlowEffect(audioData)        // Bloom effect
    ↓
requestAnimationFrame (60fps)
```

## Performance Optimization

1. **Particle Pool:** Max 150 particles prevents memory bloat
2. **Canvas Rendering:** Hardware-accelerated 2D context
3. **Frequency Bin Sampling:** 256 FFT size (balance detail vs speed)
4. **Event Debouncing:** Slider changes don't trigger re-renders
5. **Canvas Resize:** Only on window resize event (not every frame)

## Configuration Options

```typescript
interface CanvasConfig {
  width: number;                    // Canvas width (px)
  height: number;                   // Canvas height (px)
  colorScheme: 'neon'|'pastel'|'dark';
  particleSensitivity: 0-1;         // Particle spawn multiplier
  distortionIntensity: 0-1;         // Wave bending strength
  glowIntensity: 0-1;               // Bloom intensity multiplier
}
```

## Browser Requirements

- **Web Audio API:** FFT analysis and audio context
- **Canvas 2D:** Rendering with filters (blur)
- **requestAnimationFrame:** 60 FPS animation loop
- **getUserMedia:** Microphone input (with permission)

**Supported Browsers:** Chrome, Firefox, Safari, Edge (all modern versions)

## File Structure

```
src/
├── lib/
│   ├── audioEngine.ts          # Web Audio API wrapper
│   ├── sonicCanvas.ts          # Canvas rendering engine
│   ├── Controls.svelte         # UI control panel
│   └── index.ts                # Public exports
├── routes/
│   ├── +page.svelte            # Main application page
│   ├── +layout.svelte          # Layout wrapper
│   └── layout.css              # Global styles
└── app.html                    # HTML entry point
```

## Development

### Start Dev Server

```bash
npm run dev
```

Opens at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

### Type Checking

```bash
npm run check
```

### Format Code

```bash
npm run format
```

## Key Implementation Details

### FFT Analysis Loop

The AnalyserNode provides frequency data as a Uint8Array (0-255 per bin):

```typescript
analyser.getByteFrequencyData(dataArray); // Frequency spectrum
analyser.getByteTimeDomainData(waveformArray); // Raw waveform
```

### Particle Physics

Each frame:

1. Apply damping: `vx *= 0.98`
2. Apply gravity (bass-based): `vy += bass × 0.15`
3. Update position: `x += vx`, `y += vy`
4. Decrease life: `life -= 0.01`
5. Wrap at edges for seamless motion

### Canvas Rendering Order

Effects rendered in order of depth:

1. Background (motion trail)
2. Frequency visualization (bars)
3. Particles (semi-transparent)
4. Wave distortion (thin lines)
5. Glow effect (blur + gradient)

### Color Animation

Hues continuously shift based on:

- Current frequency data
- Time elapsed (for smooth transitions)
- User-selected color scheme

## Customization Ideas

1. **Add Shader Support:** Use WebGL for advanced glow effects
2. **Frequency Filters:** Different visual behaviors per frequency band
3. **Recording:** Capture canvas as video
4. **Preset Modes:** Save/load visual configurations
5. **Multi-canvas:** Side-by-side comparison views
6. **3D Effects:** WebGL for 3D particle systems
7. **Audio Visualization Modes:** Change particle behavior algorithms
8. **Beat Detection:** Sync visual peaks to music beats

## Troubleshooting

**Issue:** Microphone input not working

- **Solution:** Check browser permissions, ensure HTTPS in production

**Issue:** Low frame rate

- **Solution:** Reduce `maxParticles`, lower blur intensity, disable glow effect

**Issue:** Audio file won't load

- **Solution:** Ensure file is a supported format (MP3, WAV, OGG), check console for CORS issues

**Issue:** Visual effects too subtle

- **Solution:** Increase sensitivity sliders (particle, distortion, glow)

## Credits

Built with:

- **SvelteKit** - Framework
- **Tailwind CSS** - Styling
- **Web Audio API** - Audio analysis
- **Canvas 2D** - Rendering
- **TypeScript** - Type safety

---

Made with 🎶 and motion
