jQuery(function($) {

	var initial = [{ val: 19, max: 30 }, { val: 26, max: 30 }, { val: 8, max: 40 }];

	var ratio = function(obj) {
		return obj.val / obj.max;
	};

	var transformed = _(initial).map(ratio);

	var WIDTH = 420;
	var HEIGHT = 40 * transformed.length;

	var x = d3.scale.linear()
		.domain([0, 1])
		.range([0, WIDTH]);

	var y = d3.scale.ordinal()
		.domain(transformed)
		.rangeBands([0, HEIGHT]);
	
	var chart = d3.select("body").append("svg")
		.attr("class", "chart")
		.attr("width", WIDTH)
		.attr("height", HEIGHT);

	chart.selectAll("rect")
		.data(transformed)
	.enter().append("rect")
		.attr("y", y)
		.attr("width", x)
		.attr("height", y.rangeBand());

	chart.selectAll("text")
		.data(transformed)
	.enter().append("text")
		.attr("class", "bar")
		.attr("x", x)
		.attr("y", function(d) { return y(d) + y.rangeBand() / 2; })
		.attr("dx", -3)
		.attr("dy", ".35em")
		.attr("text-anchor", "end")
		.text(function(d) { return d.toFixed(2) * 100 + '%'; });

	chart.append("line")
		.attr("x1", WIDTH - 0.5)
		.attr("x2", WIDTH - 0.5)
		.attr("y1", 0)
		.attr("y2", HEIGHT * transformed.length)
		.style("stroke", "#000");

	var updateBars = function() {
		$.getJSON('/update.json', function(data) {

			var _data = _(data);

			var sum = _data.reduce(function(prev, obj) {
				return prev + obj.val;
			}, 0);

			var newData = _data.map(ratio);

			chart.selectAll("rect")
				.data(newData)
			.transition()
				.duration(1000)
				.attr("width", x);

			chart.selectAll("text")
				.data(newData)
			.transition()
				.duration(1000)
				.attr("x", x)
				.text(function(d) { return d.toFixed(2) * 100 + '%'; });
		});
	};

	updateBars();
	setInterval(updateBars, 5000);

});