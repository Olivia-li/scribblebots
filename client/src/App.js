import React, { useEffect, useRef } from "react"
import axios from "axios"
import "animate.css"
import { w3cwebsocket as W3CWebSocket } from "websocket"

const client = new W3CWebSocket("ws://192.168.131.78:8000")

const App = () => {
  const [image, setImage] = React.useState()
  const [imagePosition, setImagePosition] = React.useState(null)
  const [loading, setLoading] = React.useState(false)
  const [gameResults, setGameResults] = React.useState({ gameEnded: false, playerWon: false })
  const [personPosition, setPersonPosition] = React.useState({
    x: 0,
    y: 0,
  })
  const [wristPosition, setWristPosition] = React.useState({ lx: 0, ly: 0, rx: 0, ry: 0 })
  const canvasRef = useRef(null)
  const h = window.innerHeight
  const w = window.innerWidth

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
    }
  }, [])

  function handleSetImagePosition(position) {
    if (imagePosition) {
      setImagePosition(position)
    }
  }

  function returnImagePosition() {
    switch (imagePosition) {
      case "tree":
        return treePosition
      case "cat":
        return catPosition
      case "human":
        return { x: wristPosition.ly * w, y: wristPosition.lx * h }
      default:
        return { x: 0, y: 0 }
    }
  }

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
    setImagePosition(null)
    const prompt = e.target.prompt.value
    setLoading(true)
    const result = await axios.post("predict", { prompt: prompt })
    if (result.data?.person?.includes("yes")) {
      setImagePosition({ x: h * wristPosition.lx, y: w * wristPosition.ly })
    }
    console.log("before askGpt call")
    const generated_reply = askGpt(prompt)
    // console.log("genereated reply: ", generated_reply)

    // ========== You win or lose? =================
    const endCase = await categorizeGeneratedObject(prompt)
    console.log("endCase: ", endCase)
    setGameResults(getGameResult(endCase))
    console.log("updated gameResults: ", gameResults.gameEnded)
    // ============================================

    setLoading(false)
    setImage(result.data.url)
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
    CatGoesToHeaven: 0,
    Other: -1,
  }
  async function isGPTResYes(response) {
    // response: string
    // return: Bool
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
    const q1HumanLifts = `Do humans hold ${prompt} in their hand? Only answer with yes or no.`
    const q2PCutsDownTree = `Is a ${prompt} a sharp enough to cut wood? Only answer with yes or no.`
    const q3PStartsFire = `Can a ${prompt} be used to start a fire directly? Only answer with yes or no.`
    const q4CatLikes = `Do cats like ${prompt}? Only answer with yes or no.`
    const q5ClimbDown = `Can a human use a ${prompt} to climb down a tree? Only answer with yes or no.`
    const q6UsedToFly = `Can ${prompt} be used to go in the air? Only answer with yes or no.`
    const q7FlyDangerous = `Is flying with a ${prompt} dangerous? Only answer with yes or no.`
    const q8LivingCreature = `Assume ${prompt} is real. Is ${prompt} by itself a living creature? Only answer with yes or no.`
    const q9CausesHarmToCat = `Could a ${prompt} will cause harm to a cat if locked in a room together? Only answer with yes or no.`
    const q10SavesCatsFromTrees = `Do ${prompt} save cats from trees often? Only answer with yes or no`

    const res1HumanLifts = await askGpt(q1HumanLifts)
    console.log("res1HumanLifts: ", res1HumanLifts)
    const res1HumanLiftsBool = await isGPTResYes(res1HumanLifts)
    console.log("res1HumanLiftsBool: ", res1HumanLiftsBool)

    const gptRes2PCutsDownTree = await askGpt(q2PCutsDownTree)
    console.log("gptRes2PCutsDownTree: ", gptRes2PCutsDownTree)
    const gptRes2PCutsDownTreeBool = await isGPTResYes(gptRes2PCutsDownTree)
    console.log("gptRes2PCutsDownTreeBool: ", gptRes2PCutsDownTreeBool)

    const gptRes3PStartsFire = await askGpt(q3PStartsFire)
    console.log("gptRes3PStartsFire : ", gptRes3PStartsFire)
    const gptRes3PStartsFireBool = await isGPTResYes(gptRes3PStartsFire)
    console.log("gptRes3PStartsFire Bool: ", gptRes3PStartsFireBool)

    const gptRes4CatLikes = await askGpt(q4CatLikes)
    console.log("gptRes4CatLikes : ", gptRes4CatLikes)
    const gptRes4CatLikesBool = await isGPTResYes(gptRes4CatLikes)
    console.log("gptRes4CatLikes Bool: ", gptRes4CatLikesBool)

    const gptRes5ClimbDown = await askGpt(q5ClimbDown)
    console.log("gptRes5ClimbDown : ", gptRes5ClimbDown)
    const gptRes5ClimbDownBool = await isGPTResYes(gptRes5ClimbDown)
    console.log("gptRes4CatLikes Bool: ", gptRes5ClimbDownBool)

    const gptRes6UsedToFly = await askGpt(q6UsedToFly)
    console.log("gptRes6UsedToFly : ", gptRes6UsedToFly)
    const gptRes6UsedToFlyBool = await isGPTResYes(gptRes6UsedToFly)
    console.log("gptRes6UsedToFly Bool: ", gptRes6UsedToFlyBool)

    const gptRes7FlyDangerous = await askGpt(q7FlyDangerous)
    console.log("gptRes7FlyDangerous : ", gptRes7FlyDangerous)
    const gptRes7FlyDangerousBool = await isGPTResYes(gptRes7FlyDangerous)
    console.log("gptRes7FlyDangerous Bool: ", gptRes7FlyDangerousBool)

    const gptRes8LivingCreature = await askGpt(q8LivingCreature)
    console.log("gptRes8LivingCreature : ", gptRes8LivingCreature)
    const gptRes8LivingCreatureBool = await isGPTResYes(gptRes8LivingCreature)
    console.log("gptRes8LivingCreature Bool: ", gptRes8LivingCreatureBool)

    const gptRes9CausesHarmToCat = await askGpt(q9CausesHarmToCat)
    console.log("gptRes9CausesHarmToCat : ", gptRes9CausesHarmToCat)
    const gptRes9CausesHarmToCatBool = await isGPTResYes(gptRes9CausesHarmToCat)
    console.log("gptRes9CausesHarmToCat Bool: ", gptRes9CausesHarmToCatBool)

    const gptRes10SavesCatsFromTrees = await askGpt(q10SavesCatsFromTrees)
    console.log("gptRes10SavesCatsFromTrees : ", gptRes10SavesCatsFromTrees)
    const gptRes10SavesCatsFromTreesBool = await isGPTResYes(gptRes10SavesCatsFromTrees)
    console.log("gptRes10SavesCatsFromTreesBool: ", gptRes10SavesCatsFromTreesBool)

    if (res1HumanLiftsBool) {
      handleSetImagePosition("human")
    }
    if (res1HumanLiftsBool && gptRes2PCutsDownTreeBool) {
      return EndCase.TreeCutDown
    }
    if (gptRes3PStartsFireBool) {
      handleSetImagePosition("tree")
      return EndCase.TreeTakesFire
    }
    if (gptRes4CatLikesBool) {
      handleSetImagePosition("tree")
      return EndCase.CatGoesDown
    }
    if (gptRes5ClimbDownBool) {
      handleSetImagePosition("tree")
      return EndCase.CatGoesDown
    }
    if (gptRes6UsedToFlyBool && gptRes7FlyDangerousBool) {
      handleSetImagePosition("cat")
      return EndCase.CatFliesUp
    }
    if (gptRes6UsedToFlyBool && !gptRes7FlyDangerousBool) {
      handleSetImagePosition("cat")
      return EndCase.CatFliesDown
    }
    if (gptRes8LivingCreatureBool & gptRes9CausesHarmToCatBool) {
      handleSetImagePosition("tree")
      return EndCase.CatGoesToHeaven
    }
    if (gptRes8LivingCreatureBool & gptRes10SavesCatsFromTreesBool) {
      handleSetImagePosition("tree")
      return EndCase.CatGoesDown
    }

    return EndCase.Other
  }

  function getGameResult(endCase) {
    // EndCase: EndCase
    // return: {gameEnded: Bool, playerWon: Bool}
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
  const catPosition = {
    y: 725,
    x: 500,
  }

  const treePosition = {
    y: 0,
    x: 300,
  }

  function renderImage() {
    return (
      <img
        src={image}
        style={{ left: `${returnImagePosition().x}px`, bottom: `${returnImagePosition().y}px` }}
        className="absolute fall-from-top animate__animated animate__bounce w-[300px] h-[300px]"
      />
    )
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
      <form onSubmit={handleSubmit} className="absolute m-2">
        <input required name="prompt" className="p-3 bg-white border-2 border-gray-500 rounded" type="text" />
        {loading && <p>Loading...</p>}
      </form>
      <canvas ref={canvasRef} className="w-screen h-screen aboslute" />
      {image && renderImage()}
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
      {gameResults.gameEnded && renderGameEnded()}
    </div>
  )
}

export default App
