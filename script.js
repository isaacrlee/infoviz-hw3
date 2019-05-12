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

  renderShots(data);
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

  renderShots(data);
});




var hexbin = d3.hexbin();

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
      date: d.game_date
    };
  }).then(function(d) {
    full_data = d;
    renderShots(full_data);
  });
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

    console.log("mouseover");
      div.transition()
      .duration(100)
      .style("opacity", .9);
      div.html("Player: "+d.name+"<br>Shot Type: "+d.actionType+"<br>Date: "+d.date)
      .style("left", (d3.event.pageX ) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
    })
    .on("mouseout", function(d) {
      console.log("mouseout");
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
