import * as dotenv from "dotenv" // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config()
import express from "express"
import bodyParser from "body-parser"
import { server as webSocketServer } from "websocket"
import http from "http"
import _ from "lodash"
import fetch from "node-fetch";

const app = express()
const port = process.env.PORT || 3001
const clients = new Set()

const DIFFUSION_API = "http://141.134.130.200:38333";

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
        if (count % 500) {
          client.sendUTF(message.utf8Data)
        }
        count += 1
      }
    }
  })

  // user disconnected
  connection.on("close", function (connection) {
    console.log(new Date() + " Peer disconnected.")
  })
})

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.post("/predict", async (req, res) => {
  const prompt = getPrompt(req.body.prompt);
  let resultFound = false;
  let count = 0;
  while(!resultFound) {
    if(count > 16){
      res.status(500).json({"error": "Couldn't generate image from prompt"});
      return;
    }
    // TODO(Zain): investigate session hash, and fn_index values.
    const result = await fetch(`${DIFFUSION_API}/run/predict/`, {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,ta;q=0.8",
        "content-type": "application/json",
        "Referer": `${DIFFUSION_API}/`,
        "Referrer-Policy": "strict-origin-when-cross-origin"
      },
      "body": `{\"fn_index\":51,\"data\":[\"${prompt}\",\"\",\"None\",\"None\",20,\"Euler a\",false,false,1,1,7,-1,-1,0,0,0,false,512,512,false,0.7,0,0,\"None\",false,false,false,\"\",\"Seed\",\"\",\"Nothing\",\"\",true,false,false,null,\"\",\"\"],\"session_hash\":\"xxp6z1hvm7\"}`,
      "method": "POST"
    });
    const resultJson = await result.json();
    const name = resultJson.data && resultJson.data[0] && resultJson.data[0] && resultJson.data[0][0] && resultJson.data[0][0]["name"];
    
    if(name){
      res.json({ url: await removeBackground(`${DIFFUSION_API}/file=${name}`) });
      resultFound = true;
    }
    await new Promise(r => setTimeout(r, 250));
    count++;
  }
});

async function removeBackground(url) {
  const options = { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({image: url}) };
  const API_ENDPOINT = 'http://127.0.0.1:4999/predict';
  const response = await fetch(API_ENDPOINT, options).catch(err => console.log(err));
  const data = await response.text();
  return data
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
