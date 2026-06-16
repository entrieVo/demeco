import { useState } from "react";

interface useFileReturn {
	file: File | null;
	setFile: (file: File) => void;
}

export function useFile(): useFileReturn {
	const [file, setFile] = useState<File | null>(null);

	return { file, setFile };
}
