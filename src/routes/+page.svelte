<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { AudioEngine } from '$lib/audioEngine';
	import { SonicCanvas, type CanvasConfig } from '$lib/sonicCanvas';
	import Controls from '$lib/Controls.svelte';

	// State
	let canvasElement: HTMLCanvasElement;
	let audioEngine: AudioEngine;
	let sonicCanvas: SonicCanvas;
	let isPlaying = $state(false);
	let isUsingMicrophone = $state(false);
	let isModalOpen = $state(false);
	let colorScheme: CanvasConfig['colorScheme'] = $state('neon');
	let particleSensitivity = $state(0.6);
	let distortionIntensity = $state(0.5);
	let glowIntensity = $state(0.6);
	let error = $state<string | null>(null);

	/**
	 * Initialize canvas and audio engine on mount
	 */
	onMount(() => {
		try {
			audioEngine = new AudioEngine();

			const config: CanvasConfig = {
				width: window.innerWidth,
				height: window.innerHeight,
				colorScheme,
				particleSensitivity,
				distortionIntensity,
				glowIntensity
			};

			sonicCanvas = new SonicCanvas(canvasElement, config);

			// Start the animation loop
			sonicCanvas.start(() => audioEngine.getAudioData());
		} catch (err) {
			console.error('Initialization error:', err);
			error = 'Failed to initialize audio engine';
		}

		// Handle window resize
		const handleResize = () => {
			if (sonicCanvas) {
				sonicCanvas.updateConfig({
					width: window.innerWidth,
					height: window.innerHeight
				});
			}
		};

		window.addEventListener('resize', handleResize);

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	});

	/**
	 * Clean up on destroy
	 */
	onDestroy(() => {
		if (sonicCanvas) sonicCanvas.destroy();
		if (audioEngine) audioEngine.destroy();
	});

	/**
	 * Toggle between play and pause
	 */
	function handlePlayPause(): void {
		try {
			if (isPlaying) {
				audioEngine.pause();
			} else {
				audioEngine.play();
			}
			isPlaying = !isPlaying;
		} catch (err) {
			console.error('Playback error:', err);
			error = 'Playback failed';
		}
	}

	/**
	 * Toggle between microphone and file input
	 */
	async function handleToggleSource(): Promise<void> {
		try {
			if (isPlaying) {
				handlePlayPause();
			}

			if (isUsingMicrophone) {
				// Switch to file mode
				audioEngine.stopMicrophone();
				isUsingMicrophone = false;
				sonicCanvas.clear();
			} else {
				// Switch to microphone mode
				await audioEngine.startMicrophone();
				isUsingMicrophone = true;
				sonicCanvas.clear();
			}
		} catch (err) {
			console.error('Source toggle error:', err);
			error = isUsingMicrophone
				? 'Failed to start microphone'
				: 'Microphone access denied. Using file mode instead.';
			isUsingMicrophone = false;
		}
	}

	/**
	 * Handle file upload
	 */
	async function handleFileUpload(file: File): Promise<void> {
		try {
			if (isPlaying) {
				handlePlayPause();
			}

			audioEngine.stopMicrophone();
			await audioEngine.loadAudioFile(file);
			isUsingMicrophone = false;
			sonicCanvas.clear();
			error = null;
		} catch (err) {
			console.error('File upload error:', err);
			error = 'Failed to load audio file. Please try another file.';
		}
	}

	/**
	 * Update color scheme
	 */
	function handleColorSchemeChange(scheme: CanvasConfig['colorScheme']): void {
		colorScheme = scheme;
		if (sonicCanvas) {
			sonicCanvas.updateConfig({ colorScheme: scheme });
		}
	}

	/**
	 * Update particle sensitivity
	 */
	function handleSensitivityChange(value: number): void {
		particleSensitivity = value;
		if (sonicCanvas) {
			sonicCanvas.updateConfig({ particleSensitivity: value });
		}
	}

	/**
	 * Update distortion intensity
	 */
	function handleDistortionChange(value: number): void {
		distortionIntensity = value;
		if (sonicCanvas) {
			sonicCanvas.updateConfig({ distortionIntensity: value });
		}
	}

	/**
	 * Update glow intensity
	 */
	function handleGlowChange(value: number): void {
		glowIntensity = value;
		if (sonicCanvas) {
			sonicCanvas.updateConfig({ glowIntensity: value });
		}
	}

	/**
	 * Toggle settings modal
	 */
	function handleToggleModal(): void {
		isModalOpen = !isModalOpen;
	}
</script>

<!-- Main Canvas -->
<canvas bind:this={canvasElement} class="fixed inset-0 h-screen w-screen"></canvas>

<!-- Error Message -->
{#if error}
	<div
		class="fixed top-4 left-1/2 z-30 -translate-x-1/2 transform rounded-lg border border-red-500 bg-red-500/10 px-4 py-3 text-red-200"
	>
		{error}
	</div>
{/if}

<!-- Controls -->
<Controls
	isOpen={isModalOpen}
	{isPlaying}
	{isUsingMicrophone}
	{colorScheme}
	{particleSensitivity}
	{distortionIntensity}
	{glowIntensity}
	onToggleModal={handleToggleModal}
	onPlayPause={handlePlayPause}
	onToggleSource={handleToggleSource}
	onColorSchemeChange={handleColorSchemeChange}
	onSensitivityChange={handleSensitivityChange}
	onDistortionChange={handleDistortionChange}
	onGlowChange={handleGlowChange}
	onFileUpload={handleFileUpload}
/>

<!-- Title Overlay (top left) -->
<div class="fixed top-6 left-6 z-10">
	<h1 class="text-2xl font-bold text-white drop-shadow-lg">
		<span class="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
			>Sonic Drift</span
		>
	</h1>
	<p class="mt-1 text-xs text-gray-400">Audio-reactive visual playground</p>
</div>

<style>
	:global {
		body {
			margin: 0;
			padding: 0;
			background: #0a0a14;
			overflow: hidden;
		}

		html,
		body {
			width: 100%;
			height: 100%;
		}
	}

	:global(canvas) {
		display: block;
	}
</style>
