require 'sinatra'
require 'json'
require 'redis'
require 'haml'

set :logging, false

REDIS = Redis.new

REDIS.set('energy', '30')
REDIS.set('water', '30')
REDIS.set('human', '40')

get '/' do
  haml :plaque
end

get '/update.json' do
  content_type :json

  pEnergy = REDIS.get('energy').to_f
  pWater = REDIS.get('water').to_f
  pHuman = REDIS.get('human').to_f

  energy = 0.9 * pEnergy + 2 * rand
  water = 0.75 * pWater + 5 * rand
  human = 0.75 * pHuman + 7 * rand

  REDIS.set('energy', energy)
  REDIS.set('water', water)
  REDIS.set('human', human)

  [
    { :key => :energy, :val => [[energy.to_i, 0].max, 30].min, :prev => pEnergy.to_i },
    { :key => :water, :val => [[water.to_i, 0].max, 30].min, :prev => pWater.to_i },
    { :key => :human, :val => [[human.to_i, 0].max, 40].min, :prev => pHuman.to_i }
  ].to_json
end
