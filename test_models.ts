import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function getModels() {
  const apiKey = process.env.FIREWORKS_API_KEY;
  if (!apiKey) {
    console.error("NO FIREWORKS_API_KEY");
    return;
  }
  const res = await fetch("https://api.fireworks.ai/inference/v1/models", {
    headers: {
      Authorization: `Bearer ${apiKey}`
    }
  });
  if (!res.ok) {
    console.error(res.status, await res.text());
    return;
  }
  const data = await res.json();
  console.log(data.data.map((m: any) => m.id).filter((id: string) => id.includes("gemma") || id.includes("llama")));
}
getModels();
