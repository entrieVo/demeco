import { Title } from "@/shared/ui/kit/title";

interface FileInfoProps {
	info: Record<string, string>;
	className?: string;
	style?: Record<string, string>;
}

export function FileInfo({ info, className, style }: FileInfoProps) {
	return (
		<div className={className} style={style}>
			<div>
				<Title>Предпросмотр файла</Title>
				{Object.entries(info).map(([title, text], i) => (
					<FileInfoItem key={i} title={title} text={text} />
				))}
			</div>
		</div>
	);
}

interface FileInfoItemProps {
	title: string;
	text: string;
	className?: string;
}

function FileInfoItem({ title, text, className }: FileInfoItemProps) {
	return (
		<div className={className}>
			<p>
				<span className={`font-semibold text-blue mr-3`}>{title}:</span>
				{text}
			</p>
		</div>
	);
}
