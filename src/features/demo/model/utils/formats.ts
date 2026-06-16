import { FILE_FORMATS } from "./types";

export function whichFormat(fileInfo: string): string {
	const [fileType, fileFormat] = fileInfo.split("/");
	if (FILE_FORMATS[fileType].includes(fileFormat)) return fileType;
	throw new Error("Incorrect file type.");
}
