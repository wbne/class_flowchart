//Data related to the file.
var file, json, courseNames, links
//The generated semesterly schedule
var plan = []
//The user's entire degree plan INCLUDING core courses later on.
var degreePlan = []
//Courses that can be taken this semester
var buffer = []
//Courses that have been completed prior to the schedule generation.
var preCompleted = []

//ALEKS score for reasons
//it won't be a boolean but atm I'm lazy
var aleks = true
//similar dealio. Probably have this implemented
var juniorStanding = true
var currentNumber = 0

//This constant will be pulled from another source in Nebula Web
const creditHourCap = 16
//This will be used when not enough classes are present in a sem
const creditHourMin = 12

// The start of the file. Loads the course infos into the website and executes the rest of the functions.
// In Nebula Web, the Course Degree Plan will also be pulled from an external source.
function loadFile() {
  clearGraphs()
  var xhttp = new XMLHttpRequest();
  xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
      file = this
      json = JSON.parse(file.response)
      courseNames = Object.keys(json)
	//This is the part where I'm supposed to load in the degree plan
	//However this is just a personal project so that is skipped
	getCompleted()
	initialize()
      breadthFirst()
      showSchedule()
    }
  };
  xhttp.open("GET", "./course_catalog2020.json", true);
  xhttp.send();
}

// Finds courses that can be taken immediately.
// Takes into account previously completed courses.
// For Nebula Web, I would have to account for transfer courses, AP credits, and previously completed courses.
// Also core requirement courses but I think those will go into a separate section and will fill in less busy semesters.
function initialize() {
	currentNumber = 0
	plan = []
	buffer = []
	for(i = 0; i < degreePlan.length; i++) {
		const index = courseNames.indexOf(degreePlan[i])
		const course = json[courseNames[index]]
		var thing = true
		for(j = 0; j < preCompleted.length; j++) {
			if(preCompleted[j] == courseNames[index]){
				thing = false
			}
		}
		if(thing && checkPrereqs(courseNames[index])) {
			buffer.push(courseNames[index])
		}
	}

	console.log([...plan])
	//now we add courses from the buffer to the degree plan
	var semester = []
	var sum = 0 
	var classCount = 0
	for(i = 0; i < buffer.length; i++) {
		var temp = sum + Number(json[buffer[i]].hours)
		if(temp <= creditHourCap) {
			semester.push(buffer[i])
			sum = temp
			classCount++
			preCompleted.push(buffer[i])
		}
		else {
			sum = 0
			plan.push([...semester])
			i = 0
			buffer.splice(0, classCount)
			classCount = 0
			semester = []
		}
	}

	//in case there isn't enough courses to fill a semester but enough to not be ignored
	if(sum > creditHourMin) {
		plan.push([...semester])
		for(i = 0; i < semester.length; i++) {
			preCompleted.push(buffer[i])
		}
		buffer = []
	}
}

function checkPrereqs(name) {
	//preCompleted && selectedData
	var course = json[name]
	var prereqs = []
	var coreqs = []
	//Either gets the prereqs or adds the course to the potential 1st semester courses.
	if(course.prerequisites.length > 0) {
		//console.log(course.prerequisites)
		for(j = 0; j < course.prerequisites.length; j++) {
			var splitCourses = course.prerequisites[j].split(" and ")
			if(course.prerequisites[j].includes("Corequisite")) {
				coreqs = splitCourses
			}
			else if(course.prerequisites[j].includes("Prerequisite")) {
				prereqs = splitCourses	
			}
		}
		// If there are prereqs, check if they have been met by checking the preCompleted array.
		// This array will include AP, Dual Credit, and other sources.
		// This is NOT the courses taken at UTD.
		var preReqCount = 0
		for(j = 0; j < prereqs.length; j++) {
			for(l = 0; l < preCompleted.length; l++ ) {
				if(prereqs[j].includes(preCompleted[l])) {
					preReqCount++
					break
				}
				//this is because they changed it from cs 3340 to cs 2340
				else if(preCompleted[l] == "CS 2340" && prereqs[j].includes("CS 3340")) {
					preReqCount++
					break
				}
			}
			if(prereqs[j].includes("ALEKS") && aleks) {
				preReqCount++
			}
			if(name == "ECS 3390" && currentNumber > 24) {
				//this is for corny hard coding
				return true
			}
			if(name == "CS 4485" && currentNumber > 24) {
				return true
			}
		}
		var coReqCount = 0
		for(j = 0; j < coreqs.length; j++) {
			for(l = 0; l < preCompleted.length; l++ ) {
				if(coreqs[j].includes(preCompleted[l])) {
					coReqCount++
				}
			}
		}
		if(coReqCount >= coreqs.length && preReqCount >= prereqs.length) {
			return true	
		}
	
		var coReqNames = []
		for(j = 0; j < coreqs.length; j++) {
			for(k = 0; k < degreePlan.length; k++) {
				//this makes it so OR courses are treated as AND...
				//if this is an issue I'll have to bug fix
				if(coreqs[j].includes(degreePlan[k])) {
					coReqNames.push(degreePlan[k])
				}	
			}
		}
		var coReqs = true
		//temporary buffer that *pretends* that the course has been taken
		preCompleted.push(name)
		for(j = 0; j < coReqNames.length; j++) {
			coReqs = coReqs && checkPrereqs(coReqNames[j])
		}
		preCompleted.splice(preCompleted.length - 1, 1)
		
		// Indicating possible courses that are takeable
		if(coReqs) {
			if(preReqCount == prereqs.length) {
				return true
			}
		}
	}
	else {
		return true
	}
	
	return false
}

function breadthFirst() {
	var daCount = 0
	var sanity = 0
	while(daCount <= degreePlan.length && sanity < 10) {
		daCount = 0
		sanity++
	for(i = 0; i < degreePlan.length; i++) {
		const index = courseNames.indexOf(degreePlan[i])
		const course = json[courseNames[index]]
		var thing = true
		for(j = 0; j < preCompleted.length; j++) {
			if(preCompleted[j] == courseNames[index]){
				thing = false
			}
		}
		if(thing && checkPrereqs(courseNames[index])) {
			if(buffer.indexOf(courseNames[index]) == -1) {
				buffer.push(courseNames[index])
			}
		}
	}


	//now we add courses from the buffer to the degree plan
	var semester = []
	var sum = 0 
	var classCount = 0
	for(i = 0; i < buffer.length; i++) {
		var temp = sum + Number(json[buffer[i]].hours)
		if(temp <= creditHourCap) {
			semester.push(buffer[i])
			sum += Number(json[buffer[i]].hours)
			classCount++
			preCompleted.push(buffer[i])
		}
		else {
			sum = 0
			plan.push(semester)
			i = 0
			buffer.splice(0, classCount)
			classCount = 0
			semester = []
		}
	}

	//in case there isn't enough courses to fill a semester but enough to not be ignored
	if(sum > creditHourMin) {
		plan.push([...semester])
		for(i = 0; i < semester.length; i++) {
			preCompleted.push(buffer[i])
		}
		buffer = []
	}
		
		//calcs da count
		for(i = 0; i < plan.length; i++) {
			daCount += plan[i].length
		}
		currentNumber = Math.max(currentNumber, daCount)	
	}	
	plan.push([...buffer])
	console.log(daCount)
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

function getCompleted() {
  //Indices are all the same since they all come from the same json file
  selectedData = []
  preCompleted = []
  degreePlan = []
  cbs = document.querySelectorAll('input');
  courses = document.getElementsByClassName('checkLabel')
            for (i = 0; i < cbs.length; i++)
            {
                if (cbs[i].checked)
                {preCompleted.push(courses[i].textContent)}
		//This is my hacky way of creating a "degree plan"
		degreePlan.push(courses[i].textContent)
            }
}
