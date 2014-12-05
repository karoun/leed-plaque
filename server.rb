require 'sinatra'
require 'json'
require 'haml'

set :logging, false

REDIS = {
	:energy => 30,
	:water => 30,
	:human => 40
}

get '/' do
	content_type :html, :charset => 'utf-8'
	haml :plaque
end

get '/update.json' do
	content_type :json

	prev_human = REDIS[:human].to_f
	prev_water = REDIS[:water].to_f
	prev_energy = REDIS[:energy].to_f

	human = 0.75 * prev_human + 7 * rand
	water = 0.75 * prev_water + 5 * rand
	energy = 0.9 * prev_energy + 2 * rand

	REDIS[:energy] = energy
	REDIS[:water] = water
	REDIS[:human] = human

	[
	  { :key => :human, :val => [[human.to_i, 0].max, 40].min, :prev => prev_human.to_i },
	  { :key => :water, :val => [[water.to_i, 0].max, 30].min, :prev => prev_water.to_i },
	  { :key => :energy, :val => [[energy.to_i, 0].max, 30].min, :prev => prev_energy.to_i }
	].to_json
end
