"use client";
import { useEffect, useState } from "react";
import ComparisonLayout from "@/features/comparison/ui/comparison-layout";
import { NOISE_TYPES, NoiseType } from "@/features/constants";
import { Alert, AlertTitle } from "@/shared/ui/kit/alert";
import { AlertTriangleIcon } from "lucide-react";
import { gaussianNoise } from "@/features/comparison/model/noise/gaussian-noise";
import { impulseNoise } from "@/features/comparison/model/noise/impulse-noise";
import { colorNoise } from "@/features/comparison/model/noise/color-noise";
import { hmmDenoise } from "@/features/comparison/model/denoise/hmm-denoise";
import { wienerDenoise } from "@/features/comparison/model/denoise/wiener-denoise";
import { bayesianDenoise } from "@/features/comparison/model/denoise/bayesian-denoise";
import {
	audioBufferFromFile,
	cloneChannels,
	encodeWAV,
} from "@/features/comparison/model/utils/audio-processing";
import {
	fileToImageData,
	imageDataToBlob,
} from "@/features/comparison/model/utils/image-processing";

export default function ComparisonPage() {
	const [imageRef, setImageRef] = useState<File | null>(null);
	const [noisedImage, setNoisedImage] = useState<Blob | null>(null);

	const [audioRef, setAudioRef] = useState<File | null>(null);
	const [noisedAudio, setNoisedAudio] = useState<Blob | null>(null);
	const [denoisedAudio, setDenoisedAudio] = useState<Blob | null>(null);
	const [denoisedImage, setDenoisedImage] = useState<Blob | null>(null);

	const [selectedNoise, setSelectedNoise] = useState<NoiseType>(
		NOISE_TYPES.GAUSSIAN
	);
	const [noiseParams, setNoiseParams] = useState({
		noiseVariance: 5,
		blurStrength: 2,
	});
	const [selectedDenoise, setSelectedDenoise] = useState<string | null>(null);
	const [showAlert, setShowAlert] = useState(false);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setImageRef(file);
		setNoisedImage(null);
		setDenoisedAudio(null);
	};

	const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setAudioRef(file);
		setNoisedAudio(null);
	};

	const handleNoiseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedNoise(e.target.value as NoiseType);
	};

	const handleDenoiseSelect = (value: string) => {
		setSelectedDenoise(value);
	};

	const handleApplyNoise = async () => {
		if (!imageRef || !audioRef) {
			setShowAlert(true);
			return;
		}
		let audioBlob: Blob | null = new Blob(),
			imageBlob: Blob | null = new Blob();

		const audioBuffer = await audioBufferFromFile(audioRef),
			imageData = await fileToImageData(imageRef);

		let noisedAudioArray: Float32Array[] | null = await cloneChannels(
				audioBuffer
			),
			noisedImageData: Uint8ClampedArray | null = null;

		switch (selectedNoise) {
			case NOISE_TYPES.GAUSSIAN:
				noisedAudioArray = await gaussianNoise(
					noisedAudioArray,
					noiseParams.noiseVariance
				);
				noisedImageData = await gaussianNoise(
					imageData.data,
					noiseParams.noiseVariance
				);

				break;

			case NOISE_TYPES.COLOR:
				noisedAudioArray = await colorNoise(
					noisedAudioArray,
					noiseParams.noiseVariance,
					noiseParams.blurStrength
				);
				noisedImageData = await colorNoise(
					imageData,
					noiseParams.noiseVariance,
					noiseParams.blurStrength
				);

				break;
			case NOISE_TYPES.IMPULSE:
				noisedAudioArray = await impulseNoise(
					noisedAudioArray,
					noiseParams.noiseVariance
				);
				noisedImageData = await impulseNoise(
					imageData.data,
					noiseParams.noiseVariance
				);
				break;
			default:
				break;
		}

		if (!noisedAudioArray || !noisedImageData) return;

		audioBlob = encodeWAV(noisedAudioArray, audioBuffer.sampleRate);
		imageBlob = await imageDataToBlob(imageData, noisedImageData);

		setNoisedImage(imageBlob);
		setNoisedAudio(audioBlob);

		if (!noisedAudio || !selectedDenoise) return;

		const denoiseFunc = {
			bayesian: bayesianDenoise,
			wiener: wienerDenoise,
			hmm: hmmDenoise,
		}[selectedDenoise];

		if (!denoiseFunc) return;

		const denoisedAudio = await denoiseFunc(
			noisedAudioArray,
			noiseParams.noiseVariance
		);
		const denoisedImageData = await denoiseFunc(
			noisedImageData,
			noiseParams.noiseVariance,
			imageData.width,
			imageData.height
		);

		setDenoisedAudio(encodeWAV(denoisedAudio, audioBuffer.sampleRate));
		setDenoisedImage(await imageDataToBlob(imageData, denoisedImageData));
	};

	const onSigmaChange = (value: number[]) => {
		setNoiseParams((params) => {
			return {
				...params,
				noiseVariance: /* sliderToSnrDb */ value[0],
			};
		});
	};
	const onSigmaBlurChange = (value: number[]) => {
		setNoiseParams((params) => {
			return {
				...params,
				blurStrength: value[0],
			};
		});
	};

	useEffect(() => {
		if (!showAlert) return;

		const timer = setTimeout(() => {
			setShowAlert(false);
		}, 2_000);

		return () => clearTimeout(timer);
	}, [showAlert]);

	return (
		<div className="relative">
			{showAlert && (
				<Alert
					className="max-w-md border-none bg-[#c98936]
				sticky top-5 left-1/2 -translate-x-1/2 z-100">
					<AlertTriangleIcon color="#631e14" />
					<AlertTitle className="text-[#631e14]">
						Отсутствуют загруженные файлы
					</AlertTitle>
				</Alert>
			)}

			<ComparisonLayout
				audioRef={audioRef}
				imageRef={imageRef}
				noisyAudio={noisedAudio}
				noisyImage={noisedImage}
				denoisedAudio={denoisedAudio}
				denoisedImage={denoisedImage}
				selectedNoise={selectedNoise}
				selectedDenoise={selectedDenoise}
				noiseParams={noiseParams}
				onImageUpload={handleImageUpload}
				onAudioUpload={handleAudioUpload}
				onNoiseSelect={handleNoiseSelect}
				onDenoiseSelect={handleDenoiseSelect}
				onNoiseApply={handleApplyNoise}
				onSigmaChange={onSigmaChange}
				onSigmaBlurChange={onSigmaBlurChange}
			/>
		</div>
	);
}
