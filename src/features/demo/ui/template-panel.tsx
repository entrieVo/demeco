import { useEffect, useState } from "react";
import { urlToFile } from "../model/processing/signal-processing";
import { twMerge } from "tailwind-merge";

export interface FileTemplate {
	id: string;
	name: string;
	type: "image" | "audio";
	url: string;
	fileName: string;
	mimeType: string;
}

const TEMPLATES: FileTemplate[] = [
	{
		id: "portret",
		name: "Портрет",
		type: "image",
		url: "/templates/portret.png",
		fileName: "portret.png",
		mimeType: "image/png",
	},
	{
		id: "beach",
		name: "Пляж",
		type: "image",
		url: "/templates/beach.png",
		fileName: "beach.png",
		mimeType: "image/png",
	},
	{
		id: "nature",
		name: "Природа",
		type: "image",
		url: "/templates/nature.png",
		fileName: "nature.png",
		mimeType: "image/png",
	},
	{
		id: "plane",
		name: "Самолёт",
		type: "image",
		url: "/templates/plane.png",
		fileName: "plane.png",
		mimeType: "image/png",
	},
	{
		id: "wood_wall",
		name: "Деревянная стена",
		type: "image",
		url: "/templates/wood_wall.png",
		fileName: "wood_wall.png",
		mimeType: "image/png",
	},
	{
		id: "instrumental",
		name: "Инструментальная композиция",
		type: "audio",
		url: "/templates/instrumental.wav",
		fileName: "instrumental.wav",
		mimeType: "audio/wav",
	},
	{
		id: "men_voice",
		name: "Мужской голос",
		type: "audio",
		url: "/templates/men_voice.wav",
		fileName: "men_voice.wav",
		mimeType: "audio/wav",
	},
	{
		id: "woman_voice",
		name: "Женский голос",
		type: "audio",
		url: "/templates/woman_voice.wav",
		fileName: "woman_voice.wav",
		mimeType: "audio/wav",
	},
	{
		id: "sine_1khz_10s",
		name: "Синусоида",
		type: "audio",
		url: "/templates/sine_1khz_10s.wav",
		fileName: "sine_1khz_10s.wav",
		mimeType: "audio/wav",
	},
	{
		id: "silence",
		name: "Тишина",
		type: "audio",
		url: "/templates/silence.wav",
		fileName: "silence.wav",
		mimeType: "audio/wav",
	},
];

interface TemplatePanelProps {
	onTemplateSelect: (file: File) => void;
	className?: string;
}

export const TemplatePanel: React.FC<TemplatePanelProps> = ({
	onTemplateSelect,
}) => {
	const [loadingId, setLoadingId] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [imagePreviews, setImagePreviews] = useState<Record<string, string>>(
		{},
	);

	// Загружаем превью для изображений при монтировании компонента
	useEffect(() => {
		const loadPreviews = async () => {
			const previews: Record<string, string> = {};

			for (const template of TEMPLATES) {
				if (template.type === "image") {
					try {
						const response = await fetch(template.url);
						const blob = await response.blob();
						const objectUrl = URL.createObjectURL(blob);
						previews[template.id] = objectUrl;
					} catch (err) {
						console.error(
							`Не удалось загрузить превью для ${template.id}:`,
							err,
						);
					}
				}
			}

			setImagePreviews(previews);
		};

		loadPreviews();

		// Очистка object URLs при размонтировании
		return () => {
			Object.values(imagePreviews).forEach((url) => {
				URL.revokeObjectURL(url);
			});
		};
	}, []);

	const handleTemplateClick = async (template: FileTemplate) => {
		setLoadingId(template.id);
		setError(null);

		try {
			const file = await urlToFile(
				template.url,
				template.fileName,
				template.mimeType,
			);
			onTemplateSelect(file);
		} catch (err) {
			console.error("Ошибка при загрузке шаблона:", err);
			setError(
				"Не удалось загрузить шаблон. Выберите другой шаблон или загрузите собственый файл.",
			);
		} finally {
			setLoadingId(null);
		}
	};

	return (
		<div
			className={`p-1.5
		bg-gray-50 rounded-lg border border-gray-200`}>
			{error && (
				<div
					className={`mb-2 p-2 text-sm text-red-600 bg-red-50 
							rounded border border-red-200`}>
					{error}
				</div>
			)}

			<div className="flex gap-1 overflow-y-auto">
				{TEMPLATES.map((template, i) => (
					<TemplateButton
						key={i}
						template={template}
						loadingId={loadingId}
						previewUrl={imagePreviews[template.id]}
						handleTemplateClick={handleTemplateClick}
					/>
				))}
			</div>
		</div>
	);
};

interface TemplateButtonProps {
	template: FileTemplate;
	loadingId: string | null;
	previewUrl: string;
	handleTemplateClick: (template: FileTemplate) => void;
	className?: string;
}

function TemplateButton({
	template,
	loadingId,
	previewUrl,
	handleTemplateClick,
	className,
}: TemplateButtonProps) {
	const isLoading = loadingId === template.id;

	return (
		<div className={className}>
			<button
				key={template.id}
				title={template.name}
				onClick={() => handleTemplateClick(template)}
				disabled={!!loadingId}
				className={`
		            flex flex-col items-center justify-between
								min-w-18 p-1 aspect-3/4
		            transition-all duration-200
								text-sm rounded-md border
		            ${
									isLoading
										? "bg-gray-100 border-gray-300 text-gray-400 cursor-wait"
										: "bg-white border-gray-300 hover:border-light-blue hover:shadow-md text-gray-700 cursor-pointer"
								}
		          `}>
				<Thumbnail
					type={template.type}
					name={template.name}
					previewUrl={previewUrl}
				/>
				<span className="font-medium truncate w-16 text-center">
					{template.name}
				</span>

				{isLoading && (
					<span className="text-xs text-blue-600 mt-1 animate-pulse">
						Загрузка...
					</span>
				)}
			</button>
		</div>
	);
}

interface ThumbnailProps {
	name: string;
	type: string;
	previewUrl?: string;
	className?: string;
}

function Thumbnail({ type, name, previewUrl, className }: ThumbnailProps) {
	return (
		<div className={twMerge("flex-1 flex items-center", className)}>
			{type === "image" && previewUrl ? (
				<img
					src={previewUrl}
					alt={name}
					className="w-16 h-16 object-cover rounded-md border border-gray-200"
					loading="lazy"
				/>
			) : (
				<span className="text-3xl">{type === "image" ? "🖼️" : "🎵"}</span>
			)}
		</div>
	);
}
