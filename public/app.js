/* CONFIG */

var metaData = {
	energy: {
		maxScore: 30,
		label: 'Energy',
		color: '#d99e18',
		glyph: '⚡', // HACK: http://www.entypo.com/characters/
		scale: d3.scale.linear().domain([0, 30])
	},
	water: {
		maxScore: 30,
		label: 'Water',
		color: '#87b8a9',
		glyph: '💦', // HACK: http://www.entypo.com/characters/
		scale: d3.scale.linear().domain([0, 30])
	},
	human: {
		maxScore: 40,
		label: 'Human Experience',
		color: '#8180b3',
		glyph: '👤', // HACK: http://www.entypo.com/characters/
		scale: d3.scale.linear().domain([0, 40])
	}
};

var
	UPDATE_URL = '/update.json',
	margin = { top: 30, right: 60, bottom: 60, left: 60 },
	arcEnd = 1.5 * Math.PI,
	barMargin = 10,
	barWidth = 40,
	barPadded = barWidth + barMargin;

/* DATA FUNCTIONS */

var sum = function(arr) {
	return d3.sum(arr, function(obj) {
		return obj.val;
	});
};

/* DATA */

var DATA = [
	{ key: 'human', val: 40, prev: 40 },
	{ key: 'water', val: 30, prev: 30 },
	{ key: 'energy', val: 30, prev: 30 }
];

var
	count = DATA.length,
	half = count * barWidth, // TODO: better name
	diameter = count * half + 2 * count * barMargin,
	third = half + count * barMargin,
	radius = half + barMargin,
	width = diameter + margin.left + margin.right,
	height = diameter + margin.top + margin.bottom;

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
	.classed('main', true)
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
.append('g')
	.classed('container', true)
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

d3.json(UPDATE_URL, function(error, data) {
	if (error) { return; }
	
	// Total Score
	var total = svg.append('g')
		.classed('sum', true);

	total.append('circle')
		.classed('outer', true)
		.attr('cx', width / 2)
		.attr('cy', height / 2 + 15)
		.attr('r', half)
		.style('fill', '#888');

	total.append('circle')
		.classed('inner', true)
		.attr('cx', width / 2)
		.attr('cy', height / 2 + 15)
		.attr('r', half - 20)
		.style('fill', '#888')
		.attr('stroke', '#eee')
		.attr('stroke-width', 4);

	total.append('text')
		.classed('value', true)
		.attr('x', width / 2)
		.attr('y', height / 2 + 15)
		.attr('dy', '.35em')
		.attr('text-anchor', 'middle')
		.attr('font-size', 100)
		.style('fill', '#eee')
		.text(sum(data));

	// Extensions
	var ext = svg.append('g')
		.classed('extensions', true)
		.selectAll('rect')
		.data(data).enter();

	ext.append('rect')
		.classed('horiz', true)
		.attr('y', function(d, i) { return i * (barWidth + barMargin); })
		.attr('width', width / 2)
		.attr('height', barWidth)
		.style('fill', function(d) { return metaData[d.key].color; });

	ext.append('rect')
		.classed('vert', true)
		.attr('x', function(d, i) { return i * barPadded; })
		.attr('width', barWidth)
		.attr('height', half)
		.style('fill', '#555')
		.attr('transform', 'translate(0,' + third + ')');

	// Extension Labels
	ext.append('text')
		.attr('x', 0)
		.attr('y', function(d, i) { return i * (barWidth + barMargin) + (barWidth / 2); })
		.attr('dx', 15)
		.attr('dy', '.35em')
		.attr('text-anchor', 'left')
		.text(function(d) { return metaData[d.key].label.toUpperCase(); });

	// Extension Icons
	ext.append('text')
		.classed('icon', true)
		.attr('x', 0)
		.attr('y', function(d, i) { return i * (barWidth + barMargin) + (barWidth / 2); })
		.attr('dx', -25)
		.attr('dy', 0)
		.attr('text-anchor', 'middle')
		.attr('font-size', 60)
		.style('fill', function(d) { return metaData[d.key].color; })
		.style('dominant-baseline', 'central')
		.text(function(d) { return metaData[d.key].glyph; });

	// Bar Container
	var bars = svg.append('g')
		.classed('bars', true)
		.attr('transform', 'translate(' + width / 2 + ', 270)')
		.selectAll('g.bar')
		.data(data.reverse()) // HACK: Shouldn't need this
	.enter().append('g').classed('bar', true);

	// Background Bars
	bars.append('path')
		.attr('d', bgArc)
		.classed('bg', true)
		.style('fill', '#555');

	// Score Bars
	bars.append('path')
		.attr('d', scoreArc)
		.classed('score', true)
		.style('fill', function(d) { return metaData[d.key].color; });

	// Scores
	bars.append('text')
		.classed('score', true)
		.attr('transform', function(d, i) { return 'translate(' + scoreArc.centroid(d, i) + ')'; })
		.attr('dy', '.35em')
		.attr('text-anchor', 'middle')
		.text(function(d) { return d.val; });

	setInterval(updateScore, 5000);
});

/* AJAX */

var updateScore = function() {
	d3.json(UPDATE_URL, function(error, update) {
		if (error) { return; } // TODO: alert the user somehow

		var same = update.every(function(obj) {
			return obj.val === obj.prev;
		});

		if (same) { return; }

		console.log(svg.select('g.sum text.value').text());

		var bar = svg.selectAll('g.bar')
			.data(update.reverse()); // HACK: Shouldn't need this
		
		bar.select('path.score')
			.transition()
				.duration(1000)
				.attrTween('d', arcTween);

		bar.select('text.score')
			.transition()
				.duration(1000)
				.attr('transform', function(d, i) { return 'translate(' + scoreArc.centroid(d, i) + ')'; })
				.text(function(d) { return d.val; });

		var
			sumSvg = svg.select('g.sum text.value'),
			oldSum = parseInt(sumSvg.text(), 10),
			newSum = sum(update);

		// no change; don't animate
		if (oldSum === newSum) { return; }

		sumSvg
			.transition()
				.duration(500)
				.style('fill-opacity', 1e-6) // 0
			.transition()
				.duration(500)
				.text(newSum)
				.style('fill-opacity', 1);
	});
};
