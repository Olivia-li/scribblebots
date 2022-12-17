import React, { useEffect, useRef } from "react"
import axios from "axios"
import "animate.css"
import { w3cwebsocket as W3CWebSocket } from "websocket"

const client = new W3CWebSocket("ws://192.168.131.78:8000")

const App = () => {
  const [image, setImage] = React.useState([])
  const [imagePosition, setImagePosition] = React.useState({ x: 0, y: 0 })
  const [loading, setLoading] = React.useState(false)
  const [gameResults, setGameResults] = React.useState({ gameEnded: false, playerWon: false })
  const [wristPosition, setWristPosition] = React.useState({ lx: 0, ly: 0, rx: 0, ry: 0 })
  const canvasRef = useRef(null)

  const NORM_FACTOR = 1

  useEffect(() => {
    client.onopen = () => {
      console.log("WebSocket Client Connected")
    }
    client.onmessage = (message) => {
      const dataFromServer = JSON.parse(message.data)
      setWristPosition({
        lx: dataFromServer.lx * NORM_FACTOR,
        ly: dataFromServer.ly * NORM_FACTOR,
        rx: dataFromServer.rx * NORM_FACTOR,
        ry: dataFromServer.ry * NORM_FACTOR,
      })
      console.log(dataFromServer)
    }
  }, [])

  const draw = (ctx) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    ctx.fillStyle = "orange"
    ctx.beginPath()
    ctx.fillRect(wristPosition.ly * ctx.canvas.width, ctx.canvas.height - wristPosition.lx * ctx.canvas.height, 5, 5)
    ctx.fill()
    ctx.fillRect(wristPosition.ry * ctx.canvas.width, ctx.canvas.height - wristPosition.rx * ctx.canvas.height, 5, 5)
    ctx.fill()
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    let animationFrameId

    //Our draw came here
    const render = () => {
      draw(context)
      animationFrameId = window.requestAnimationFrame(render)
    }

    render()

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [draw])

  async function handleSubmit(e) {
    e.preventDefault()
    const prompt = e.target.prompt.value
    setLoading(true)
    const result = await axios.post("predict", { prompt: prompt })
    if (result.data?.person?.includes("yes")) {
      setImagePosition({ x: personPosition.x, y: personPosition.y })
    }
    console.log("before askGpt call")
    const generated_reply = askGpt(prompt)
    // console.log("genereated reply: ", generated_reply)

    // ========== You win or lose? =================
    const endCase = await categorizeGeneratedObject(prompt)
    // console.log("endCase: ", endCase)
    setGameResults(getGameResult(endCase))
    // console.log("updated gameResults: ", gameResults.gameEnded)
    // ============================================

    setLoading(false)
    setImage([result.data.url])
  }

  // useEffect(() => {
  //   console.log("updated gameResults: ", gameResults.gameEnded)
  // }, [gameResults])

  // ======================= Object interaction =======================
  // =================================================================
  let EndCase = {
    CatGoesDown: 1,
    CatFliesDown: 1,
    CatFliesUp: 0,
    TreeTakesFire: 0,
    TreeCutDown: 1,
    Other: -1,
  }
  async function isGPTResponseAffirmative(response) {
    // response: string
    // return: Boolean
    // Returns True or False based on GPT response. If GPT response is not yes or no, return random boolean
    response = response.toLowerCase()
    if (response.includes("yes")) {
      return true
    } else if (response.includes("no")) {
      return false
    } else {
      return false
      //return Math.random() >= 0.5;
    }
  }

  async function categorizeGeneratedObject(prompt) {
    // prompt: string
    // return: EndCase
    const question1 = `Can a human easily lift a ${prompt}? Only answer with yes or no.` // if yes, don't do anythin
    const question2 = `Is a ${prompt} sharp enough to cut down a tree? Only answer with yes or no.`
    const question3 = `Can a ${prompt} be used to start a fire directly? Only answer with yes or no.`

    const gptResponse1 = await askGpt(question1)
    console.log("gptResponse1: ", gptResponse1)
    const gptResponse1Boolean = await isGPTResponseAffirmative(gptResponse1)
    console.log("gptResponse1Boolean: ", gptResponse1Boolean)
    const gptResponse2 = await askGpt(question2)
    console.log("gptResponse2: ", gptResponse2)
    const gptResponse2Boolean = await isGPTResponseAffirmative(gptResponse2)
    console.log("gptResponse2Boolean: ", gptResponse2Boolean)
    const gptResponse3 = await askGpt(question3)
    console.log("gptResponse3: ", gptResponse3)
    const gptResponse3Boolean = await isGPTResponseAffirmative(gptResponse3)
    console.log("gptResponse3Boolean: ", gptResponse3Boolean)

    if (gptResponse1Boolean & gptResponse2Boolean) {
      return EndCase.TreeCutDown
    }

    return EndCase.Other
  }

  function getGameResult(endCase) {
    // EndCase: EndCase
    // return: {gameEnded: Boolean, playerWon: Boolean}
    if (endCase != EndCase.Other) {
      console.log("endCase == 1", endCase == 1)
      return { gameEnded: true, playerWon: endCase == 1 }
    }
    return { gameEnded: false, playerWon: false }
  }

  async function askGpt(prompt) {
    console.log("inside askGpt")

    const API_KEY = "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"
    const API_ENDPOINT = "https://api.openai.com/v1/completions"

    const data = {
      prompt: prompt,
      model: "text-davinci-002",
      max_tokens: 100,
      temperature: 0.1,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    }

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(data),
    }

    // Use the await keyword to wait for the fetch to complete.
    const response = await fetch(API_ENDPOINT, options)
    // Parse the response as JSON.
    const jsonResponse = await response.json()
    // Get the first choice from the response.
    const choice = jsonResponse.choices[0]
    // Get the completed text from the choice.
    const completedText = choice.text

    // Return the completed text.
    return completedText
  }

  // ==========================================================
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

  function renderImage() {
    return image.map((url, idx) => {
      return (
        <img
          key={idx}
          src={url}
          style={{ left: `${imagePosition.x}px`, bottom: `${imagePosition.y}px` }}
          className="absolute fall-from-top animate__animated animate__bounce w-[300px] h-[300px]"
        />
      )
    })
  }

  function renderGameEnded() {
    return (
      <div>
        <h1 className="text-6xl text-center">Game Ended</h1>
        <h2 className="text-4xl text-center">{gameResults.playerWon ? "You Won!" : "You Lost!"}</h2>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundImage: "url('')",
      }}
      className="bg-sky-100 w-screen min-h-screen bg-no-repeat bg-cover bg-center"
    >
      <canvas ref={canvasRef} className="w-screen h-screen aboslute" style={{zIndex: 200}}/>
      <form onSubmit={handleSubmit} className="absolute m-2">
        <input required name="prompt" className="p-3 bg-white border-2 border-gray-500 rounded" type="text" />
        {loading && <p>Loading...</p>}
      </form>
      {image.length > 0 && renderImage()}
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
      {gameResults.gameEnded && renderGameEnded()}
    </div>
  )
}

export default App
