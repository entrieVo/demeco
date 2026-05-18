"use client";

import Image from "next/image";
import { Menu } from "lucide-react";
import clsx from "clsx";

interface HeaderProps {
	className?: string;
}

export function Header({ className }: HeaderProps) {
	return (
		<header
			className={clsx(
				`sticky top-0 z-1000
				bg-background border-b-2 border-b-soft-gray px-5 py-3
				flex items-center justify-between`,
				className,
			)}>
			<div className="flex gap-1 items-center">
				<Image src="/logo.png" alt="logo" width={32} height={32} />
				<div className={`font-bold text-blue text-2xl`}>Demeco</div>
			</div>

			<button onClick={() => console.log("Menu stub")} className="md:hidden">
				<Menu size={20} />
			</button>
			<div
				className={`hidden md:flex gap-8
				font-semibold text-sm`}>
				<button>Демо</button>
				<button>Результаты</button>
				<button>О проекте</button>
				<button>Методология</button>
			</div>
		</header>
	);
}
