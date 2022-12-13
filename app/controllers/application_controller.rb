class ApplicationController < ActionController::Base
  require("replicate")

  def predict
    replicate = Replicate::Client.new(token: ENV["REPLICATE_API_KEY"])
    model = replicate.models("stability-ai/stable-diffusion")
    url = model.predict(prompt=params[:prompt])
    render json: { url: url }
  end
end
