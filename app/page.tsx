"use client";

import { Includes } from "@/features/home/ui/includes";
import { Intro } from "@/features/home/ui/intro";
import { Improvements } from "@/features/home/ui/improvements";
import { Header } from "@/shared/ui/kit/header";
import { Footer } from "@/shared/ui/kit/footer";

export default function HomePage() {
	return (
		<div className={`flex flex-col min-h-screen`}>
			<Header className={`mb-0`} />
			<main className="flex flex-col gap-15 flex-1 px-5 md:px-8">
				<Intro className={`-mx-5 md:-mx-8`} />
				<Improvements />
				<Includes />
			</main>
			<Footer />
		</div>
	);
}
