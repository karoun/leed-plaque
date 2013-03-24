require 'sinatra'
require 'json'
require 'redis'
require 'haml'

set :public_folder, 'public'
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

  energy = 0.9 * REDIS.get('energy').to_f + 2 * rand
  water = 0.75 * REDIS.get('water').to_f + 5 * rand
  human = 0.75 * REDIS.get('human').to_f + 7 * rand

  REDIS.set('energy', energy)
  REDIS.set('water', water)
  REDIS.set('human', human)

  retval = {}
  retval[:energy] = { :max => 30, :val => [[energy.to_i, 0].max, 30].min }
  retval[:water] = { :max => 30, :val => [[water.to_i, 0].max, 30].min }
  retval[:human] = { :max => 40, :val => [[human.to_i,0].max, 40].min }
  retval.to_json
end
