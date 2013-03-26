require 'sinatra'
require 'json'
require 'redis'
require 'haml'

set :logging, false

REDIS = Redis.new

REDIS.setnx('energy', '30')
REDIS.setnx('water', '30')
REDIS.setnx('human', '40')

get '/' do
	content_type :html, :charset => 'utf-8'
	haml :plaque
end

get '/update.json' do
	content_type :json

	prev_human = REDIS.get('human').to_f
	prev_water = REDIS.get('water').to_f
	prev_energy = REDIS.get('energy').to_f

	human = 0.75 * prev_human + 7 * rand
	water = 0.75 * prev_water + 5 * rand
	energy = 0.9 * prev_energy + 2 * rand

	REDIS.set('energy', energy)
	REDIS.set('water', water)
	REDIS.set('human', human)

	[
	  { :key => :human, :val => [[human.to_i, 0].max, 40].min, :prev => prev_human.to_i },
	  { :key => :water, :val => [[water.to_i, 0].max, 30].min, :prev => prev_water.to_i },
	  { :key => :energy, :val => [[energy.to_i, 0].max, 30].min, :prev => prev_energy.to_i }
	].to_json
end
