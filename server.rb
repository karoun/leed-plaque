require 'sinatra'
require 'json'
require 'redis'
require 'haml'

set :public_folder, 'public'

REDIS = Redis.new

REDIS.set('energy', '20')
REDIS.set('water', '20')
REDIS.set('human', '30')

get '/' do
  haml :plaque
end

get '/update.json' do
  content_type :json
  retval = {}
  energy = 0.9 * REDIS.get('energy').to_f + 2 * rand
  water = 0.75 * REDIS.get('water').to_f + 5 * rand
  human = 0.75 * REDIS.get('human').to_f + 7 * rand
  REDIS.set('energy', energy)
  REDIS.set('water', water)
  REDIS.set('human', human)
  retval[:energy] = [[energy.to_i,0].max, 30].min
  retval[:water] = [[water.to_i,0].max, 30].min
  retval[:human] = [[human.to_i,0].max, 40].min
  retval.to_json
end
