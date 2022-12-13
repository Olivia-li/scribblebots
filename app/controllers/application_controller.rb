class ApplicationController < ActionController::Base
  require("replicate")
  require("openai")

  def predict
    prompt = params[:prompt]
    replicate = Replicate::Client.new(token: ENV["REPLICATE_API_KEY"])
    model = replicate.models("stability-ai/stable-diffusion")
    url = model.predict(prompt: getPrompt(prompt))[0]
    render json: { url: remove_background(url), person: attach_to_person?(prompt)}
  end

  def attach_to_person?(item)
    openai_client = OpenAI::Client.new(api_key: ENV["OPENAI_API_KEY"], default_engine: "ada")
    result = openai_client.completions(prompt: "Only answer with yes or no. Could a strong human hold a #{item} their hand and lift very easily", max_tokens: 5)
    return result
  end

  def remove_background(url)
    replicate = Replicate::Client.new(token: ENV["REPLICATE_API_KEY"])
    model = replicate.models("cjwbw/rembg")
    return model.predict(image: url)
  end

  def getPrompt(prompt)
    return "Tiny cute 3D low poly clay model #{prompt}, soft smooth lighting, soft colors, pastel color background, center long shot, 100mm lens, 3d blender render, polycount, modular constructivism, physically based rendering, high definition quality, at 4:5, 8k."
  end
end
