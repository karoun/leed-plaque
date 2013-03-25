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
	UPDATE_URL = '/update.json',
	margin = { top: 60, right: 60, bottom: 60, left: 60 },
	width = 800 - margin.left - margin.right,
	height = 600 - margin.top - margin.bottom,
	arcEnd = 1.5 * Math.PI,
	barMargin = 10,
	barWidth = 40,
	barPadded = barWidth + barMargin;

/* DATA */

var DATA = [
	{ key: 'human', val: 40, prev: 40 },
	{ key: 'water', val: 30, prev: 30 },
	{ key: 'energy', val: 30, prev: 30 }
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
	.classed('main', true)
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
.append('g')
	.classed('container', true)
	.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

d3.json(UPDATE_URL, function(error, data) {
	if (error) { return; }
	
	var sum = svg.append('g')
		.classed('sum', true);

	sum.append('circle')
		.classed('outer', true)
		.attr('cx', width / 2)
		.attr('cy', height / 2 + DATA.length * barMargin)
		.attr('r', half)
		.style('fill', '#888');

	sum.append('circle')
		.classed('inner', true)
		.attr('cx', width / 2)
		.attr('cy', height / 2 + DATA.length * barMargin)
		.attr('r', half - 20)
		.style('fill', '#888')
		.attr('stroke', '#eee')
		.attr('stroke-width', 4);

	sum.append('text')
		.classed('value', true)
		.attr('x', width / 2)
		.attr('y', height / 2 + DATA.length * barMargin)
		.attr('dy', '.35em')
		.attr('text-anchor', 'middle')
		.attr('font-size', 100)
		.style('fill', '#eee')
		.text(function() { return d3.sum(DATA, function(d) { return d.val; }); });

	// Extensions
	var ext = svg.append('g')
		.classed('extensions', true)
		.selectAll('rect')
		.data(DATA).enter();

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
		.attr('transform', 'translate(70, 150)');

	// Extension Labels
	ext.append('text')
		.attr('x', 0)
		.attr('y', function(d, i) { return i * (barWidth + barMargin) + (barWidth / 2); })
		.attr('dx', 15)
		.attr('dy', '.35em')
		.attr('text-anchor', 'left')
		.text(function(d) { return metaData[d.key].label.toUpperCase(); });

	// Bar Container
	var bars = svg.append('g')
		.classed('bars', true)
		.attr('transform', 'translate(' + width / 2 + ', 270)')
		.selectAll('g.bar')
		.data(DATA.reverse()) // HACK: Shouldn't need this
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
});

/* AJAX */

var updateScore = function() {
	d3.json(UPDATE_URL, function(error, update) {
		if (error) { return; } // TODO: alert the user somehow

		var sum = d3.sum(update, function(obj) {
			return obj.val;
		});

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

		svg.select('g.sum text.value')
			.transition()
				.duration(500)
				.style('fill-opacity', 1e-6) // 0
			.transition()
				.duration(500)
				.text(sum)
				.style('fill-opacity', 1);
	});
};

updateScore();
setInterval(updateScore, 5000);