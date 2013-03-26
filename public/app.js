/*
TODO:
- fix data reversal issue, replace with .data(data, getKey)
- replace hard-coded positions with math
- replace offset math with d3.scale objects (rangeBands)
- work out glyph solution, maybe with <foreignObject>?
- remove :prev from JSON, replace with in-place
- add warning on disconnect
- add localStorage
- investigate d3 usage for canvas manipulation
- formalize config usage
- more comments
*/

/* CONFIG */

var CONFIG = {
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

var
	COUNT = 3,
	half = COUNT * barWidth, // TODO: better name
	diameter = COUNT * half + 2 * COUNT * barMargin,
	third = half + COUNT * barMargin,
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
	.endAngle(function(d) { return CONFIG[d.key].scale(d.val) * arcEnd; })
	.innerRadius(function(d, i) { return radius + i * barPadded; })
	.outerRadius(function(d, i) { return radius + i * barPadded + barWidth; });

var arcTween = function(b, i) {
	var x = d3.interpolate({ val: b.prev }, b);
	return function(t) {
		return scoreArc(x(t), i);
	};
};

// adapted from d3.arc.centroid
var arcLabel = function(arc, d, i) {
	var
		offset = -Math.PI / 2, padding = 3 * Math.PI / 180, // 3 degrees
		r = (arc.innerRadius()(d, i) + arc.outerRadius()(d, i)) / 2,
		a = (arc.startAngle()(d) + arc.endAngle()(d)) + offset - padding;
	return [Math.cos(a) * r, Math.sin(a) * r];
};

var updateFavicon = function(total) {
	var
		canvas = document.getElementById('scratch'),
		link = document.getElementById('favicon'),
		ctx, fontSize;

	if (canvas.getContext) {
		canvas.height = canvas.width = 16;
		ctx = canvas.getContext('2d');
		fontSize = (total > 99) ? 7 : 11;
		ctx.font = 'bold ' + fontSize + 'px \'Lato\', sans-serif';
		ctx.fillStyle = '#000';
		ctx.fillText(total, 2, 12);
		link.href = canvas.toDataURL();
	}
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
		.style('fill', function(d) { return CONFIG[d.key].color; });

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
		.text(function(d) { return CONFIG[d.key].label.toUpperCase(); });

	ext.append('text')
		.attr('x', function(d, i) { return i * (barWidth + barMargin) + (barWidth / 2); })
		.attr('y', third + 25)
		.attr('font-size', 25)
		.attr('text-anchor', 'middle')
		.style('fill', '#888')
		.text(function(d) { return CONFIG[d.key].maxScore; });

	// Extension Icons
	ext.append('text')
		.classed('icon', true)
		.attr('x', 0)
		.attr('y', function(d, i) { return i * (barWidth + barMargin) + (barWidth / 2); })
		.attr('dx', -25)
		.attr('dy', 0)
		.attr('text-anchor', 'middle')
		.attr('font-size', 60)
		.style('fill', function(d) { return CONFIG[d.key].color; })
		.style('dominant-baseline', 'central')
		.text(function(d) { return CONFIG[d.key].glyph; });

	// Bar Container
	var bars = svg.append('g')
		.classed('bars', true)
		.attr('transform', 'translate(' + width / 2 + ', 270)')
		.selectAll('g.bar')
		.data(data.reverse())
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
		.style('fill', function(d) { return CONFIG[d.key].color; });

	// Scores
	bars.append('text')
		.classed('score', true)
		.attr('transform', function(d, i) {
			return 'translate(' + arcLabel(scoreArc, d, i) + ')';
		})
		.attr('dy', '.35em')
		.attr('text-anchor', 'middle')
		.text(function(d) { return d.val; });

	updateFavicon(sum(data));
	setInterval(updateScore, 5000);
});

/* AJAX */

var updateScore = function() {
	d3.json(UPDATE_URL, function(error, update) {
		if (error) { return; } // TODO: alert the user somehow

		var same = update.every(function(obj) {
			return obj.val === obj.prev;
		});

		// no change; don't animate
		if (same) { return; }

		var bar = svg.selectAll('g.bar')
			.data(update.reverse());
		
		bar.select('path.score')
			.transition()
				.delay(250) // hide labels first
				.duration(500)
				.attrTween('d', arcTween);

		bar.select('text.score')
			.transition() // fade out labels
				.duration(250)
				.style('fill-opacity', 1e-6) // 0
			.transition() // animate bars
				.duration(500)
				.attr('transform', function(d, i) { return 'translate(' + arcLabel(scoreArc, d, i) + ')'; })
			.transition() // fade labels back in
				.duration(250)
				.style('fill-opacity', 1)
				.text(function(d) { return d.val; });

		var
			sumSvg = svg.select('g.sum text.value'),
			oldSum = parseInt(sumSvg.text(), 10),
			newSum = sum(update);

		// no change; don't animate
		if (oldSum === newSum) { return; }

		updateFavicon(newSum);

		sumSvg
			.transition()
				.duration(250)
				.style('fill-opacity', 1e-6) // 0
			.transition()
				.delay(500)
				.duration(250)
				.text(newSum)
				.style('fill-opacity', 1);
	});
};
