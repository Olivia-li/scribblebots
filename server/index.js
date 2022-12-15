import * as dotenv from 'dotenv' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import express from 'express';
import bodyParser from 'body-parser'
import Replicate from 'replicate-js';

const app = express();
const port = process.env.PORT || 3001;

const replicate = new Replicate({token: process.env.REPLICATE_API_KEY });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/predict", async (req, res) => {
  const prompt = req.body.prompt;
  const model = await replicate.models.get("stability-ai/stable-diffusion");
  const result = await model.predict({ prompt: getPrompt(prompt)});
  res.json({ url: await removeBackground(result[0]) });
});

async function removeBackground(url) {
  const model = await replicate.models.get("cjwbw/rembg");
  const result = await model.predict({ image: url});
  return result
}

function getPrompt(prompt) {
  return `Tiny cute 3D low poly clay model ${prompt}, soft smooth lighting, soft colors, pastel color background, center long shot, 100mm lens, 3d blender render, polycount, modular constructivism, physically based rendering, high definition quality, at 4:5, 8k.`
}

app.post('/api/world', (req, res) => {
  console.log(req.body);
  res.send(
    `I received your POST request. This is what you sent me: ${req.body.post}`,
  );
});

app.listen(port, () => console.log(`Listening on port ${port}`));