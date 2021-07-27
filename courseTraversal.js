var file, json, nodes, links
var plan
var selectedData = []
var maxClasses = 5

function loadFile() {
  clearGraphs()
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      file = this
      json = JSON.parse(file.response)
      nodes = json.nodes
      links = json.links
      breadthFirst()
      showSchedule()
    }
  };
  xhttp.open("GET", "./data.json", true);
  xhttp.send();
}

//TODO: Make a better iterator than going from node 0 to 32 or whatever
//TODO: Have the list of future courses also be pulled from the newly added items
//      Probably push those classes to the LIST

function breadthFirst() {
  const startNode = 0
  const endNode = 32
  var currentNode = startNode
  plan = []
  var nextSemester = []
  var addedCourses = false
  var list = [] //consists of links so node index + 1

  var completed = getCompleted()

  //creates a first year semester plan by checking to see if there are prereqs
  for(i = 0; i < nodes.length; i++) {
    var good = true
    for(j = 0; j < links.length; j++) {
      //if there are prereqs then it is no good
      //it also has to take into account previously completed courses
      if(links[j].target == i + 1 && selectedData.indexOf(links[j].source - 1) == -1) {
        good = false
      }
      //if the node was found in the "completed" set of checkboxes
      if(selectedData.indexOf(i) != -1) {
        good = false
      }
    }
    //if it is good then we add the course to our semester
    if(good) {
      nextSemester.push(nodes[i].name)
      //if the semester is full then we push it to next semester
      if(nextSemester.length >= maxClasses) {
        plan.push(nextSemester)
        nextSemester = []
      }
    }
  }


  for(test = 0; test < 4; test++){
    if(plan.length != 0) {
      for(i = 0; i < plan[plan.length - 1].length; i++) {
        for(j = 0; j < links.length; j++){
          if(nodes[links[j].source - 1] === plan[plan.length - 1][i]) {
            list.push(links[j].target)
          }
        }
      }
    }

  for(currentNode = startNode; currentNode < endNode; currentNode++) {
    //var list = []

    //adds additional potentially takeable courses from the completed courses boxes
    if(!addedCourses) {
      for(j = 0; j < selectedData.length; j++) {
        for(k = 0; k < links.length; k++) {
          if(links[k].source == selectedData[j] + 1) {
            list.push(links[j].target)
          }
        }
      }
      addedCourses = true
    }

    for(j = 0; j < links.length; j++) {
      //find all the courses that have currentNode as the prereq and add it to a list
      //then run through the list and see if all the prereqs are met
      //if yes then add it to the nextSemester array
      //if not then toss it out
      if(links[j].source == currentNode + 1) {
        list.push(links[j].target)
      }
    }
    console.log(list)
    //for all the upper level classes that have at least one prereq completed
    for(j = 0; j < list.length; j++) {
      var good = true
      //now we find all the required prereqs for a specific course
      for(k = 0; k < links.length; k++) {
        //check to see if the specific edge connects to the upper level course
        if(links[k].target == list[j]) {
          var found = false
          //if it does, we check to see if the prereq is in our plan
          for(l = 0; l < plan.length; l++) {
            //if the plan has that specific prereq, then we're good
            if(plan[l].indexOf(nodes[links[k].source - 1].name) != -1 || selectedData.indexOf(links[k].source - 1) != -1) {
              found = true
            }
            //incase the program tries adding a cousre the user has already completed
            if(selectedData.indexOf(links[k].target - 1) != -1) {
              found = false
            }
          }
          //if the plan doesn't have it, then the upper level course won't be added
          if(!found) {
            good = false
          }
        }
      }
      if(good) {
        var found = false
        //this makes sure no duplicate courses will be added to the overall plan
        for(l = 0; l < plan.length; l++) {
          if(plan[l].indexOf(nodes[list[j] - 1].name) != -1) {
            found = true
          }
        }
        //makes sure no duplicate courses are added to the semester
        if(nextSemester.indexOf(nodes[list[j] - 1].name) != -1) {
          found = true
        }
        //if this is a unique course, add it
        if(!found) {
          nextSemester.push(nodes[list[j] - 1].name)
        }
      }
      //if the class size for the semester hits the limit, we push it and start a new semester
      if(nextSemester.length >= maxClasses) {
        plan.push(nextSemester)
        nextSemester = []
      }
    }
  }
  //makes sure that any last classes are pushed assuming there are some
  if(nextSemester.length != 0) {
    plan.push(nextSemester)
    nextSemester = []
  }
}

  console.log(plan)
}

function showSchedule() {
  var body = document.getElementById("graphArea")

  //creates the container for the schedule
  var container = document.createElement("div")
  container.setAttribute("id", "grades")
  container.style.visibility = "visible"
  container.style.display = "flex"

  for(i = 0; i < plan.length; i++) {
    var card = document.createElement("div")
    card.setAttribute("id", "card")

    var title = document.createElement("p")
    title.textContent = "Semester " + (i + 1)
    if(plan[i].length > 0) {
      card.append(title)
    }

    //console.log(plan[i].length)
    for(j = 0; j < plan[i].length; j++) {
      var text = document.createElement("p")
      text.textContent = plan[i][j]
      text.setAttribute("class", "checkLabel")
      text.onclick = gradeGraph //might remove this because it's kinda annoying
      card.append(text)
    }

    container.append(card)
  }

  body.append(container)
}

function depthFirst() {
  //The start and ending nodes
  //Note: Link source and target ids start at 1 while Nodes start at 0
  const startNode = 30
  const endNode = 0
  var currentNode = 31
  var tree = [[nodes[currentNode - 1].name]]
  var potato = []
  var queue = [-1] //Array of group IDs

  //add getCompleted() later

  var finished = false
  while(!finished) {
    for(i = 0; i < links.length; i++) {
      if(links[i].target == currentNode) {
        queue.push(links[i].source)
        potato.push(nodes[links[i].source - 1].name)
      }
    }
    queue.push(-1)

    currentNode = queue[0]
    queue.splice(0, 1)

    if(currentNode == -1) {
      if(potato.length != 0) {
        tree.push(potato)
        potato = []
      }
    }

    if(currentNode == 3) { //should be calc 1
      break;
    }

  }
}

function getCompleted() {
  //Indices are all the same since they all come from the same json file
  selectedData = []
  cbs = document.querySelectorAll('input');
            for (i = 0; i < cbs.length; i++)
            {
                if (cbs[i].checked)
                {selectedData.push(i)}
            }

}
