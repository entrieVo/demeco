import Button from "@/shared/ui/kit/button";
import Image from "next/image";

interface HomeShowcaseProps {
	label?: React.ReactNode;
	title: string;
	description: string;
	buttons?: {
		icon: React.ReactNode;
		label: string;
		// onClick: React.MouseEvent<HTMLButtonElement>;
	}[];
	className?: string;
}

export default function HomeShowcase({
	label,
	title,
	description,
	buttons,
	className,
}: HomeShowcaseProps) {
	return (
		<div className={className}>
			<div
				className={`px-5 py-8 md:px-8
				bg-smoky-blue border-b-2 border-b-soft-gray`}>
				{label && label}
				<div className={`flex mb-8`}>
					<div className={`md:flex-1`}>
						<h1 className={`text-2xl font-bold mb-3 max-w-115`}>{title}</h1>
						<div className={`text-gray-600`}>{description}</div>
					</div>
					<p
						className={`hidden md:block
						flex-1 relative min-h-0 overflow-hidden ml-9`}>
						<Image
							src="/logo.png"
							alt="Описание"
							sizes="100vw"
							fill
							className={`object-contain`}
						/>
					</p>
				</div>
				<div className={`flex flex-col gap-2 md:flex-row`}>
					{buttons &&
						buttons.map(({ icon, label /* , onClick */ }, i) => {
							return (
								<Button
									icon={icon}
									label={label}
									key={i}
									onClick={() => console.log(`${label} stub`)}
								/>
							);
						})}
				</div>
			</div>
		</div>
	);
}
