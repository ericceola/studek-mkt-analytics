import { env } from '../config.js';

const base = 'https://api.apify.com/v2';
async function apify(path: string, init?: RequestInit) {
  if (!env.APIFY_TOKEN) throw new Error('APIFY_TOKEN não configurado.');
  const separator = path.includes('?') ? '&' : '?';
  const response = await fetch(`${base}${path}${separator}token=${encodeURIComponent(env.APIFY_TOKEN)}`, {
    ...init, headers: { 'content-type': 'application/json', ...init?.headers }
  });
  if (!response.ok) throw new Error(`Apify respondeu ${response.status}: ${await response.text()}`);
  return response.json();
}
export async function startActor(username: string, type: string, limit: number, newerThan: string) {
  const resultType = type === 'profile_details' ? 'details' : type === 'stories' ? 'stories' : 'posts';
  const payload = { directUrls: [`https://www.instagram.com/${username}/`], resultsType: resultType,
    resultsLimit: type === 'profile_details' ? 1 : limit,
    ...(type === 'profile_details' ? { addProfileStatistics: true } : type === 'stories' ? { addParentData: true } : { onlyPostsNewerThan: newerThan, addParentData: true }) };
  const actor = env.APIFY_ACTOR_ID.replace('/', '~');
  const response = await apify(`/acts/${actor}/runs`, { method: 'POST', body: JSON.stringify(payload) });
  return { runId: response.data.id as string, datasetId: response.data.defaultDatasetId as string, payload };
}
export async function getRun(runId: string) { return (await apify(`/actor-runs/${runId}`)).data; }
export async function abortRun(runId: string) { return (await apify(`/actor-runs/${runId}/abort`, { method: 'POST' })).data; }
export async function getDataset(datasetId: string) { return (await apify(`/datasets/${datasetId}/items?clean=true&format=json`)) as Record<string, unknown>[]; }
