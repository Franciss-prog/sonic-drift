/**
 * Visual Canvas Renderer for Sonic Drift
 * Handles particle system, wave distortion, and rendering with audio reactivity
 */

import type { AudioBands } from './audioEngine';

interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number; // 0-1, where 1 is fully alive
	size: number;
	hue: number;
}

export interface CanvasConfig {
	width: number;
	height: number;
	colorScheme: 'neon' | 'pastel' | 'dark';
	particleSensitivity: number; // 0-1
	distortionIntensity: number; // 0-1
	glowIntensity: number; // 0-1
}

export class SonicCanvas {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private particles: Particle[] = [];
	private maxParticles = 150;
	private config: CanvasConfig;
	private animationId: number | null = null;
	private time = 0;
	private spectrumHeights: number[] = [];

	constructor(canvas: HTMLCanvasElement, config: CanvasConfig) {
		this.canvas = canvas;
		const context = canvas.getContext('2d');
		if (!context) throw new Error('Failed to get 2D context');
		this.ctx = context;
		this.config = config;
		this.resizeCanvas();
		window.addEventListener('resize', () => this.resizeCanvas());
	}

	/**
	 * Resize canvas to match window dimensions
	 */
	private resizeCanvas(): void {
		this.canvas.width = this.config.width;
		this.canvas.height = this.config.height;
	}

	/**
	 * Get color based on audio frequency and theme
	 */
	private getColor(hue: number, brightness: number): string {
		const saturation = 80 + brightness * 20;

		switch (this.config.colorScheme) {
			case 'neon':
				return `hsl(${hue}, ${saturation}%, ${40 + brightness * 30}%)`;
			case 'pastel':
				return `hsl(${hue}, ${40 + brightness * 20}%, ${60 + brightness * 20}%)`;
			case 'dark':
				return `hsl(${hue}, ${saturation}%, ${20 + brightness * 40}%)`;
			default:
				return `hsl(${hue}, ${saturation}%, ${50 + brightness * 30}%)`;
		}
	}

	/**
	 * Spawn particles based on audio energy
	 */
	private spawnParticles(audioData: AudioBands): void {
		const spawnCount = Math.floor((audioData.energy * 5 + 1) * this.config.particleSensitivity);

		for (let i = 0; i < spawnCount && this.particles.length < this.maxParticles; i++) {
			const angle = Math.random() * Math.PI * 2;
			const speed = 2 + audioData.energy * 6;
			const hue = (audioData.treble * 120 + audioData.mid * 120 + audioData.bass * 60) % 360;

			this.particles.push({
				x: this.canvas.width / 2 + Math.cos(angle) * 50,
				y: this.canvas.height / 2 + Math.sin(angle) * 50,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: 1,
				size: 2 + Math.random() * 4,
				hue: hue
			});
		}
	}

	/**
	 * Update particle positions and lifecycle
	 */
	private updateParticles(audioData: AudioBands): void {
		for (let i = this.particles.length - 1; i >= 0; i--) {
			const particle = this.particles[i];

			// Apply damping
			particle.vx *= 0.98;
			particle.vy *= 0.98;

			// Apply gravity based on bass
			particle.vy += audioData.bass * 0.15;

			// Update position
			particle.x += particle.vx;
			particle.y += particle.vy;

			// Decrease life
			particle.life -= 0.01;

			// Wrap around edges
			if (particle.x < 0) particle.x = this.canvas.width;
			if (particle.x > this.canvas.width) particle.x = 0;
			if (particle.y < 0) particle.y = this.canvas.height;
			if (particle.y > this.canvas.height) particle.y = 0;

			// Remove dead particles
			if (particle.life <= 0) {
				this.particles.splice(i, 1);
			}
		}
	}

	/**
	 * Draw particle system
	 */
	private drawParticles(audioData: AudioBands): void {
		for (const particle of this.particles) {
			const alpha = particle.life;
			const brightness = 0.5 + particle.life * 0.5;

			this.ctx.fillStyle = this.getColor(particle.hue, brightness);
			this.ctx.globalAlpha = alpha * 0.7;

			this.ctx.beginPath();
			this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
			this.ctx.fill();
		}

		this.ctx.globalAlpha = 1;
	}

	/**
	 * Draw wave distortion effect based on audio
	 */
	private drawWaveDistortion(audioData: AudioBands): void {
		const centerX = this.canvas.width / 2;
		const centerY = this.canvas.height / 2;
		const waveforms = 3 + Math.floor(audioData.mid * 3);
		const distortion = 20 + audioData.bass * 80 * this.config.distortionIntensity;

		for (let w = 0; w < waveforms; w++) {
			const radius = 50 + w * 40;
			const hue = (360 - w * 60 + audioData.treble * 100) % 360;

			this.ctx.strokeStyle = this.getColor(hue, audioData.energy);
			this.ctx.lineWidth = 1 + audioData.energy * 2;
			this.ctx.globalAlpha = (1 - w / waveforms) * 0.3;

			this.ctx.beginPath();

			for (let i = 0; i <= 360; i += 2) {
				const angle = (i * Math.PI) / 180;

				// Apply waveform distortion from audio
				const waveInfluence =
					audioData.waveform[Math.floor((i / 360) * audioData.waveform.length)] / 128 - 1;
				const distortedRadius = radius + waveInfluence * distortion + audioData.bass * 20;

				const x = centerX + Math.cos(angle) * distortedRadius;
				const y = centerY + Math.sin(angle) * distortedRadius;

				if (i === 0) {
					this.ctx.moveTo(x, y);
				} else {
					this.ctx.lineTo(x, y);
				}
			}

			this.ctx.closePath();
			this.ctx.stroke();
		}

		this.ctx.globalAlpha = 1;
	}

	/**
	 * Draw glow/bloom effect using canvas filters and layering
	 */
	private drawGlowEffect(audioData: AudioBands): void {
		// Apply a softer, additive glow to avoid muddy dark blobs
		this.ctx.filter = `blur(${1 + audioData.energy * 5}px)`;
		this.ctx.globalCompositeOperation = 'lighter';

		const glowRadius = 100 + audioData.energy * 150;
		const centerX = this.canvas.width / 2;
		const centerY = this.canvas.height / 2;

		// Create radial gradient for glow
		const gradient = this.ctx.createRadialGradient(
			centerX,
			centerY,
			10,
			centerX,
			centerY,
			glowRadius
		);

		const glowHue = (audioData.treble * 360 + this.time * 20) % 360;
		const glowColor = this.getColor(glowHue, audioData.energy);

		gradient.addColorStop(0, glowColor);
		gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.08)');
		gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

		this.ctx.fillStyle = gradient;
		this.ctx.globalAlpha = (audioData.energy * this.config.glowIntensity) / 4;
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		this.ctx.globalAlpha = 1;
		this.ctx.filter = 'none';
		this.ctx.globalCompositeOperation = 'source-over';
	}

	/**
	 * Draw animated background with frequency visualization
	 */
	private drawBackground(audioData: AudioBands): void {
		// Clear each frame to remove ghosting/ash trails
		this.ctx.fillStyle = 'rgba(10, 10, 20, 1)';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

		if (audioData.frequency.length === 0) {
			return;
		}

		// CAVA-style bottom spectrum with grouped bins, smoothing, and rounded bars
		const barCount = 10;
		const sidePadding = 28;
		const bottomPadding = 34;
		const gap = 10;
		const availableWidth = this.canvas.width - sidePadding * 2;
		const totalGap = (barCount - 1) * gap;
		const barWidth = Math.max(4, (availableWidth - totalGap) / barCount);
		const binsPerBar = Math.max(1, Math.floor(audioData.frequency.length / barCount));
		const baseLine = this.canvas.height - bottomPadding;
		const maxBarHeight = this.canvas.height * 0.32;

		if (this.spectrumHeights.length !== barCount) {
			this.spectrumHeights = new Array(barCount).fill(0);
		}

		for (let i = 0; i < barCount; i++) {
			const start = i * binsPerBar;
			const end = Math.min(start + binsPerBar, audioData.frequency.length);

			let sum = 0;
			for (let j = start; j < end; j++) {
				sum += audioData.frequency[j];
			}

			const average = end > start ? sum / (end - start) : 0;
			const normalized = Math.pow(average / 255, 1.25);
			const targetHeight = 4 + normalized * (maxBarHeight + audioData.bass * 40);

			// Fast attack, slower release for a CAVA-like motion
			const previous = this.spectrumHeights[i];
			const smoothing = targetHeight > previous ? 0.65 : 0.18;
			const height = previous + (targetHeight - previous) * smoothing;
			this.spectrumHeights[i] = height;

			const x = sidePadding + i * (barWidth + gap);
			const y = baseLine - height;
			const radius = Math.min(4, barWidth * 0.45);
			const t = i / Math.max(1, barCount - 1);
			const hue = 190 + t * 130;

			this.ctx.fillStyle = this.getColor(hue, 0.4 + normalized * 0.6);
			this.ctx.globalAlpha = 0.25 + normalized * 0.55;
			this.ctx.shadowBlur = 8 + normalized * 10;
			this.ctx.shadowColor = this.getColor(hue, 0.7);

			this.ctx.beginPath();
			this.ctx.moveTo(x, baseLine);
			this.ctx.lineTo(x, y + radius);
			this.ctx.quadraticCurveTo(x, y, x + radius, y);
			this.ctx.lineTo(x + barWidth - radius, y);
			this.ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
			this.ctx.lineTo(x + barWidth, baseLine);
			this.ctx.closePath();
			this.ctx.fill();
		}

		this.ctx.shadowBlur = 0;
		this.ctx.globalAlpha = 1;
	}

	/**
	 * Main render loop
	 */
	private render = (audioData: AudioBands): void => {
		this.time++;

		// Draw background and frequency visualization
		this.drawBackground(audioData);

		// Spawn fresh particles from current audio energy before update/draw
		this.spawnParticles(audioData);

		// Update and draw particles
		this.updateParticles(audioData);
		this.drawParticles(audioData);

		// Draw wave distortion effect
		this.drawWaveDistortion(audioData);

		// Draw glow effect
		this.drawGlowEffect(audioData);
	};

	/**
	 * Start animation loop with audio data
	 */
	start(audioDataProvider: () => AudioBands): void {
		const tick = () => {
			const audioData = audioDataProvider();
			this.render(audioData);
			this.animationId = requestAnimationFrame(tick);
		};

		if (this.animationId === null) {
			this.animationId = requestAnimationFrame(tick);
		}
	}

	/**
	 * Stop animation loop
	 */
	stop(): void {
		if (this.animationId !== null) {
			cancelAnimationFrame(this.animationId);
			this.animationId = null;
		}
	}

	/**
	 * Clear canvas
	 */
	clear(): void {
		this.ctx.fillStyle = '#0a0a14';
		this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.particles = [];
	}

	/**
	 * Update configuration
	 */
	updateConfig(newConfig: Partial<CanvasConfig>): void {
		this.config = { ...this.config, ...newConfig };
	}

	/**
	 * Cleanup
	 */
	destroy(): void {
		this.stop();
	}
}
