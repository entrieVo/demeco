import { cn } from "@/shared/lib/css";

interface ProgressInfoProps {
	title: string;
	list: Record<string, string[]>;
	className?: string;
}

export function ProgressInfo({ title, list, className }: ProgressInfoProps) {
	return (
		<div className={cn("hyphens-auto", className)}>
			<p className="inline-block mb-2 leohand text-[1.3em]/4.5">{title}</p>
			<ul className="list-disc ml-4">
				{Object.entries(list).map(([topic, items], i) => (
					<li key={i}>
						{topic}
						<ul className="list-[circle] ml-4">
							{items.map((item, k) => (
								<li key={i * 10 + k}>{item}</li>
							))}
						</ul>
					</li>
				))}
			</ul>
		</div>
	);
}
