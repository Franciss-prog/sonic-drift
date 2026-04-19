/**
 * Audio Engine for Sonic Drift
 * Handles Web Audio API initialization, FFT analysis, and frequency band extraction
 */

export interface AudioBands {
	bass: number; // 0-255 (0-250 Hz)
	mid: number; // 0-255 (250 Hz - 2 kHz)
	treble: number; // 0-255 (2 kHz+)
	waveform: Uint8Array; // Raw waveform data
	frequency: Uint8Array; // FFT frequency data
	energy: number; // Overall energy (0-1)
}

export class AudioEngine {
	private audioContext: AudioContext | null = null;
	private analyser: AnalyserNode | null = null;
	private dataArray: Uint8Array<ArrayBuffer> | null = null;
	private waveformArray: Uint8Array<ArrayBuffer> | null = null;
	private mediaSource: MediaElementAudioSourceNode | MediaStreamAudioSourceNode | null = null;
	private isInitialized = false;
	private audioElement: HTMLAudioElement | null = null;
	private mediaStream: MediaStream | null = null;
	private currentObjectUrl: string | null = null;

	constructor() {
		// Engine will be initialized on first use
	}

	/**
	 * Initialize the audio context and analyser
	 */
	private initializeContext(): void {
		if (this.isInitialized) return;

		this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
		this.analyser = this.audioContext.createAnalyser();

		// Configure analyser for detailed frequency analysis
		this.analyser.fftSize = 256; // 128 frequency bins
		this.analyser.smoothingTimeConstant = 0.8;

		const bufferLength = this.analyser.frequencyBinCount;
		this.dataArray = new Uint8Array(new ArrayBuffer(bufferLength));
		this.waveformArray = new Uint8Array(new ArrayBuffer(bufferLength));

		this.isInitialized = true;
	}

	/**
	 * Start capturing audio from the user's microphone
	 */
	async startMicrophone(): Promise<void> {
		this.initializeContext();

		try {
			this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
			const source = this.audioContext!.createMediaStreamSource(this.mediaStream);
			source.connect(this.analyser!);
			this.analyser!.connect(this.audioContext!.destination);
			this.mediaSource = source;
		} catch (error) {
			console.error('Microphone access denied:', error);
			throw error;
		}
	}

	/**
	 * Load and play an audio file
	 */
	loadAudioFile(file: File): Promise<void> {
		return new Promise((resolve, reject) => {
			this.initializeContext();

			// Clean up previous file source before creating a new one
			if (this.audioElement) {
				this.audioElement.pause();
				this.audioElement.src = '';
			}
			if (this.mediaSource) {
				try {
					this.mediaSource.disconnect();
				} catch {
					// Safe to ignore: source may already be disconnected
				}
				this.mediaSource = null;
			}

			if (this.currentObjectUrl) {
				URL.revokeObjectURL(this.currentObjectUrl);
				this.currentObjectUrl = null;
			}

			this.currentObjectUrl = URL.createObjectURL(file);
			this.audioElement = new Audio();
			this.audioElement.preload = 'auto';
			this.audioElement.src = this.currentObjectUrl;

			const onCanPlay = () => {
				if (!this.audioElement) return;
				cleanup();

				try {
					const source = this.audioContext!.createMediaElementSource(this.audioElement);
					source.connect(this.analyser!);
					this.analyser!.connect(this.audioContext!.destination);
					this.mediaSource = source;
					resolve();
				} catch (error) {
					reject(error);
				}
			};

			const onError = () => {
				cleanup();
				reject(new Error('Audio element failed to load file'));
			};

			const cleanup = () => {
				if (!this.audioElement) return;
				this.audioElement.removeEventListener('canplay', onCanPlay);
				this.audioElement.removeEventListener('error', onError);
			};

			this.audioElement.addEventListener('canplay', onCanPlay, { once: true });
			this.audioElement.addEventListener('error', onError, { once: true });
			this.audioElement.load();
		});
	}

	/**
	 * Play the loaded audio file
	 */
	play(): void {
		if (!this.audioContext) return;

		if (this.audioContext.state === 'suspended') {
			void this.audioContext.resume();
		}

		if (this.audioElement) {
			void this.audioElement.play();
		}
	}

	/**
	 * Pause playback
	 */
	pause(): void {
		if (this.audioElement) {
			this.audioElement.pause();
		}
	}

	/**
	 * Stop and reset audio
	 */
	stop(): void {
		this.pause();
		if (this.audioElement) {
			this.audioElement.currentTime = 0;
		}
	}

	/**
	 * Stop microphone capture
	 */
	stopMicrophone(): void {
		if (this.mediaStream) {
			this.mediaStream.getTracks().forEach((track) => track.stop());
			this.mediaStream = null;
		}
	}

	/**
	 * Get current audio frequency and waveform data
	 * Returns frequency bands and raw data for visualization
	 */
	getAudioData(): AudioBands {
		if (!this.analyser || !this.dataArray || !this.waveformArray) {
			return {
				bass: 0,
				mid: 0,
				treble: 0,
				waveform: new Uint8Array(0),
				frequency: new Uint8Array(0),
				energy: 0
			};
		}

		// Get frequency data
		this.analyser.getByteFrequencyData(this.dataArray);

		// Get waveform data
		this.analyser.getByteTimeDomainData(this.waveformArray);

		// Extract frequency bands
		// Assuming 256 FFT size with ~12kHz upper range (44.1kHz sample rate / 2 = 22.05kHz, adjusted for display)
		const bassEnd = Math.floor((250 / 6000) * this.dataArray.length); // ~250 Hz
		const midEnd = Math.floor((2000 / 6000) * this.dataArray.length); // ~2 kHz

		// Calculate average for each band
		let bassSum = 0,
			midSum = 0,
			trebleSum = 0;

		for (let i = 0; i < this.dataArray.length; i++) {
			const value = this.dataArray[i];

			if (i < bassEnd) {
				bassSum += value;
			} else if (i < midEnd) {
				midSum += value;
			} else {
				trebleSum += value;
			}
		}

		const bass = bassSum / bassEnd / 255;
		const mid = midSum / (midEnd - bassEnd) / 255;
		const treble = trebleSum / (this.dataArray.length - midEnd) / 255;
		const energy = (bassSum + midSum + trebleSum) / (this.dataArray.length * 255);

		return {
			bass: Math.min(bass, 1),
			mid: Math.min(mid, 1),
			treble: Math.min(treble, 1),
			waveform: new Uint8Array(this.waveformArray),
			frequency: new Uint8Array(this.dataArray),
			energy: Math.min(energy, 1)
		};
	}

	/**
	 * Get current playback time for audio file
	 */
	getCurrentTime(): number {
		return this.audioElement?.currentTime || 0;
	}

	/**
	 * Get total duration of audio file
	 */
	getDuration(): number {
		return this.audioElement?.duration || 0;
	}

	/**
	 * Check if audio is currently playing
	 */
	isPlaying(): boolean {
		if (this.audioElement) {
			return !this.audioElement.paused && this.audioElement.currentTime > 0;
		}
		return this.audioContext?.state === 'running';
	}

	/**
	 * Clean up resources
	 */
	destroy(): void {
		this.stopMicrophone();
		this.stop();
		if (this.audioElement) {
			this.audioElement.src = '';
		}
		if (this.currentObjectUrl) {
			URL.revokeObjectURL(this.currentObjectUrl);
			this.currentObjectUrl = null;
		}
		// Note: Don't close audioContext as it might be reused
	}
}
