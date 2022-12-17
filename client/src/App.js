import React, { useEffect, useRef } from "react"
import axios from "axios"
import "animate.css"
import { w3cwebsocket as W3CWebSocket } from "websocket"

const client = new W3CWebSocket("ws://192.168.131.78:8000")

const App = () => {
  const [image, setImage] = React.useState(
    "https://replicate.delivery/pbxt/HfKk4xHxwesiK0rIMDvENGZbxSxn1vyYlY9shPzyoNBTUxKQA/out-0.png"
  )
  const [imagePosition, setImagePosition] = React.useState({ x: 0, y: 0 })
  const [loading, setLoading] = React.useState(false)
  const [gameResults, setGameResults] = React.useState({ gameEnded: false, playerWon: false })
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
      setImagePosition({ x: h * wristPosition.lx, y: w * wristPosition.ly })
    }
    console.log("before askGpt call")
    const generated_reply = askGpt(prompt)
    // console.log("genereated reply: ", generated_reply)

    // ========== You win or lose? =================
    const endCase = await categorizeGeneratedObject(prompt);
    console.log("endCase: ", endCase)
    setGameResults(getGameResult(endCase));
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
    Other: -1
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
    const question1HumanLiftsP = `Can a human easily lift a ${prompt}? Only answer with yes or no.`; 
    const question2PCutsDownTree = `Is a ${prompt} sharp enough to cut down a tree? Only answer with yes or no.`; 
    const question3PStartsFire = `Can a ${prompt} be used to start a fire directly? Only answer with yes or no.`;
    const question4CatLikesP = `Do cats like ${prompt}? Only answer with yes or no.`
    const question5PUsedToFly = `Can ${prompt} be used to fly? Only answer with yes or no.`
    const question6PLivingCreature = `Is ${prompt} a living creature? Only answer with yes or no.`
    const question7PCausesHarmToCat = `Is it likely that a ${prompt} will cause harm to a cat if locked in a room together? Only answer with yes or no.`
    const question8PSavesCatsFromTrees = `Do ${prompt} save cats from trees often? Only answer with yes or no`

    const gptResponse1CutsDownTree = await askGpt(question1HumanLiftsP)
    console.log("gptResponse1CutsDownTree: ", gptResponse1CutsDownTree)
    const gptResponse1CutsDownTreeBoolean = await isGPTResponseAffirmative(gptResponse1CutsDownTree);
    console.log("gptResponse1CutsDownTreeBoolean: ", gptResponse1CutsDownTreeBoolean);

    const gptResponse2PCutsDownTree = await askGpt(question2PCutsDownTree);
    console.log("gptResponse2PCutsDownTree: ", gptResponse2PCutsDownTree)
    const gptResponse2PCutsDownTreeBoolean = await isGPTResponseAffirmative(gptResponse2PCutsDownTree);
    console.log("gptResponse2PCutsDownTreeBoolean: ", gptResponse2PCutsDownTreeBoolean);

    const gptResponse3PStartsFire = await askGpt(question3PStartsFire);
    console.log("gptResponse3PStartsFire : ", gptResponse3PStartsFire)
    const gptResponse3PStartsFireBoolean = await isGPTResponseAffirmative(gptResponse3PStartsFire)
    console.log("gptResponse3PStartsFire Boolean: ", gptResponse3PStartsFireBoolean)

    const gptResponse4CatLikesP = await askGpt(question4CatLikesP);
    console.log("gptResponse4CatLikesP : ", gptResponse4CatLikesP)
    const gptResponse4CatLikesPBoolean = await isGPTResponseAffirmative(gptResponse4CatLikesP);
    console.log("gptResponse4CatLikesP Boolean: ", gptResponse4CatLikesPBoolean);

    const gptResponse5PUsedToFly = await askGpt(question5PUsedToFly);
    console.log("gptResponse5PUsedToFly : ", gptResponse5PUsedToFly)
    const gptResponse5PUsedToFlyBoolean = await isGPTResponseAffirmative(gptResponse5PUsedToFly);
    console.log("gptResponse5PUsedToFly Boolean: ", gptResponse5PUsedToFlyBoolean);

    const gptResponse6PLivingCreature = await askGpt(question6PLivingCreature);
    console.log("gptResponse6PLivingCreature : ", gptResponse6PLivingCreature)
    const gptResponse6PLivingCreatureBoolean = await isGPTResponseAffirmative(gptResponse6PLivingCreature);
    console.log("gptResponse6PLivingCreature Boolean: ", gptResponse6PLivingCreatureBoolean);

    const gptResponse7PCausesHarmToCat = await askGpt(question7PCausesHarmToCat);
    console.log("gptResponse7PCausesHarmToCat : ", gptResponse7PCausesHarmToCat)
    const gptResponse7PCausesHarmToCatBoolean = await isGPTResponseAffirmative(gptResponse7PCausesHarmToCat);
    console.log("gptResponse7PCausesHarmToCat Boolean: ", gptResponse7PCausesHarmToCatBoolean);

    const gptResponse8PSavesCatsFromTrees = await askGpt(question8PSavesCatsFromTrees);
    console.log("gptResponse8PSavesCatsFromTrees : ", gptResponse8PSavesCatsFromTrees)
    const gptResponse8PSavesCatsFromTreesBoolean = await isGPTResponseAffirmative(gptResponse8PSavesCatsFromTrees);
    console.log("gptResponse8PSavesCatsFromTreesBoolean: ", gptResponse8PSavesCatsFromTreesBoolean);

    if (gptResponse1CutsDownTreeBoolean & gptResponse2PCutsDownTreeBoolean){
      return EndCase.TreeCutDown;
    }
    if (gptResponse3PStartsFireBoolean){
      return EndCase.TreeTakesFire;
    }
    if (gptResponse4CatLikesPBoolean){
      return EndCase.CatGoesDown;
    }

    if (gptResponse5PUsedToFlyBoolean){
      return EndCase.CatFliesUp; // todo: return randomly between CatFliesDown and CatFliesUp
    }

    if (gptResponse6PLivingCreatureBoolean & gptResponse7PCausesHarmToCatBoolean){
      return EndCase.CatGoesToHeaven;
    }

    if (gptResponse6PLivingCreature & gptResponse8PSavesCatsFromTreesBoolean){
      return EndCase.CatGoesDown;
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
    return (
      <img
        src={image}
        style={{ left: `${imagePosition.x}px`, bottom: `${imagePosition.y}px` }}
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
