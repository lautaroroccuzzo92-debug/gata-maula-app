export const config = {
  api: { bodyParser: { sizeLimit: '20mb' } },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(400).json({ error: 'API key requerida' });
    const { imageBase64, mediaType, prompt } = req.body;
    const buffer = Buffer.from(imageBase64, 'base64');
    const finalBase64 = buffer.toString('base64');
    const finalMediaType = mediaType === 'application/pdf' ? 'application/pdf' : 'image/jpeg';
    const body = {
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: [
        { type: mediaType === 'application/pdf' ? 'document' : 'image',
          source: { type: 'base64', media_type: finalMediaType, data: finalBase64 } },
        { type: 'text', text: prompt }
      ]}]
    };
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
