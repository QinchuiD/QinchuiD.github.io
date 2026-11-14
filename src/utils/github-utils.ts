import snapshot from "../data/github-activity.json";

type Contribution = {
	date: string;
	count: number;
	level: number;
};

function isContribution(value: unknown): value is Contribution {
	if (!value || typeof value !== "object") return false;
	const item = value as Record<string, unknown>;
	return (
		typeof item.date === "string" &&
		/^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
		typeof item.count === "number" &&
		Number.isInteger(item.count) &&
		item.count >= 0 &&
		typeof item.level === "number" &&
		Number.isInteger(item.level) &&
		item.level >= 0 &&
		item.level <= 4
	);
}

export async function getGitHubActivity(username: string) {
	let contributions: Contribution[] = [];
	let fetchedAt = "";
	try {
		const response = await fetch(
			`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`,
			{ signal: AbortSignal.timeout(6000) },
		);
		if (response.ok) {
			const data = (await response.json()) as {
				contributions?: unknown[];
			};
			contributions = (data.contributions || []).filter(isContribution);
			fetchedAt = new Date().toISOString();
		}
	} catch {
		// A saved public snapshot keeps builds independent of the API being online.
	}
	if (
		!contributions.length &&
		snapshot.username.toLowerCase() === username.toLowerCase()
	) {
		contributions = snapshot.contributions.filter(isContribution);
		fetchedAt = snapshot.fetchedAt;
	}
	contributions.sort((a, b) => a.date.localeCompare(b.date));
	return { contributions, fetchedAt };
}
