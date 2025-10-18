require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set in the environment variables.");
}
const genAI = new GoogleGenerativeAI(apiKey);

// List of possible items for random assignment
const craftMaterials = [
  "ペットボトル",
  "段ボール",
  "牛乳パック",
  "新聞紙",
  "アルミ缶",
  "トイレットペーパーの芯",
  "輪ゴム",
  "布の切れ端"
];

app.post('/api/generate-craft-ideas', async (req, res) => {
  const { imageCount } = req.body;

  if (!imageCount || typeof imageCount !== 'number' || imageCount <= 0) {
    return res.status(400).send('Invalid request: imageCount must be a positive number.');
  }

  // Assign random labels
  const assignedLabels = [];
  for (let i = 0; i < imageCount; i++) {
    const randomIndex = Math.floor(Math.random() * craftMaterials.length);
    assignedLabels.push(craftMaterials[randomIndex]);
  }

  const uniqueLabels = [...new Set(assignedLabels)];

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

    const prompt = `以下の材料を使って工作できるメニューを考えてください: ${uniqueLabels.join('、')}

以下の形式で回答してください:

メニュー名: [ここにメニュー名]
制作手順:
1. [手順1]
2. [手順2]
3. [手順3]...
所要時間: [ここに時間]
難易度: [ここに難易度]
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the text response into a structured object
    const lines = text.split('\n');
    const craftIdea = {
      menuName: lines.find(line => line.startsWith('メニュー名:'))?.replace('メニュー名: ', '') || '',
      steps: lines.filter(line => line.match(/^\d+\./)).join('\n'),
      time: lines.find(line => line.startsWith('所要時間:'))?.replace('所要時間: ', '') || '',
      difficulty: lines.find(line => line.startsWith('難易度:'))?.replace('難易度: ', '') || '',
      materials: uniqueLabels
    };

    res.json(craftIdea);

  } catch (error) {
    console.error('Error calling Gemini API:', error);
    res.status(500).send('Error generating craft ideas.');
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});