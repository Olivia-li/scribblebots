import * as dotenv from "dotenv" // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import express from "express"
import bodyParser from "body-parser"
import Replicate from "replicate-js"
import { server as webSocketServer } from "websocket"
import http from "http"
import _ from "lodash"

const app = express()
const port = process.env.PORT || 3001
const clients = new Set()

const replicate = new Replicate({ token: process.env.REPLICATE_API_KEY })

// Spinning the http server and the websocket server.
const server = http.createServer()
server.listen(8000)
const wsServer = new webSocketServer({
  httpServer: server,
})

wsServer.on("request", function (request) {
  const connection = request.accept(null, request.origin)
  clients.add(connection)
  let count = 0
  connection.on("message", function (message) {
    if (message.type === "utf8") {
      for (const client of clients) {
        if (count % 300) {
          client.sendUTF(message.utf8Data)
        }
        count += 1
      }
    }
  })

  // user disconnected
  connection.on("close", function (connection) {
    console.log(new Date() + " Peer disconnected.")
    console.log(JSON.stringify(connection))
  })
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post("/predict", async (req, res) => {
  const prompt = req.body.prompt
  const model = await replicate.models.get("stability-ai/stable-diffusion")
  const result = await model.predict({ prompt: getPrompt(prompt), width: 384, height: 384 })
  res.json({ url: await result[0] })
})

async function removeBackground(url) {
  const model = await replicate.models.get("cjwbw/rembg")
  const result = await model.predict({ image: url })
  return result
}

function getPrompt(prompt) {
  return `Tiny cute 3D low poly clay model ${prompt}, soft smooth lighting, soft colors, pastel color background, center long shot, 100mm lens, 3d blender render, polycount, modular constructivism, physically based rendering, high definition quality, at 4:5, 8k.`
}

/*
app.post("/askgpt", async (req, res) => {
  const API_KEY = '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';
  const API_ENDPOINT = 'https://api.openai.com/v1/completions';
  
  const prompt = 'The quick brown fox jumps over the lazy dog.';
  
  const data = {
    prompt: prompt,
    model: 'text-davinci-002',
    max_tokens: 100,
    temperature: 0.1,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  };
  
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(data),
  };
  
  fetch(API_ENDPOINT, options)
    .then(response => response.json())
    .then(response => {
      console.log(response);
    });
  
});
*/

app.post("/api/world", (req, res) => {
  console.log(req.body)
  res.send(`I received your POST request. This is what you sent me: ${req.body.post}`)
})

app.listen(port, () => console.log(`Listening on port ${port}`))
