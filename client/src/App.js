import React, { useCallback, useEffect, useRef, useState } from "react"
import axios from "axios"
import "animate.css"
import { w3cwebsocket as W3CWebSocket } from "websocket"
import _ from "lodash"

const client = new W3CWebSocket("ws://192.168.131.78:8000")

const App = () => {
  const [image, setImage] = useState()
  const [imagePosition, setImagePosition] = useState()
  const [loading, setLoading] = useState(false)
  const [gameResults, setGameResults] = useState({ gameEnded: false, playerWon: false })
  const [animationEnded, setAnimationEnded] = useState(false)
  const [wristPosition, setWristPosition] = useState({ lx: 0, ly: 0, rx: 0, ry: 0 })
  const [gamePlayExplanation, setGamePlayExplanation] = React.useState(null)
  const [personPosition, setPersonPosition] = useState()
  
  const h = window.innerHeight
  const w = window.innerWidth

  const canvasRef = useRef(null)
  const treeRef = useRef(null)
  const treeStateRef = useRef("static") // set to static for still image
  const catRef = useRef(null)
  const [catState, setCatState] = useState("static")
  const catY = useRef(600)
  const [imageCatY, setImageCatY] = useState(h - 550)

  useEffect(() => {
    if (canvasRef.current.canvas && catRef.current) {
      catY.current = canvasRef.current.canvas.height - catRef.current.height - 1300
    }
  }, [catRef.current, canvasRef.current])


  const NORM_FACTOR = 0.3

  const wsRefIsOpen = useRef(false)
  useEffect(() => {
    if (wsRefIsOpen.current) {
      return
    }
    console.log("websocket opened")
    wsRefIsOpen.current = true

    client.onopen = () => {
      console.log("WebSocket Client Connected")
    }
    client.onmessage = async (message) => {
      const dataFromServer = JSON.parse(message.data)
      const wrist = dataFromServer.wrist
      const body = dataFromServer.body

      setWristPosition({
        lx: wrist.lx * NORM_FACTOR,
        ly: wrist.ly * NORM_FACTOR,
        rx: wrist.rx * NORM_FACTOR,
        ry: wrist.ry * NORM_FACTOR,
      })

      setPersonPosition([...body])
    }
  }, [setPersonPosition, setWristPosition])

  function handleSetImagePosition(position) {
    if (!imagePosition) {
      setImagePosition(position)
    }
  }

  const returnImagePosition = () => {
    switch (imagePosition) {
      case "tree":
        return treePosition
      case "cat":
        return catPosition
      case "human":
        return { x: wristPosition.ry * w - 80, y: wristPosition.rx * h - 80 }
      default:
        return { x: 0, y: 0 }
    }
  }

  useEffect(() => {
    if (treeRef.current) {
      return
    }
    let tree = new Image()
    tree.src = "https://dreamweaver-sd.s3.amazonaws.com/scribblenauts/tree.png"
    treeRef.current = tree

    if (catRef.current) {
      return
    }
    var cat = new Image()
    cat.src = "https://dreamweaver-sd.s3.amazonaws.com/scribblenauts/cat.png"
    catRef.current = cat
  }, [])

  function drawTree(ctx) {
    if (!treeRef.current && !ctx.canvas) {
      return
    }

    if (treeStateRef.current === "static") {
      ctx.drawImage(treeRef.current, 800, ctx.canvas.height - 1300, treeRef.current.width + 300, 1300)
    } else {
      ctx.drawImage(treeRef.current, Math.random() * 10 - 5, ctx.canvas.height - treeRef.current.height)
    }
  }

  function drawCat(ctx) {
    if (!catRef.current) {
      return
    }
    const state = catState
    const imgH = catRef.current.height
    const imgW = catRef.current.width

    if (state === "static") {
      ctx.drawImage(catRef.current, 900, 600, imgW, imgH)
    } else if (state === "climb_down") {
      const canvas = ctx.canvas
      var catSpeed = 5
      var catDirection = 1
      if (catY.current > canvas.height - catRef.current.height) {
        catDirection = -1
        setAnimationEnded(true)
      } else if (catY < 0) {
        catDirection = 1
      }
      catY.current = catY.current + catSpeed * catDirection
      ctx.drawImage(catRef.current, 900, catY.current, imgW, imgH)
    } else if (state === "fly_up") {
      var catSpeed = 5
      var catDirection = -1
      setImageCatY((prev) => prev - (catSpeed - 2) * catDirection)
      catY.current = catY.current + catSpeed * catDirection
      if (catY.current < 0) {
        setAnimationEnded(true)
      }
      ctx.drawImage(catRef.current, 900, catY.current, imgW, imgH)
    }
  }

  const draw = useCallback(
    (ctx) => {
      // Clear screen
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

      // Little Human figure
      drawFigure(ctx, ctx.canvas.width, ctx.canvas.height, personPosition)

      // Draw Tree
      drawTree(ctx)
      // Draw cat
      drawCat(ctx)
    },
    [wristPosition, personPosition, catState]
  )

  const throttledDraw = _.throttle(draw, 50)

  function drawFigure(ctx, w, h, body) {
    body?.map((points) => {
      let pointsList = [...points]
      ctx.beginPath()
      ctx.lineWidth = 5
      let started = false
      while (pointsList.length > 0) {
        if (pointsList[0].x === 0 || pointsList[0].y === 1) {
          return
        }
        if (!started) {
          ctx.moveTo(pointsList[0].y * w * NORM_FACTOR, h - pointsList[0].x * h * NORM_FACTOR)
          started = true
        } else {
          ctx.lineTo(pointsList[0].y * w * NORM_FACTOR, h - pointsList[0].x * h * NORM_FACTOR)
        }
        pointsList.shift()
      }
      ctx.stroke()
    })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext("2d")
    canvas.width = window.innerWidth
    canvas.height = window.innerWidth
    let animationFrameId

    const render = () => {
      throttledDraw(context)
      animationFrameId = window.requestAnimationFrame(render)
    }

    render()

    return () => {
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [draw])

  async function handleSubmit(e) {
    e.preventDefault()
    console.log("submitted")
    setGamePlayExplanation(null)
    setAnimationEnded(false)
    const prompt = e.target.prompt.value
    setLoading(true)
    const result = await axios.post("predict", { prompt: prompt })
    console.log("before askGpt call")
    // ========== You win or lose? =================
    const endCase = await categorizeGeneratedObject(prompt)
    console.log("endCase: ", endCase)
    setGameResults(getGameResult(endCase))
    console.log("updated gameResults: ", gameResults.gameEnded)
    // ============================================

    setLoading(false)
    setImage(result.data.url)
  }
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
    const q1HumanLifts = `Can humans hold ${prompt} in their hand? Answer with yes or no. Explain`
    const q2PCutsDownTree = `Is a ${prompt} a sharp enough to cut wood? Answer with yes or no. Explain`
    const q3PStartsFire = `Can a ${prompt} be used to start a fire directly? Answer with yes or no. Explain`
    const q4CatLikes = `Do cats like ${prompt}? Answer with yes or no. Explain`
    const q5ClimbDown = `Can a cat use a ${prompt} to climb down a tree? Answer with yes or no. Explain`
    const q6UsedToFly = `Can ${prompt} be used to go in the air? Answer with yes or no. Explain`
    const q7FlyDangerous = `Is flying with a ${prompt} dangerous? Answer with yes or no. Explain`
    const q8LivingCreature = `Assume ${prompt} is real. Is ${prompt} by itself a living creature? Answer with yes or no. Explain`
    const q9CausesHarmToCat = `Could a ${prompt} will cause harm to a cat if locked in a room together? Answer with yes or no. Explain`
    const q10SavesCatsFromTrees = `Do ${prompt} save cats from trees often? Answer with yes or no. Explain`

    const gptRes1HumanLifts = await askGpt(q1HumanLifts)
    console.log("gptRes1HumanLifts: ", gptRes1HumanLifts)
    const gptRes1HumanLiftsBool = await isGPTResYes(gptRes1HumanLifts)
    console.log("gptRes1HumanLiftsBool: ", gptRes1HumanLiftsBool)

    const gptRes2PCutsDownTree = await askGpt(q2PCutsDownTree)
    console.log("gptRes2PCutsDownTree: ", gptRes2PCutsDownTree)
    const gptRes2PCutsDownTreeBool = await isGPTResYes(gptRes2PCutsDownTree)
    console.log("gptRes2PCutsDownTreeBool: ", gptRes2PCutsDownTreeBool)

    if (gptRes1HumanLiftsBool) {
      handleSetImagePosition("human")
    }
    if (gptRes1HumanLiftsBool && gptRes2PCutsDownTreeBool) {
      setGamePlayExplanation(gptRes2PCutsDownTree)
      return EndCase.TreeCutDown
    }

    const gptRes3PStartsFire = await askGpt(q3PStartsFire)
    console.log("gptRes3PStartsFire : ", gptRes3PStartsFire)
    const gptRes3PStartsFireBool = await isGPTResYes(gptRes3PStartsFire)
    console.log("gptRes3PStartsFire Bool: ", gptRes3PStartsFireBool)

    if (gptRes3PStartsFireBool) {
      handleSetImagePosition("tree")
      setGamePlayExplanation(gptRes3PStartsFire)
      return EndCase.TreeTakesFire
    }

    const gptRes4CatLikes = await askGpt(q4CatLikes)
    console.log("gptRes4CatLikes : ", gptRes4CatLikes)
    const gptRes4CatLikesBool = await isGPTResYes(gptRes4CatLikes)
    console.log("gptRes4CatLikes Bool: ", gptRes4CatLikesBool)

    if (gptRes4CatLikesBool) {
      setCatState("climb_down")
      handleSetImagePosition("tree")
      setGamePlayExplanation(gptRes4CatLikes)
      return EndCase.CatGoesDown
    }

    const gptRes5ClimbDown = await askGpt(q5ClimbDown)
    console.log("gptRes5ClimbDown : ", gptRes5ClimbDown)
    const gptRes5ClimbDownBool = await isGPTResYes(gptRes5ClimbDown)
    console.log("gptRes4CatLikes Bool: ", gptRes5ClimbDownBool)

    if (gptRes5ClimbDownBool) {
      setCatState("climb_down")
      handleSetImagePosition("tree")
      setGamePlayExplanation(gptRes5ClimbDown)
      return EndCase.CatGoesDown
    }

    const gptRes6UsedToFly = await askGpt(q6UsedToFly)
    console.log("gptRes6UsedToFly : ", gptRes6UsedToFly)
    const gptRes6UsedToFlyBool = await isGPTResYes(gptRes6UsedToFly)
    console.log("gptRes6UsedToFly Bool: ", gptRes6UsedToFlyBool)

    const gptRes7FlyDangerous = await askGpt(q7FlyDangerous)
    console.log("gptRes7FlyDangerous : ", gptRes7FlyDangerous)
    const gptRes7FlyDangerousBool = await isGPTResYes(gptRes7FlyDangerous)
    console.log("gptRes7FlyDangerous Bool: ", gptRes7FlyDangerousBool)

    if (gptRes6UsedToFlyBool && gptRes7FlyDangerousBool) {
      setCatState("fly_up")
      handleSetImagePosition("cat")
      setGamePlayExplanation(gptRes7FlyDangerous)
      return EndCase.CatFliesUp
    }
    if (gptRes6UsedToFlyBool && !gptRes7FlyDangerousBool) {
      setCatState("climb_down")
      handleSetImagePosition("cat")
      setGamePlayExplanation(gptRes6UsedToFly)
      return EndCase.CatFliesDown
    }

    const gptRes8LivingCreature = await askGpt(q8LivingCreature)
    console.log("gptRes8LivingCreature : ", gptRes8LivingCreature)
    const gptRes8LivingCreatureBool = await isGPTResYes(gptRes8LivingCreature)
    console.log("gptRes8LivingCreature Bool: ", gptRes8LivingCreatureBool)

    const gptRes9CausesHarmToCat = await askGpt(q9CausesHarmToCat)
    console.log("gptRes9CausesHarmToCat : ", gptRes9CausesHarmToCat)
    const gptRes9CausesHarmToCatBool = await isGPTResYes(gptRes9CausesHarmToCat)
    console.log("gptRes9CausesHarmToCat Bool: ", gptRes9CausesHarmToCatBool)

    if (gptRes8LivingCreatureBool & gptRes9CausesHarmToCatBool) {
      handleSetImagePosition("tree")
      setGamePlayExplanation(gptRes9CausesHarmToCat)
      return EndCase.CatGoesToHeaven
    }

    const gptRes10SavesCatsFromTrees = await askGpt(q10SavesCatsFromTrees)
    console.log("gptRes10SavesCatsFromTrees : ", gptRes10SavesCatsFromTrees)
    const gptRes10SavesCatsFromTreesBool = await isGPTResYes(gptRes10SavesCatsFromTrees)
    console.log("gptRes10SavesCatsFromTreesBool: ", gptRes10SavesCatsFromTreesBool)

    if (gptRes8LivingCreatureBool & gptRes10SavesCatsFromTreesBool) {
      handleSetImagePosition("tree")
      setGamePlayExplanation(gptRes10SavesCatsFromTrees)
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

  function processGPTExplanation(gptResponse) {
    // gptResponse: String
    // return: String
    const processedGptResponse = gptResponse.replace("Yes, ", "").replace("No, ", "").replace("your answer.", "")
    return processedGptResponse
  }
  // ==========================================================
  const catPosition = {
    y: imageCatY,
    x: 800,
  }

  const treePosition = {
    y: 0,
    x: 800,
  }

  function renderImage() {
    return (
      <img
        src={image}
        style={{ left: `${returnImagePosition().x}px`, bottom: `${returnImagePosition().y}px` }}
        className="absolute fall-from-top w-[150px] h-[150px]"
      />
    )
  }

  function renderGamePlayExplanation() {
    return (
      <div className="">
        <h2 className="text-center mx-[24rem] mt-8 text-3xl">{processGPTExplanation(gamePlayExplanation)}</h2>
      </div>
    )
  }

  function renderGameEnded() {
    return (
      <div className="">
        <h1 className="text-6xl text-center">Game Ended</h1>
        <h2 className="text-4xl text-center">{gameResults.playerWon ? "You Won!" : "You Lost!"}</h2>
      </div>
    )
  }

  return (
    <div className="bg-sky-100 w-screen min-h-screen bg-no-repeat bg-cover bg-center overflow-hidden">
      <form onSubmit={handleSubmit} className="absolute m-2 z-30">
        <input required name="prompt" className="p-3 bg-white border-2 border-gray-500 rounded" type="text" />
        {loading && <p className="">Loading...</p>}
      </form>
      <div className="absolute w-full mt-12">
        {animationEnded && gameResults.gameEnded && renderGameEnded()}
        {animationEnded && gamePlayExplanation && renderGamePlayExplanation()}
      </div>
      {image && renderImage()}
      <canvas ref={canvasRef} className="w-screen h-screen bg-transparent" />
      {/* <img
        style={{ left: `${catPosition.x}px`, bottom: `${catPosition.y}px` }}
        src="https://dreamweaver-sd.s3.amazonaws.com/scribblenauts/cat.png"
        className="absolute w-[120px] h-[120px]"
      />
      <img
        style={{ left: `${treePosition.x}px`, bottom: `${treePosition.y}px` }}
        src="https://dreamweaver-sd.s3.amazonaws.com/scribblenauts/tree.png"
        className="absolute h-[750px]"
      /> */}
    </div>
  )
}

export default App
