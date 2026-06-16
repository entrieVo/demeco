import { ImagePlay } from "lucide-react";
import { useRef } from "react";
import { STRING_FORMATS } from "../model/utils/types";
import { whichFormat } from "../model/utils/formats";

interface UploadButtonProps {
	setFile: (file: File) => void;
	className?: string;
}

export function UploadButton({ setFile, className }: UploadButtonProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files) return;
		const newFile = Array.from(e.target.files)[0];

		try {
			whichFormat(newFile.type);
			setFile(newFile);
		} catch {
			alert("Ошибка: Можно загружать только файлы форматов .png и .wav");
			e.target.value = "";
			return;
		}
	};

	return (
		<div className={className}>
			<button
				className={`flex flex-col gap-2 items-center justify-center size-full py-2
				bg-smoky-blue border-2 border-light-blue rounded-sm
				text-blue font-bold cursor-pointer`}
				onClick={() => inputRef.current?.click()}>
				Загрузить файл (WAV / PNG)
				<ImagePlay className={`size-15`} strokeWidth={1} />
			</button>

			<input
				type="file"
				className="hidden"
				accept={STRING_FORMATS}
				ref={inputRef}
				onChange={handleUpload}
				multiple
			/>
		</div>
	);
}
