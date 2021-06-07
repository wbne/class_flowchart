import json
from collections import Counter

# some JSON:
x =  open("utdfall19grades.json");

# parse x:
y = json.load(x)

courses = {}
template = {'name': '', 'A+': 0, 'A': 0, 'A-': 0, 'B+': 0, 'B': 0, 'B-': 0, 'C+': 0, 'C': 0, 'C-': 0, 'D+': 0, 'D': 0, 'D-': 0, 'F': 0, 'W': 0}
ECS = [1100, 3390]
MATH = [2413, 2414, 2418]
PHYS = [2325, 2326, 2125, 2126]
UNIV = [1010, 2020]

def append(name, sub):
    if(name not in courses):
        courses[name] = template
        courses[name]["name"] = name
    c = Counter()
    for data in (courses[name], sub):
        c.update(data)
    courses[name] = dict(c)

def find(num, array):
    for value in array:
        if(num == str(value)):
            return True
    return False

for i in range(len(y)):
    subject = y[i]["subj"]
    number = y[i]["num"]
    name = subject+number
    if(subject == "CS"):
        append(name, y[i]["grades"])
    if(subject == "ECS" and find(number, ECS)):
        append(name, y[i]["grades"])
    if(subject == "PHYS" and find(number, PHYS)):
        append(name, y[i]["grades"])
    if(subject == "MATH" and find(number, MATH)):
        append(name, y[i]["grades"])
    if(subject == "UNIV" and find(number, UNIV)):
        append(name, y[i]["grades"])

f = open("formattedF19.json", "a")
for keys in courses:
    print(str(courses[keys]))
    #f.write(str(courses[keys])+",\n")
f.close()
