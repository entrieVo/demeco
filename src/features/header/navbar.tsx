import { Menu, Home, ImagePlay } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Card } from "../../shared/ui/kit/card";
import { IconLink } from "./icon-link";

export function Navbar({ page }: { page: "main" | "audioImage" }) {
	const [isHovered, setIsHovered] = useState(false);
	const [isNavOpen, setIsNavOpen] = useState<boolean>(false);

	const PAGES = {
		main: { icon: Home, href: "/", name: "Главная" },
		audioImage: {
			icon: ImagePlay,
			href: "/comparison",
			name: "Аудио / фото",
		},
	};

	const Icon = isHovered ? Menu : PAGES[page].icon;

	const dropdownRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!isNavOpen) return;

		const handleClickOutside = (event: MouseEvent) => {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsNavOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [isNavOpen]);

	return (
		<div ref={dropdownRef} className="relative">
			<IconLink
				Icon={Icon}
				pageName={PAGES[page].name}
				onClick={() => setIsNavOpen(!isNavOpen)}
				onMouseEnter={() => setIsHovered(true)}
				onMouseLeave={() => setIsHovered(false)}
			/>

			{isNavOpen && (
				<nav className="absolute -top-3 left-0 z-100">
					<Card className="bg-accent rounded-xl py-2 pl-2 pr-6 flex gap-(--card-gap)">
						{Object.entries(PAGES)
							.filter((p) => p[0] != page)
							.map(([key, { icon, name, href }]) => (
								<IconLink key={key} Icon={icon} pageName={name} href={href} />
							))}
					</Card>
				</nav>
			)}
		</div>
	);
}
