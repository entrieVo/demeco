"use client";

import { useEffect, useRef, useState } from "react";
import { FILE_TYPES } from "@/features/constants";
import { Image, Play, SquarePlay } from "lucide-react";
import { cn } from "@/shared/lib/css";

interface FileUploaderProps {
	fileType: keyof typeof FILE_TYPES;
	onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
	className?: string;
}

export function FileUploader({
	fileType,
	onUpload,
	className,
}: FileUploaderProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const { FORMAT, LABEL } = FILE_TYPES[fileType];
	const Icon = {
		IMAGE: Image,
		AUDIO: Play,
		VIDEO: SquarePlay,
	}[fileType];

	return (
		<>
			<button
				onClick={() => {
					inputRef.current?.click();
				}}
				className={cn(
					"flex items-center cursor-pointer \
					md:w-60 md:flex-col md:gap-6\
					lg:w-100 xl:px-8 xl:flex-row",
					className
				)}>
				<div
					className="size-8 flex-none bg-background rounded-full
				flex items-center justify-center mr-5
				md:m-0
				lg:size-10 lg:text-xl">
					<Icon size={"1.2em"} strokeWidth={1.9} color="var(--primary)" />
				</div>
				<p className="text-center sm:text-lg lg:text-2xl">
					Нажмите для загрузки {LABEL}
				</p>
			</button>
			<input
				type="file"
				accept={FORMAT}
				className="hidden"
				ref={inputRef}
				onChange={onUpload}
			/>
			{/* TODO Drag & Drop */}
		</>
	);
}
