# 🎵 Sonic Drift

> A real-time audio-reactive visual playground where music shapes motion, color, and atmosphere.

---

## What is Sonic Drift?

Sonic Drift is an interactive music-driven visual canvas where sound is transformed into real-time motion, light, and abstract visuals. Audio frequency data controls dynamic animations — particles, glow effects, wave distortions — creating an evolving visual "mood space" that reacts directly to music.

No two moments sound (or look) the same.

---

## Features

- 🎚️ **Audio-Reactive Visuals** — Frequency data drives every animation in real time
- ✨ **Dynamic Particles** — Sound energy spawns and propels particle systems
- 🌊 **Wave Distortions** — Bass and mid frequencies warp and bend the canvas
- 💡 **Glow Effects** — Light blooms and pulses in sync with the music
- 🎨 **Mood Space** — An evolving atmosphere that shifts with tone, tempo, and texture

---

## How It Works

Sonic Drift uses the **Web Audio API** to analyze incoming audio in real time. Frequency and waveform data from the audio stream are mapped to visual parameters — controlling particle velocity, color hue, distortion intensity, and glow radius — rendering a living canvas that breathes with the music.

```
Audio Input → FFT Analysis → Frequency Bands → Visual Parameters → Animated Canvas
```

---

## Getting Started

```bash
# Clone the repository
git clone https://github.com/your-username/sonic-drift.git

# Navigate into the project
cd sonic-drift

# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open your browser and go to `http://localhost:3000`.

---

## Usage

1. Open Sonic Drift in your browser
2. Grant microphone access **or** upload an audio file
3. Hit **Play** and watch the canvas come alive
4. Adjust visual settings via the control panel to tune the experience

---

## Tech Stack

| Layer          | Technology         |
| -------------- | ------------------ |
| Audio Analysis | Web Audio API      |
| Rendering      | Canvas API / WebGL |
| Framework      | JavaScript / React |
| Styling        | CSS / GLSL Shaders |

---

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Made with 🎶 and motion</p>
