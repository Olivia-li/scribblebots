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
    setLoading(false)
    setImages([...images, result.data.url])
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
