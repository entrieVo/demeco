"use client";
import { useEffect, useState } from "react";
import ComparisonLayout from "@/features/comparison/ui/comparison-layout";
import { NOISE_TYPES, NoiseType } from "@/features/constants";
import {
	applyColorImageNoise,
	applyGaussianImageNoise,
	applySaltPepperImageNoise,
} from "@/features/comparison/model/image-noises";
import {
	applyColoredAudioNoise,
	applyGaussianAudioNoise,
	applyImpulseAudioNoise,
} from "@/features/comparison/model/audio-noises";
import { Alert, AlertTitle } from "@/shared/ui/kit/alert";
import { AlertTriangleIcon } from "lucide-react";

export default function ComparisonPage() {
	const [originalImage, setOriginalImage] = useState<File | null>(null);
	const [noisyImage, setNoisyImage] = useState<Blob | null>(null);
	const [originalAudio, setOriginalAudio] = useState<File | null>(null);
	const [noisyAudio, setNoisyAudio] = useState<Blob | null>(null);
	const [selectedNoise, setSelectedNoise] = useState<NoiseType>(
		NOISE_TYPES.GAUSSIAN
	);
	const [noiseParams, setNoiseParams] = useState({ sigma: 0.5, sigmaBlur: 2 });
	const [showAlert, setShowAlert] = useState(false);

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setOriginalImage(file);
		setNoisyImage(null);
	};

	const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		setOriginalAudio(file);
		setNoisyAudio(null);
	};

	const handleNoiseSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setSelectedNoise(e.target.value as NoiseType);
	};

	const handleApplyNoise = async () => {
		if (!originalImage || !originalAudio) {
			setShowAlert(true);
			return;
		}
		let image = new Blob();
		let audio = new Blob();

		switch (selectedNoise) {
			case NOISE_TYPES.GAUSSIAN:
				image = await applyGaussianImageNoise(
					originalImage,
					noiseParams.sigma * 50
				);
				audio = await applyGaussianAudioNoise(
					originalAudio,
					noiseParams.sigma * 0.1
				);
				break;
			case NOISE_TYPES.COLORED:
				image = await applyColorImageNoise(
					originalImage,
					noiseParams.sigma * 50,
					noiseParams.sigmaBlur
				);
				audio = await applyColoredAudioNoise(
					originalAudio,
					noiseParams.sigma * 0.1
				);
				break;
			case NOISE_TYPES.IMPULSE:
				image = await applySaltPepperImageNoise(
					originalImage,
					noiseParams.sigma
				);
				audio = await applyImpulseAudioNoise(
					originalAudio,
					noiseParams.sigma * 0.1
				);
				break;
			default:
				break;
		}

		setNoisyImage(image);
		setNoisyAudio(audio);
	};

	const onSigmaChange = (value: number[]) => {
		setNoiseParams((params) => {
			return {
				...params,
				sigma: value[0],
			};
		});
	};
	const onSigmaBlurChange = (value: number[]) => {
		setNoiseParams((params) => {
			return {
				...params,
				sigmaBlur: value[0],
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
				imageRef={originalImage}
				noisyImage={noisyImage}
				audioRef={originalAudio}
				noisyAudio={noisyAudio}
				selectedNoise={selectedNoise}
				noiseParams={noiseParams}
				onImageUpload={handleImageUpload}
				onAudioUpload={handleAudioUpload}
				onNoiseSelect={handleNoiseSelect}
				onNoiseApply={handleApplyNoise}
				onSigmaChange={onSigmaChange}
				onSigmaBlurChange={onSigmaBlurChange}
			/>
		</div>
	);
}
