// Объявления для импорта CSS-файлов
declare module "*.css" {
	const content: string;
	export default content;
}

// Объявление для side-effect импортов (без присваивания переменной)
declare module "katex/dist/katex.min.css" {}
