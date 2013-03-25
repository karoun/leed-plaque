jQuery(function($) {

	/* CONFIG */

	var metaData = {
		energy: {
			maxScore: 30,
			label: 'Energy',
			color: '#d99e18',
			scale: d3.scale.linear().domain([0, 30])
		},
		water: {
			maxScore: 30,
			label: 'Water',
			color: '#87b8a9',
			scale: d3.scale.linear().domain([0, 30])
		},
		human: {
			maxScore: 40,
			label: 'Human Experience',
			color: '#8180b3',
			scale: d3.scale.linear().domain([0, 40])
		}
	};

	var
		margin = { top: 60, right: 60, bottom: 60, left: 60 },
		width = 800 - margin.left - margin.right,
		height = 600 - margin.top - margin.bottom,
		arcEnd = 1.5 * Math.PI,
		barMargin = 10,
		barWidth = 40,
		barPadded = barWidth + barMargin;

	/* DATA FUNCTIONS */



	/* DATA */

	var DATA = [
		{ key: 'energy', val: 0, prev: 0 },
		{ key: 'water', val: 0, prev: 0 },
		{ key: 'human', val: 0, prev: 0 }
	];

	var
		half = DATA.length * barWidth, // TODO: better name
		radius = half + barMargin;

	/* DRAWING FUNCTIONS */

	var bgArc = d3.svg.arc()
		.startAngle(0)
		.endAngle(arcEnd)
		.innerRadius(function(d, i) { return radius + i * barPadded; })
		.outerRadius(function(d, i) { return radius + i * barPadded + barWidth; });

	var scoreArc = d3.svg.arc()
		.startAngle(0)
		.endAngle(function(d) { return metaData[d.key].scale(d.val) * arcEnd; })
		.innerRadius(function(d, i) { return radius + i * barPadded; })
		.outerRadius(function(d, i) { return radius + i * barPadded + barWidth; });

	var arcTween = function(b, i) {
		var x = d3.interpolate({ val: b.prev }, b);
		return function(t) {
			return scoreArc(x(t), i);
		};
	};

	/* DRAWING */

	// Container
	var svg = d3.select('body').append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
	.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
	
	// Extensions
	svg.selectAll('rect.horiz')
		.data(DATA)
	.enter().append('rect')
		.classed('horiz', true)
		.attr('y', function(d, i) { return i * (barWidth + barMargin); })
		.attr('width', width / 2)
		.attr('height', barWidth)
		.style('fill', function(d) { return metaData[d.key].color; });

	svg.selectAll('rect.vert')
		.data(DATA)
	.enter().append('rect')
		.classed('vert', true)
		.attr('x', function(d, i) { return i * barPadded; })
		.attr('width', barWidth)
		.attr('height', half)
		.style('fill', '#555')
		.attr('transform', 'translate(70, 150)');

	// Labels
	svg.selectAll('text')
		.data(DATA)
	.enter().append('text')
		.attr('class', 'bar')
		.attr('x', 0)
		.attr('y', function(d, i) { return i * (barWidth + barMargin) + (barWidth / 2); })
		.attr('dx', 15)
		.attr('dy', '.35em')
		.attr('text-anchor', 'left')
		.text(function(d) { return metaData[d.key].label.toUpperCase(); });

	// Background Bars
	var g = svg.selectAll('g')
		.data(DATA.reverse()) // HACK: Shouldn't need this
	.enter().append('g')
		.attr('transform', 'translate(' + width / 2 + ', 270' + ')');

	g.append('path')
		.attr('d', bgArc)
		.classed('bg', true)
		.style('fill', '#555');

	g.append('path')
		.attr('d', scoreArc)
		.classed('score', true)
		.style('fill', function(d) { return metaData[d.key].color; });

	/* AJAX */

	var updateScore = function() {
		$.getJSON('/update.json', function(update) {

			var sum = d3.sum(update, function(obj) {
				return obj.val;
			});

			DATA = update;

			var g = svg.selectAll('g')
				.data(update.reverse());
			
			g.select('path.score')
				.transition()
					.duration(1000)
					.attrTween('d', arcTween);
		});
	};

	updateScore();
	setInterval(updateScore, 5000);

});