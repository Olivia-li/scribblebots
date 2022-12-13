class ApplicationController < ActionController::Base

  def get_item(prompt)
    replicate = Replicate::Client.new(token: ENV["REPLICATE_API_KEY"])
    model = replicate.models("stability-ai/stable-diffusion")
    model.predict(prompt="a 19th century portrait of a wombat gentleman")
  end
end
