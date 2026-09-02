import type { ScoresBreakdown } from "@/types/aiprep";

const label = (value: string) => value.split("_").map((part) => part.charAt(0) + part.slice(1)).join(" ");

export function ScoreBreakdown({ scores }: { scores: ScoresBreakdown }) {
  const dimensions = Object.entries(scores).filter((entry): entry is [string, NonNullable<ScoresBreakdown[string]>] => entry[1] !== undefined);
  return <section className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"><h2 className="text-lg font-bold text-gray-900 dark:text-white">Score breakdown</h2>{dimensions.length === 0 ? <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Score breakdown is not available for this assessment.</p> : <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{dimensions.map(([name, dimension]) => <article key={name} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label(name)}</p><p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{dimension.score}</p>{Object.keys(dimension.sub_scores).length > 0 && <dl className="mt-3 space-y-1 border-t border-gray-100 pt-3 text-xs dark:border-gray-800">{Object.entries(dimension.sub_scores).map(([key, value]) => <div key={key} className="flex justify-between gap-3"><dt className="text-gray-500">{label(key)}</dt><dd className="font-semibold text-gray-800 dark:text-gray-200">{value}</dd></div>)}</dl>}</article>)}</div>}</section>;
}
