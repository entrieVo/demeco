"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import { twMerge } from "tailwind-merge";
import Link from "next/link";
import { memo, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

interface HeaderProps {
	className?: string;
}

export const Header = memo(function Header({ className }: HeaderProps) {
	const router = useRouter();
	const pathname = usePathname();
	const [isMenuOpen, setIsMenuOpen] = useState(false);
	const menuRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const handleDemoClick = (e: React.MouseEvent) => {
		if (pathname === "/demo") {
			e.preventDefault();
			router.push(`/demo?refresh=${Date.now()}`);
		}
	};

	return (
		<header
			className={twMerge(
				`sticky top-0 z-1000 mb-8
				bg-background border-b-2 border-b-soft-gray px-5 py-3
				flex items-center justify-between`,
				className,
			)}>
			<Link href="/" className="flex gap-1 items-center">
				<Image src="/logo.png" alt="logo" width={32} height={32} />
				<div className={`font-bold text-blue text-2xl`}>Demeco</div>
			</Link>

			<div className={`relative`}>
				<div
					ref={menuRef}
					className={
						[
							`hidden md:flex gap-8
							font-semibold text-sm`,
							`absolute top-11 -right-3 bg-background shadow-xl
							flex flex-col gap-2 p-3 rounded-xl items-center`,
						][+isMenuOpen]
					}>
					<Link href={"/methods"}>Методология</Link>
					<Link href={"/results"}>Результаты</Link>
					<Link href="/demo" onClick={handleDemoClick}>
						Демо
					</Link>
					<Link href="/about">О проекте</Link>
				</div>

				<button
					onClick={() => setIsMenuOpen(!isMenuOpen)}
					className="md:hidden">
					<Menu size={20} />
				</button>
			</div>
		</header>
	);
});
