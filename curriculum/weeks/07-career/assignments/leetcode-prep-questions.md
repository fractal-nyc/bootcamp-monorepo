# Problem 1: Airport Gate Limits

You help run JFK airport. Each gate at the airport has limited seating of `capacity` passengers each. 
One of your jobs is to make sure there's never more than `capacity` people assigned to a gate at a given time.
Given a snapshot of a list of gates, the assigned flights, and the passengers on those flights, return any gates
that are overloaded. 
For example, if flight AA101 (51 passengers) and flight BA206 (51 passengers) are both assigned to gate B3, return `["B3"]`.

Example input:
```
const flightAssignments = {
  "AA101": "G1",
  "AA102": "G1",
  "BA602": "D4",
  "BA201": "G2",
  "DL303": "G3",
  "AA406": "D4",
  "AA930": "D4",
  "UA777": "H1",
  "UA778": "H1",
  "LH400": "J2"
};

const flightPassengers = {
  "AA101": 85,
  "AA102": 50,
  "BA201": 105,
  "DL303": 6,    
  "BA602": 10, 
  "AA406": 65,
  "AA930": 25,
  "UA777": 61,
  "UA778": 62,
  "LH400": 120
};

const capacity = 120;
const expectedResult = ["G1", "H1"]

const flightAssignments2 = {
  "F1": "A1",
  "F2": "A1",
  "F3": "B2",
  "F4": "B2",
  "F5": "C2"
};

const flightPassengers2 = {
  "F1": 30,
  "F2": 50,
  "F3": 40,
  "F4": 36,
  "F5": 75
};

const capacity2 = 75
const expectedResult2 = ["A1", "B2"]

const flightAssignments3 = {
  "A1": "G1",
  "A2": "G1",
  "B1": "G2",
  "C1": "G3"
};

const flightPassengers3 = {
  "A1": 60,  
  "A2": 60,  
  "B1": 0,   
  "C1": 120,  
  "X999": 999 
};

const capacity3 = 120;
const expectedResult3 = []
```

# Problem #2: Meeting Schedules

You are given the schedule of a therapist's meetings with clients. The format is a list of tuples: `[[start1,end1],[start2,end2],...]` where `start` and `end` are the start and end of the meetings, respectively, measured in minutes past noon. Check the schedule to make sure there are no conflicts (e.g. no meeting overlaps with another).

```
function assert(expected, actual) {
    if (expected != actual) {
        throw new Error(expected + " expected, got " + actual)
    }
}

function detectOverlap(schedule) {
    // your implementation here
}
// example 1
const meetings1 = [
  [60, 120],   // 1:00–2:00
  [130, 180],  // 2:10–3:00
  [115, 150]   // 1:55–2:30
];
assert(true, detectOverlap(meetings1))

// example 2
const meetings2 = [
  [60, 120],   // 1:00–2:00
  [121, 180],  // 2:01–3:00
  [200, 250]   // 3:20–4:10
];
assert(false, detectOverlap(meetings2))

// example 3
const meetings3 = [
  [60, 120],
  [120, 150]
];
assert(false, detectOverlap(meetings3))

const meetings4 = [
  [200, 240],
  [60, 120],
  [110, 130]
];
assert(true, detectOverlap(meetings4))

const meetings5 = [
  [90, 150],
  [90, 150]
];
assert(true, detectOverlap(meetings5))

const meetings6 = [
  [0, 30],
  [30, 60],
  [90, 150],
  [149, 200]
];
assert(true, detectOverlap(meetings6))