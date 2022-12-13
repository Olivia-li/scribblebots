import React from "react"
import api from "../utils/api"

const App = () => {
  const [images, setImages] = React.useState([])

  async function handleSubmit(e) {
    e.preventDefault()
    const prompt = e.target.prompt.value
    const result = await api.post("predict", { prompt: prompt })
    setImages([...images, result.data.url])
  }

  function renderImages() {
    return images.map((url, idx) => {
      return <img key={idx} src={url} />
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
        <input required name="prompt" className="p-3 bg-gray-100" type="text" />
      </form>
      {images.length > 0 && renderImages()}
      <img
        src="https://dreamweaver-sd.s3.amazonaws.com/scribblenauts/cat.png"
        className="absolute bottom-[725px] left-[500px] w-[120px] h-[120px]"
      />
      <img
        src="https://dreamweaver-sd.s3.amazonaws.com/scribblenauts/tree.png"
        className="absolute bottom-0 left-[300px] h-[750px]"
      />
    </div>
  )
}

export default App
