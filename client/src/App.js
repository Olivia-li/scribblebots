import React, { useEffect } from "react"
import axios from 'axios'
import "animate.css"
import { w3cwebsocket as W3CWebSocket } from "websocket";

const client = new W3CWebSocket('ws://localhost:8000');

const App = () => {
  const [images, setImages] = React.useState([])
  const [imagePosition, setImagePosition] = React.useState({ x: 0, y: 0 })
  const [loading, setLoading] = React.useState(false)

  useEffect(() => {
    client.onopen = () => {
      console.log('WebSocket Client Connected');
    };
    client.onmessage = (message) => {
      const dataFromServer = JSON.parse(message.data);
      console.log(dataFromServer);
    };
  })

  async function handleSubmit(e) {
    e.preventDefault()
    const prompt = e.target.prompt.value
    setLoading(true)
    const result = await axios.post("predict", { prompt: prompt })
    if (result.data?.person?.includes("yes")) {
      setImagePosition({ x: personPosition.x, y: personPosition.y })
    }
    console.log("before askGpt call")
    const generated_reply = askGpt();
    console.log("genereated reply: ", generated_reply)
    setLoading(false)
    setImages([...images, result.data.url])
  }

  async function askGpt() {
    console.log("inside askGpt")

    const API_KEY = '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';
    const API_ENDPOINT = 'https://api.openai.com/v1/completions';
    
    const prompt = 'Is a cat an animal? Respond with yes and no.';
    
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
    
    // Use the await keyword to wait for the fetch to complete.
    const response = await fetch(API_ENDPOINT, options);
    // Parse the response as JSON.
    const jsonResponse = await response.json();
    // Get the first choice from the response.
    const choice = jsonResponse.choices[0];
    // Get the completed text from the choice.
    const completedText = choice.text;

    // Return the completed text.
    return completedText;
  }

  const personPosition = {
    y: 0,
    x: 1500,
  }

  const catPosition = {
    y: 725,
    x: 500,
  }

  const treePosition = {
    y: 0,
    x: 300,
  }

  function renderImages() {
    return images.map((url, idx) => {
      return (
        <img
          key={idx}
          src={url}
          style={{left: `${imagePosition.x}px`, bottom: `${imagePosition.y}px`}}
          className="absolute fall-from-top animate__animated animate__bounce w-[300px] h-[300px]"
        />
      )
    })
  }

  return (
    <div
      style={{
        backgroundImage: "url('')",
      }}
      className="bg-sky-100 w-screen min-h-screen bg-no-repeat bg-cover bg-center"
    >
      <form onSubmit={handleSubmit} className="absolute m-2">
        <input required name="prompt" className="p-3 bg-white border-2 border-gray-500 rounded" type="text" />
        {loading && <p>Loading...</p>}
      </form>
      {images.length > 0 && renderImages()}
      <img
        style={{ left: `${catPosition.x}px`, bottom: `${catPosition.y}px` }}
        src="https://dreamweaver-sd.s3.amazonaws.com/scribblenauts/cat.png"
        className="absolute w-[120px] h-[120px]"
      />
      <img
        style={{ left: `${treePosition.x}px`, bottom: `${treePosition.y}px` }}
        src="https://dreamweaver-sd.s3.amazonaws.com/scribblenauts/tree.png"
        className="absolute h-[750px]"
      />
      <img
        style={{ left: `${personPosition.x}px`, bottom: `${personPosition.y}px` }}
        src="https://dreamweaver-sd.s3.amazonaws.com/scribblenauts/figure.png"
        className={`absolute`}
      />
    </div>
  )
}

export default App
