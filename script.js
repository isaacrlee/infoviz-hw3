const width = 480;
const height = (width / 50) * 47;
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

var court = draw_court();
var full_data; // full data
var shot_g = court.append("g");

const shot_xScale = d3
  .scaleLinear()
  .domain([-250, 250])
  .range([margin.left, innerWidth]);

const shot_yScale = d3
  .scaleLinear()
  .domain([-45, 420])
  .range([margin.top, innerHeight]);

addShots();


function getAllPlayers() {
  document.getElementById("players").innerHTML = ""; //clear previous team

  var players=[]
  full_data.forEach(function(d) {
    if (!players.includes(d.name)) {
      players.push(d.name);
    }

  });
  players.sort();
  players.unshift("All Team Players");
  var playerSelect=document.getElementById("players");
  playerSelect.innerHTML = ""; //clear previous team
  players.forEach(function(d) {
    var option = document.createElement("option");
    option.text = d;
    playerSelect.add(option);
  });

}

d3.select("#inds").on("change", function() {
  var sect = document.getElementById("inds");
  var section = sect.options[sect.selectedIndex].value;
  console.log(section);
  if (section=="All") {

    var data= full_data;
    //getAllPlayers(); if want to have every player available for All Teams options??
    document.getElementById("players").innerHTML = ""; //clear previous team

  }
  else {
    var data = full_data.filter(function(d) {
      if (d.teamName === section) {
        return d;
      }
    });
    //populate player selection
    var players=[]
    data.forEach(function(d) {
      if (!players.includes(d.name)) {
        players.push(d.name);
      }

    });
    players.sort();
    players.unshift("All Team Players");
    var playerSelect=document.getElementById("players");
    playerSelect.innerHTML = ""; //clear previous team
    players.forEach(function(d) {
      var option = document.createElement("option");
      option.text = d;
      playerSelect.add(option);
    });
  }
  calcHex(data);

  //renderShots(data);
});

d3.select("#players").on("change", function() {
  var sect = document.getElementById("players");
  var section = sect.options[sect.selectedIndex].value;
  var team = document.getElementById("inds");
  var selected_team = team.options[team.selectedIndex].value;
  var team_data=full_data.filter(function(d) {
    if (d.teamName === selected_team) {
      return d;
    }
  });
  if (section=="All Team Players") {

    var data= team_data;
  }
  else {
    var data = team_data.filter(function(d) {
      if (d.name === section) {
        //console.log(d);
        return d;
      }
    });
  }
  calcHex(data);

  //renderShots(data);
});





var div = d3.select("body").append("div")
.attr("class", "tooltip")
.style("opacity", 0);


function addShots() {
  // Shots
  d3.csv("nba_savant.csv", function(d) {
    return {
      name: d.name,
      teamName: d.team_name,
      shotMadeFlag: d.shot_made_flag,
      actionType: d.action_type,
      shotType: d.shot_type,
      x: d.x,
      y: d.y,
      date: d.game_date,
      attempts: 1
    };
  }).then(function(d) {
    full_data = d;

    //renderShots(full_data);
    //calcHex(full_data);
  });
}

var hexbin = d3.hexbin();
var yScale = d3.scaleLinear().domain([0, 47]).rangeRound([47, 0]);

function calcHex(data) {
  var toolTips = false,
        hexbin = d3.hexbin()
                .radius(1.2)
                .x(function(d) { return d.x; }) // accessing the x, y coords from the nested json key
                .y(function(d) { return yScale(d.y); });

  var coll = d3.nest()
  .key(function(d) {return [d.x, d.y]; })
  .rollup(function(v){return{
      made: d3.sum(v, function(d) {return d.shotMadeFlag}),
      //attempts: d3.sum(v, function(d){return d.attempts}),
      attempts: v.length,
      //shootingPercentage:  d3.sum(v, function(d) {return d.shotMadeFlag})/d3.sum(v, function(d){return d.attempts}),
      shootingPercentage:  d3.sum(v, function(d) {return d.shotMadeFlag})/(v.length)
  }})
  .entries(data);

  var finalData = [];
  coll.forEach(function(a){
    a.key = JSON.parse("[" + a.key + "]");
  });



  var hexBinCoords=hexbin(coll).map(getHexBinShootingStats);
  renderHex(coll);



}
function getHexBinShootingStats (data,index) {
        var attempts = d3.sum(data, function(d) { return d.value.attempts; })
        var makes = d3.sum(data, function(d) { return d.value.made; })
        var shootingPercentage = makes/attempts;
        data.shootingPercentage = shootingPercentage;
        data.attempts = attempts;
        data.makes = makes;
        return data;
};

function renderHex(coords) {
  var hexRadiusValues = [5, 7, 10],
        hexMinShotThreshold = 1,
        hexRadiusScale = d3.scaleQuantize().domain([0, 2]).range(hexRadiusValues);
  var heatScale = d3.scaleQuantize().domain([0, 1]).range(['#5458A2', '#6689BB', '#FADC97', '#F08460', '#B02B48']);
  var shots = shot_g.selectAll(".hex").data(coords, function(d){return d.key; });

  shots
    .enter()
    .append("path").attr("class","hex").merge(shots)
    .attr("transform", function(d) { return "translate(" + shot_xScale(d.key[0]) + "," + shot_yScale(d.key[1]) + ")"; })
    .attr("d", hexbin.hexagon(0))
    .on('mouseover', function(d) { if (toolTips) {tool_tip.show(d);} })
    .on('mouseout', function(d) { if (toolTips) {tool_tip.hide(d);} })
    .transition().duration(1000)
    .attr("d", function(d) {
                if (d.value.attempts >= hexMinShotThreshold) {
                    if (d.value.made <= 2){
                        return hexbin.hexagon(hexRadiusScale(0));
                    }
                    else if (2 < d.value.made && d.value.made <= 5){
                        return hexbin.hexagon(hexRadiusScale(1));
                    }
                    else {
                        return hexbin.hexagon(hexRadiusScale(2));
                    }
                }
            })
    .style("fill", function(d) { return heatScale(d.value.shootingPercentage); });

    shots.exit()
      .transition().style("opacity", 0)//.duration(1000)
      .attr("d", hexbin.hexagon(0))
      .remove();
}


function renderShots(data) {
  var shots = shot_g.selectAll("circle").data(data);
  shots
    .enter()
    .append("circle")
    .merge(shots).style("opacity", 0)
    .attr("cx", d => shot_xScale(d.x))
    .attr("cy", d => shot_yScale(d.y))
    .attr("r", 5)
    .attr("stroke", d => (d.shotMadeFlag == 1 ? "red" : "blue"))
    .attr("fill", "none")
    // .transition()
    // .style("opacity", 1).delay(300).duration(1000).ease(d3.easeLinear);
    .on("mouseover", function(d) {

      div.transition()
      .duration(100)
      .style("opacity", .9);
      div.html("Player: "+d.name+"<br>Shot Type: "+d.actionType+"<br>Date: "+d.date)
      .style("left", (d3.event.pageX ) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
        div.transition()
        .duration(500)
        .style("opacity", 0);
      })
      .transition()
      .style("opacity", 1).delay(300).duration(1000).ease(d3.easeLinear);



  shots.exit().transition()
      .style("opacity", 0).duration(1000)
      .remove();
}

function draw_court() {
  var chartDiv = document.getElementById("court");

  var court = d3
    .select(chartDiv)
    .append("court")
    .append("svg");
  court.attr("width", width).attr("height", height);

  var court_g = court.append("g");
  court_g.attr("width", width).attr("height", height);

  const court_xScale = d3.scaleLinear().domain([-25, 25]);
  const court_yScale = d3.scaleLinear().domain([-4, 43]);
  court_xScale.range([margin.left, innerWidth]).nice();
  court_yScale.range([margin.top, innerHeight]).nice();

  var Basket = court_g.append("circle");
  var CornerThreeLeft = court_g.append("rect");
  var CornerThreeRight = court_g.append("rect");
  var ThreeLine = court_g.append("path");

  Basket.attr("cx", court_xScale(0))
    .attr("cy", court_yScale(-0.75))
    .attr("r", court_yScale(0.75) - court_yScale(0))
    .style("fill", "None")
    .style("stroke", "black");

  CornerThreeLeft.attr("x", court_xScale(-22))
    .attr("y", court_yScale(-4))
    .attr("width", 1)
    .attr("height", court_yScale(10) - court_yScale(-4))
    .style("fill", "none")
    .style("stroke", "black");

  CornerThreeRight.attr("x", court_xScale(22))
    .attr("y", court_yScale(-4))
    .attr("width", 1)
    .attr("height", court_yScale(10) - court_yScale(-4))
    .style("fill", "none")
    .style("stroke", "black");

  var angle = (Math.atan((10 - 0.75) / 22) * 180) / Math.PI;
  var dis = court_yScale(18);
  appendArcPath(
    ThreeLine,
    dis,
    (angle + 90) * (Math.PI / 180),
    (270 - angle) * (Math.PI / 180)
  )
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("class", "shot-chart-court-3pt-line")
    .attr(
      "transform",
      "translate(" + court_xScale(0) + ", " + court_yScale(0) + ")"
    );

  return court;
}

function appendArcPath(base, radius, startAngle, endAngle) {
  var points = 30;

  var angle = d3
    .scaleLinear()
    .domain([0, points - 1])
    .range([startAngle, endAngle]);

  var line = d3
    .lineRadial()
    .radius(radius)
    .angle(function(d, i) {
      return angle(i);
    });

  return base.datum(d3.range(points)).attr("d", line);
}
