<script lang="ts">
	import type { CanvasConfig } from '$lib/sonicCanvas';

	interface Props {
		isOpen: boolean;
		isPlaying: boolean;
		isUsingMicrophone: boolean;
		colorScheme: CanvasConfig['colorScheme'];
		particleSensitivity: number;
		distortionIntensity: number;
		glowIntensity: number;
		onToggleModal: () => void;
		onPlayPause: () => void;
		onToggleSource: () => void;
		onColorSchemeChange: (scheme: CanvasConfig['colorScheme']) => void;
		onSensitivityChange: (value: number) => void;
		onDistortionChange: (value: number) => void;
		onGlowChange: (value: number) => void;
		onFileUpload: (file: File) => Promise<void>;
	}

	let {
		isOpen = false,
		isPlaying = false,
		isUsingMicrophone = false,
		colorScheme = 'neon',
		particleSensitivity = 0.5,
		distortionIntensity = 0.5,
		glowIntensity = 0.5,
		onToggleModal = () => {},
		onPlayPause = () => {},
		onToggleSource = () => {},
		onColorSchemeChange = () => {},
		onSensitivityChange = () => {},
		onDistortionChange = () => {},
		onGlowChange = () => {},
		onFileUpload = async () => {}
	}: Props = $props();

	let isLoading = $state(false);
	let fileInput = $state<HTMLInputElement | null>(null);

	const colorSchemes: Array<CanvasConfig['colorScheme']> = ['neon', 'pastel', 'dark'];

	async function handleFileUpload(event: Event): Promise<void> {
		const target = event.target as HTMLInputElement;
		const file = target.files?.[0];

		if (!file) return;

		isLoading = true;
		try {
			await onFileUpload(file);
		} finally {
			isLoading = false;
			if (fileInput) fileInput.value = '';
		}
	}

	function triggerFileInput(): void {
		fileInput?.click();
	}

	function handleBackdropClick(e: MouseEvent): void {
		if (e.target === e.currentTarget) {
			onToggleModal();
		}
	}
</script>

<!-- Floating Control Bar (Always Visible) -->
<div class="fixed top-1/2 right-6 z-20 -translate-y-1/2 transform">
	<div
		class="flex flex-col items-center gap-3 rounded-3xl border border-purple-500/30 bg-black/60 px-3 py-4 backdrop-blur-md"
	>
		<!-- Play/Pause Button -->
		<button
			onclick={onPlayPause}
			disabled={isLoading}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white transition-all hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
			title={isPlaying ? 'Pause' : 'Play'}
		>
			<span class="text-base">{isPlaying ? '⏸' : '▶'}</span>
		</button>

		<!-- Microphone/File Toggle -->
		<button
			onclick={onToggleSource}
			disabled={isLoading || isPlaying}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white transition-all hover:from-pink-600 hover:to-purple-600 disabled:opacity-50"
			title={isUsingMicrophone ? 'Switch to File' : 'Switch to Microphone'}
		>
			<span class="text-base">{isUsingMicrophone ? '🎙️' : '🎵'}</span>
		</button>

		<!-- File Upload (visible when using file mode) -->
		{#if !isUsingMicrophone}
			<button
				onclick={triggerFileInput}
				disabled={isLoading}
				class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white transition-all hover:from-orange-600 hover:to-red-600 disabled:opacity-50"
				title={isLoading ? 'Loading...' : 'Upload Audio'}
			>
				<span class="text-base">📁</span>
			</button>
			<input
				bind:this={fileInput}
				type="file"
				accept="audio/*"
				onchange={handleFileUpload}
				class="hidden"
			/>
		{/if}

		<!-- Divider -->
		<div class="h-px w-8 bg-purple-500/30"></div>

		<!-- Settings Modal Toggle -->
		<button
			onclick={onToggleModal}
			class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white transition-all hover:from-violet-600 hover:to-fuchsia-600"
			title="Open Settings"
		>
			<span class="text-base">⚙️</span>
		</button>
	</div>
</div>

<!-- Settings Modal -->
{#if isOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
		onclick={handleBackdropClick}
	>
		<div
			class="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-purple-500/50 bg-gradient-to-b from-gray-900 to-black p-6 shadow-2xl"
		>
			<!-- Modal Header -->
			<div class="mb-6 flex items-center justify-between">
				<h2 class="text-xl font-bold text-white">
					<span class="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent"
						>Settings</span
					>
				</h2>
				<button
					onclick={onToggleModal}
					class="text-xl text-gray-400 transition-colors hover:text-white"
					title="Close Settings"
				>
					✕
				</button>
			</div>

			<!-- Status Info -->
			<div class="mb-6 text-sm text-gray-400">
				<div class="flex items-center gap-2">
					<span class="inline-block h-2 w-2 rounded-full bg-cyan-400"></span>
					{isUsingMicrophone ? '🎙️ Listening to microphone' : '🎵 Using audio file'}
				</div>
			</div>

			<!-- Settings Content -->
			<div class="space-y-5">
				<!-- Color Scheme Selection -->
				<div>
					<label class="mb-3 block text-xs font-semibold tracking-widest text-gray-300 uppercase"
						>Color Theme</label
					>
					<div class="flex gap-2">
						{#each colorSchemes as scheme}
							<button
								onclick={() => onColorSchemeChange(scheme)}
								class="flex-1 rounded px-3 py-2 text-xs font-medium transition-all {colorScheme ===
								scheme
									? 'bg-purple-500 text-white'
									: 'bg-purple-500/20 text-gray-300 hover:bg-purple-500/40'}"
							>
								{scheme.charAt(0).toUpperCase() + scheme.slice(1)}
							</button>
						{/each}
					</div>
				</div>

				<!-- Particle Sensitivity -->
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label
							class="text-xs font-semibold tracking-widest text-gray-300 uppercase"
							for="particle-sensitivity">Particle Energy</label
						>
						<span class="text-xs font-medium text-cyan-400"
							>{(particleSensitivity * 100).toFixed(0)}%</span
						>
					</div>
					<input
						id="particle-sensitivity"
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={particleSensitivity}
						onchange={(e) => onSensitivityChange(parseFloat(e.currentTarget.value))}
						class="slider w-full accent-cyan-500"
					/>
				</div>

				<!-- Distortion Intensity -->
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label
							class="text-xs font-semibold tracking-widest text-gray-300 uppercase"
							for="distortion-intensity">Wave Distortion</label
						>
						<span class="text-xs font-medium text-pink-400"
							>{(distortionIntensity * 100).toFixed(0)}%</span
						>
					</div>
					<input
						id="distortion-intensity"
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={distortionIntensity}
						onchange={(e) => onDistortionChange(parseFloat(e.currentTarget.value))}
						class="slider w-full accent-pink-500"
					/>
				</div>

				<!-- Glow Intensity -->
				<div>
					<div class="mb-2 flex items-center justify-between">
						<label
							class="text-xs font-semibold tracking-widest text-gray-300 uppercase"
							for="glow-intensity">Glow Bloom</label
						>
						<span class="text-xs font-medium text-purple-400"
							>{(glowIntensity * 100).toFixed(0)}%</span
						>
					</div>
					<input
						id="glow-intensity"
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={glowIntensity}
						onchange={(e) => onGlowChange(parseFloat(e.currentTarget.value))}
						class="slider w-full accent-purple-500"
					/>
				</div>
			</div>

			<!-- Close Button -->
			<button
				onclick={onToggleModal}
				class="mt-6 w-full rounded-lg bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-2 font-semibold text-white transition-all hover:from-gray-600 hover:to-gray-700"
			>
				Done
			</button>
		</div>
	</div>
{/if}

<style>
	/* Custom range slider styling */
	.slider {
		appearance: none;
		width: 100%;
		height: 6px;
		border-radius: 5px;
		background: linear-gradient(to right, #1f2937, #374151);
		outline: none;
		cursor: pointer;
	}

	.slider::-webkit-slider-thumb {
		appearance: none;
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: currentColor;
		cursor: pointer;
		box-shadow: 0 0 10px currentColor;
		transition: transform 0.2s;
	}

	.slider::-webkit-slider-thumb:hover {
		transform: scale(1.2);
	}

	.slider::-moz-range-thumb {
		width: 16px;
		height: 16px;
		border-radius: 50%;
		background: currentColor;
		cursor: pointer;
		border: none;
		box-shadow: 0 0 10px currentColor;
		transition: transform 0.2s;
	}

	.slider::-moz-range-thumb:hover {
		transform: scale(1.2);
	}
</style>
