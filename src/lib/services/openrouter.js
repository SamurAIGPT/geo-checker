import config from "../config";

async function postJson(url, body, headers = {}) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const err = new Error(`OpenRouter request failed: ${res.status} ${res.statusText} - ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

/**
 * generateViaOpenRouter
 * - systemPrompt: string
 * - prompt: string
 * - options: { model, temperature }
 *
 * Retorna: { text, raw, usage? }
 */
export async function generateViaOpenRouter(systemPrompt, prompt, options = {}) {
  const apiKey = config.ai.apiKey;
  if (!apiKey) throw new Error("OpenRouter API key not configured");

  const baseUrl = config.ai.openrouterUrl.replace(/\/$/, "");
  // Usamos o endpoint /v1/chat/completions para compatibilidade (ajuste se necessário)
  const endpoint = `${baseUrl}/v1/chat/completions`;

  const body = {
    model: options.model || "gpt-4o-mini",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: prompt }
    ],
    temperature: typeof options.temperature === "number" ? options.temperature : 1
  };

  const resJson = await postJson(endpoint, body, {
    Authorization: `Bearer ${apiKey}`
  });

  // Extrair texto de forma segura
  let text = "";
  if (resJson.choices && resJson.choices[0]) {
    const msg = resJson.choices[0].message || resJson.choices[0];
    text = msg.content || msg.text || JSON.stringify(msg);
  } else if (resJson.output) {
    text = typeof resJson.output === "string" ? resJson.output : JSON.stringify(resJson.output);
  }

  return { text, raw: resJson, usage: resJson.usage || null };
}
