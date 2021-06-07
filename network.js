const graphWidth  = (window.innerWidth || document.documentElement.clientWidth ||
document.body.clientWidth) * .75;
const graphHeight = (window.innerHeight|| document.documentElement.clientHeight||
document.body.clientHeight) * .98;
var margin = {top: 30, right: 30, bottom: 40, left: 100};
var width = graphWidth - margin.left - margin.right;
var height = graphHeight;
var link, node, edgepaths, simulation;
var g = "#graphArea";
var selectedData;
var svg

window.addEventListener('load', createVariables(), false);
window.addEventListener('click', function(e){
  if (!document.getElementById('grades').contains(e.target) && !document.getElementById("variables").contains(e.target)){
    document.getElementById("grades").style.visibility = "hidden"
  }
});

function createVariables(){
    d3.json("data.json", function(json) {
    //console.log(json)
    var length = json.nodes.length
    container = document.getElementById("variables")
    for(i = 0; i < length; i++)
    {
      lab = document.createElement('label')
      lab.setAttribute("class", "checkLabel")
      lab.textContent = json.nodes[i].name
      lab.onclick = gradeGraph
      box = document.createElement('input')
      box.setAttribute('type', 'checkbox')
      box.setAttribute('id', 'varOption')
      box.setAttribute('name', i)
      container.append(box)
      container.append(lab)

      container.append(document.createElement('br'))
    }
  })
}

function gradeGraph(name)
{
  courseName = name.target.textContent
  document.getElementById("grades").style.visibility = "visible"
  var localHeight = 600 - margin.bottom - margin.top;
  var localWidth = 800 - margin.left - margin.right;
  d3.json("formattedF19.json", function(json) {
    //console.log(json)
    for(i = 0; i < json.courses.length; i++)
    {
      data = []
      count = 0
      if(json.courses[i].name === courseName)
      {
        grades = {'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'D-': 0, 'F': 0, 'W': 0}
        for (key in grades) {
          data.push({letter: key, count: json.courses[i][key]})
        }
        //console.log(data)
        break;
      }
    }
    d3.select("#grades").html("")
    svg = d3.select("#grades")
    .append("svg")
      .classed("graph", true)
      .attr("width", localWidth + margin.left + margin.right)
      .attr("height", localHeight + margin.bottom + margin.top)
      .append("g")
        .attr("transform",
              "translate(" + margin.left + "," + margin.top + ")");
          var x = d3.scaleBand()
        .range([ 0, localWidth ])
        .domain(data.map(function(d) { return d.letter; }))
        .padding(0.2);
      svg.append("g")
        .attr("transform", "translate(0," + localHeight + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
          .style("text-anchor", "end");

      var y = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) {return +d.count})])
        .range([ localHeight, 0]);
      svg.append("g")
        .call(d3.axisLeft(y));
        svg.append("text")
          .attr("text-anchor", "end")
          .attr("x", 40)
          .attr("y", -5)
          .text(""+courseName)

      svg.selectAll("mybar")
        .data(data)
        .enter()
        .append("rect")
          .attr("x", function(d) { return x(d.letter); })
          .attr("y", function(d) { return y(d.count); })
          .attr("width", x.bandwidth())
          .attr("height", function(d) { return localHeight - y(d.count); })
          .attr("fill", "#69b3a2")
  })
}

function clearVariables(){
  cbs = document.querySelectorAll('#varOption');
  for (const cb of cbs)
  {
      cb.checked = false
  }
}

function clearGraphs()
{
    d3.select(g).html("")
  selectedData = []
  cbs = document.querySelectorAll('input');
            for (i = 0; i < cbs.length; i++)
            {
                if (cbs[i].checked)
                {selectedData.push(i)}
            }

  svg = d3.select(g)
  .append("svg")
    .classed("graph", true)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height)
    .append("g")
      .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");
}
function network()
{
  clearGraphs()

  const forceX = d3.forceX(width / 2).strength(.05)
  const forceY = d3.forceY(height / 2).strength(.05)

  simulation = d3.forceSimulation()
          .force("link", d3.forceLink().id(function (d) {return d.group;}).distance(100).strength(1))
          .force("charge", d3.forceManyBody().strength(-300))
          .force("x", forceX)
          .force("y", forceY)
          .force("collide", d3.forceCollide());

  svg.append('defs').append('marker')
        .attrs({'id':'arrowhead',
            'viewBox':'-0 -5 10 10',
            'refX':13,
            'refY':0,
            'orient':'auto',
            'markerWidth':13,
            'markerHeight':13,
            'xoverflow':'visible'})
        .append('svg:path')
        .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
        .attr('fill', '#999')
        .style('stroke','none');

d3.json("data.json", function(json) {
  link = svg.selectAll(".link")
          .data(json.links)
          .enter()
          .append("line")
          .attr("class", "link")
          .attr("marker-end", "url(#arrowhead)")
          .style("visibility", function(d){for(j=0;j<selectedData.length;j++){if(d["source"] == selectedData[j] + 1 || d["target"] == selectedData[j] + 1){return "hidden"}};})

      node = svg.selectAll(".node")
          .data(json.nodes)
          .enter()
          .append("g")
          .attr("class", "node")
          .call(d3.drag()
                      .on("start", dragstarted)
                      .on("drag", dragged)
              );
      node.append("circle")
          .attr("r", 10)
          .style("fill", function (d, i) {return "rgba("+ Math.round(Math.random()*128+128)+","+Math.round(Math.random()*128+128)+","+Math.round(Math.random()*128+128)+",.8)"})
          .style("stroke", function (d, i) {return "rgba(0,0,0,0)"})
          .style("visibility", function(d, i){for(j=0;j<selectedData.length;j++){if(i == selectedData[j]){return "hidden"}};});
      node.append("text")
          .attr("dy", -3)
          .text(function (d) {return d.name;})
          .style("visibility", function(d, i){for(j=0;j<selectedData.length;j++){if(i == selectedData[j]){return "hidden"}}});
      simulation
          .nodes(json.nodes)
          .on("tick", ticked)
      simulation.force("link")
          .links(json.links);
      });
}

function ticked() {
    link
        .attr("x1", function (d) {return d.source.x;})
        .attr("y1", function (d) {return d.source.y;})
        .attr("x2", function (d) {return d.target.x;})
        .attr("y2", function (d) {return d.target.y;});

    node
        .attr("transform", function (d) {return "translate(" + d.x + ", " + d.y + ")";});
}

function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart()
        d.fx = d.x;
        d.fy = d.y;
    }

function dragged(d) {
    d.fx = d3.event.x;
    d.fy = d3.event.y;
}
