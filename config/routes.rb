require 'action_cable'
Rails.application.routes.draw do
  mount ActionCable.server => '/cable'
  resources :channels
  post 'predict' => 'application#predict'
  root "application#index"
  get '/*slug', to: 'application#index'
end