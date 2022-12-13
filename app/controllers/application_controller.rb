class ApplicationController < ActionController::Base
  require("replicate")
  require("openai")


  def predict
    prompt = params[:prompt]
    replicate = Replicate::Client.new(token: ENV["REPLICATE_API_KEY"])
    model = replicate.models("stability-ai/stable-diffusion")
    url = model.predict(prompt=getPrompt(prompt))
    render json: { url: url, person: attach_to_person?(prompt)}
  end

  def attach_to_person?(item)
    openai_client = OpenAI::Client.new(api_key: ENV("OPENAI_API_KEY") default_engine: "ada")
    result = openai_client.completions(prompt: "Only answer with yes or no. Could a strong human hold a #{item} their hand and lift very easily", max_tokens: 5)
    return result
  end

  def getPrompt(prompt)
    return "fantasy art of #{prompt} in the morning, solid white background, soft pastel colors, by makoto shinkai, highly detailed digital art, trending on artstation, long shot"
  end
end
