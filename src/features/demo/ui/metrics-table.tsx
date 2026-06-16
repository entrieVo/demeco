import { twMerge } from "tailwind-merge";
import {
	DENOISE_TYPES,
	DenoiseType,
	FileType,
	METRICS_TYPES,
} from "../model/utils/types";
import { Metrics } from "../model/utils/metrics";

interface MetricsTableProps {
	type: FileType;
	metrics: Record<DenoiseType, Metrics>;
	className?: string;
}

export function MetricsTable({ metrics, type, className }: MetricsTableProps) {
	const metricsInfo = METRICS_TYPES[type];

	return (
		<table
			className={twMerge(
				`border border-gray-400
				[&_th,&_td]:border [&_th,&_td]:border-gray-400
				[&_td]:px-1`,
				className,
			)}>
			<caption>Таблица результатов</caption>

			<thead>
				<tr>
					<th>Фильтр</th>
					{Object.keys(metricsInfo).map((m, i) => (
						<th key={i} className={`uppercase`}>
							{String.fromCodePoint(0x0394) + m}
						</th>
					))}
				</tr>
			</thead>

			<tbody>
				{Object.entries(DENOISE_TYPES).map(([denoiseType, denoiseName], i) => (
					<tr key={i} className={`text-left`}>
						<td>{denoiseName}</td>
						{Object.keys(metricsInfo).map((m, k) => {
							const value = metrics[denoiseType as DenoiseType].improvement[m];
							return (
								<td key={k} className={`text-right`}>
									{`${value < 0 ? "" : "+"}${value.toFixed(3)} ${metricsInfo[m]}`}
								</td>
							);
						})}
					</tr>
				))}
			</tbody>
		</table>
	);
}
