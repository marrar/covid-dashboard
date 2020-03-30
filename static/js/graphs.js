queue()
    .defer(d3.json, "/data")
    .await(makeGraphs);

function makeGraphs(error, recordsJson) {
	
	//Clean data
	var records = recordsJson;
        //var dateFormat = d3.time.format("%m/%d/%y %H:%M");	
	var dateFormat = d3.time.format("%d/%m/%Y");
	records.forEach(function(d) {
		d["timestamp"] = dateFormat.parse(d["timestamp"]);
//		d["timestamp"].setHours(0);
//		d["timestamp"].setMinutes(0);
		d["longitude"] = +d["longitude"];
		d["latitude"] = +d["latitude"];
	});

	//Dejo sólo los del año 2020
	records = records.filter(d => {
		if (d["timestamp"].toString().slice(11,15) !== '2020'){
			console.log(d);
		}
		return d["timestamp"].toString().slice(11,15) === '2020'
	});

	//Create a Crossfilter instance
	var ndx = crossfilter(records);

	//Define Dimensions
	var dateDim = ndx.dimension(function(d) { return d["timestamp"]; });
	var genderDim = ndx.dimension(function(d) { return d["gender"]; });
	var ageSegmentDim = ndx.dimension(function(d) { return d["age_segment"]; });
	var symptomsDim = ndx.dimension(function(d) { return d["symptoms"]; });
	var locationdDim = ndx.dimension(function(d) { return d["location"]; });
	var allDim = ndx.dimension(function(d) {return d;});


	//Group Data
	var numRecordsByDate = dateDim.group();
	var genderGroup = genderDim.group();
	var ageSegmentGroup = ageSegmentDim.group();
	var symptomsGroup = symptomsDim.group();
	var locationGroup = locationdDim.group();
	var all = ndx.groupAll();


	//Define values (to be used in charts)
	var minDate = dateDim.bottom(1)[0]["timestamp"];
	var maxDate = dateDim.top(1)[0]["timestamp"];


    //Charts
    var numberRecordsND = dc.numberDisplay("#number-records-nd");
	var timeChart = dc.barChart("#time-chart");
	var genderChart = dc.rowChart("#gender-row-chart");
	var ageSegmentChart = dc.rowChart("#age-segment-row-chart");
	var symptomsChart = dc.rowChart("#phone-brand-row-chart");
	var locationChart = dc.rowChart("#location-row-chart");



	numberRecordsND
		.formatNumber(d3.format("d"))
		.valueAccessor(function(d){return d; })
		.group(all);


	timeChart
		.width(750)
		.height(140)
		.margins({top: 10, right: 50, bottom: 20, left: 20})
		.dimension(dateDim)
		.group(numRecordsByDate)
		.transitionDuration(500)
		.x(d3.time.scale().domain([minDate, maxDate]))
		.elasticY(true)
		.yAxis().ticks(4);

	genderChart
        .width(300)
        .height(150)
        .dimension(genderDim)
        .group(genderGroup)
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(4);

	ageSegmentChart
		.width(300)
		.height(150)
        .dimension(ageSegmentDim)
        .group(ageSegmentGroup)
        .colors(['#6baed6'])
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(4);

	symptomsChart
		.width(300)
		.height(310)
        .dimension(symptomsDim)
        .group(symptomsGroup)
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .xAxis().ticks(4);

    locationChart
    	.width(290)
		.height(662)
        .dimension(locationdDim)
        .group(locationGroup)
        .ordering(function(d) { return -d.value })
        .colors(['#6baed6'])
        .elasticX(true)
        .labelOffsetY(10)
        .xAxis().ticks(4);

    var map = L.map('map');
    map.setView([-34.6,-58.4], 10);

let arr = [];
	var drawMap = function(){
		mapLink = '<a href="http://openstreetmap.org">OpenStreetMap</a>';
		L.tileLayer(
			'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: '&copy; ' + mapLink + ' Contributors',
				maxZoom: 20,
			}).addTo(map);

		//Circles
	
		var geoData = [];
		_.each(allDim.top(Infinity), function (d) {
			geoData.push([d["latitude"], d["longitude"], 1]);
	      });
		  	  

		arr = [];
		let radius = getRadius();
		for (var i=0; i<geoData.length;i++){
			let ArrLatLng= [geoData[i][0], geoData[i][1]]
			// El 10 es el radio del Circle 
			arr[i] = L.circleMarker(L.latLng(ArrLatLng), {
				radius: radius,
				color: '#ff3f00',
				fillColor: '#ff3f00',
    			fillOpacity: 1
			}).addTo(map); 
		}


	};

	var getRadius = function() {
	  	let zoom = map.getZoom() 

		// Multiply that by a factor based on how large the circle should appear on the screen
		let radius = zoom * 0.05;
		if (zoom >= 18) {
			radius = zoom * 0.5;
		} else if (zoom >= 16) {
			radius = zoom * 0.5;
		} else if (zoom >= 15) {
 			radius = zoom * 0.25;
		} else if (zoom >= 14) {
 			radius = zoom * 0.2;
		} else if (zoom >= 13) {
 			radius = zoom * 0.15;
		} else if (zoom >= 12) {
 			radius = zoom * 0.1;
		}

		return radius;
	};

	map.on('zoomend', function (e) {
		let zoom = getRadius();
		for (let i=0; i<arr.length; i++){
			arr[i].setRadius(zoom);
		}
	});
	


	//Draw Map
	drawMap();

	//Update the circles if any dc chart get filtered
	dcCharts = [timeChart, genderChart, ageSegmentChart, symptomsChart, locationChart];

	_.each(dcCharts, function (dcChart) {
		dcChart.on("filtered", function (chart, filter) {
			map.eachLayer(function (layer) {
				map.removeLayer(layer)
			}); 
			drawMap();
		});
	});

	dc.renderAll();

};
