class SkeletonChannel < ApplicationCable::Channel
  def subscribed
    binding.pry
    stream_from "skeleton_channel"
  end

  def unsubscribed
    # Any cleanup needed when channel is unsubscribed
  def send_text()
    ActionCable.server.broadcast 'skeleton_channel', {message: "Hello World!"}
  end

  def 
end
