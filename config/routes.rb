Rails.application.routes.draw do
  post 'predict' => 'application#predict'

  root "application#index"
  get '/*slug', to: 'application#index'
end