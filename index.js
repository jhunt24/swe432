let express = require('express');
let app = express();
let fetch = require('node-fetch');

app.set('port', (process.env.PORT || 5000));

/*
1. Retrieve, add, and update a beer and its data
    GET, PUT, POST, DELETE /beer/:beerId
2. Get or update the abv content of a beer
    GET, PUT /beer/:beerId/abv
3. Get the list of beers that are strong (abv > 7.0)
    GET /strongBeers
4. Get a list of beers that are of an ibu greater than (ibu_gt X)
    GET /beer/ibu_gt/:ibu
5. Get a list of beers that include the specified hop searched for
    GET /beer/hops/:hopName
6. Get a list of beers that match the supplied name
    GET /beer/name/:beerName
7. Get a sort list of beers currently stored
    GET /sorted
 */

class Hop {
    constructor(name, attribute) {
        this.name = name;
        this.attribute = attribute;
    }
}

class Beer {//Beer class
    constructor(name, id, abv, ibu, hops) {
        this.name = name;
        this.id = id - 1;//so array and id numbers match
        this.abv = abv;
        this.ibu = ibu;
        this.hops =  hops;
    }
}
let beerArray = [];//store Beer class here

function errorHandler(response) {
  return response.json()
    .then(json => {
      if (response.ok) {
        return json
      } else {
        let error = Object.assign({}, json, {
        status: response.status,
        statusText: response.statusText
        })
        return Promise.reject(error)
      }
    });
}
function badFetch() {//test that fetching from wrong url gives 404 not found and no internet gives ENOTFOUND
    fetch('https://api.punkapi.com/v2/beersss?page=1&per_page=40')
    .then(errorHandler)
    .then(function(response) {
        console.log(response);
    })
    .catch(function(err) {

        if(err.code === 'ENOTFOUND'){//no internet connection
            console.log('Internet Error: ' + err);
        }
        else {//flags 404 and any other client error
            console.log('Error: ' + err.status + ' --- ' + err.statusText);
            setTimeout(firstFetch, 5000);
        }
    });
}
function invalidKeyFetch() {//test that fetching invalid data throws error
    fetch('http://apiv3.iucnredlist.org/api/v3/country/list?token=123notgonnawork123')
        .then(function (res) {
            return res.json();
        }).then(function (json) {
        for (let i in json) {
            let newHops = [];
            for (let h in json[i].ingredients.hops) {
                newHops[h] = new Hop(json[i].ingredients.hops[h].name, json[i].ingredients.hops[h].attribute);
            }
            beerArray[i] = new Beer(json[i].name, json[i].id, json[i].abv, json[i].ibu, newHops);
        }
    })
        .catch(function (err) {
            if (err.name === 'TypeError') {//gateway timeout
                console.log("Type Error, bad data");
            }
        });
}

function firstFetch() {
    fetch('https://api.punkapi.com/v2/beers?page=1&per_page=40')//first 40 beers
        .then(function (res) {
            return res.json();
        }).then(function (json) {
        for (let i in json) {
            let newHops = [];
            for (let h in json[i].ingredients.hops) {
                newHops[h] = new Hop(json[i].ingredients.hops[h].name, json[i].ingredients.hops[h].attribute);
            }
            beerArray[i] = new Beer(json[i].name, json[i].id, json[i].abv, json[i].ibu, newHops);
        }
    })
        .catch(function (err) {
            if(err.code === 'ENOTFOUND'){//no internet connection
                console.log('Internet Error: ' + err);
                setTimeout(firstFetch, 5000);
            }
            if (err.name === 'TypeError') {//gateway timeout
                console.log("Type Error, bad data");
            }
            else {//flags 404 and any other client error
                console.log('Error: ' + err.status + ' --- ' + err.statusText);
                setTimeout(firstFetch, 5000);
            }
        });
}

function secondFetch() {
    fetch('https://api.punkapi.com/v2/beers?page=2&per_page=40')//second 40 beers
        .then(function(res) {
            return res.json();
        }).then(function(json) {
        for(let i = 0; i<json.length; i++){
            let newHops = [];
            for(let h in json[i].ingredients.hops){
                newHops[h] = new Hop(json[i].ingredients.hops[h].name, json[i].ingredients.hops[h].attribute);
                //console.log(newHops[h]);
            }
            let newI = i+40;
            beerArray[newI] = new Beer(json[i].name, json[i].id, json[i].abv, json[i].ibu, newHops);
        }
    })
        .catch(function (err) {
            if(err.code === 'ENOTFOUND'){//no internet connection
                console.log('Internet Error: ' + err);
                setTimeout(secondFetch, 5000);
            }
            if (err.name === 'TypeError') {//gateway timeout
                console.log("Type Error, bad data");
            }
            else {//flags 404 and any other client error
                console.log('Error: ' + err.status + ' --- ' + err.statusText);
                setTimeout(secondFetch, 5000);
            }
        });
}
function delay(t) {
    return new Promise(function(resolve) {
        setTimeout(resolve, t)
    });
}
seq = Promise.resolve();
seq = seq.then(badFetch)//sequences fetch order, badFetch will call firstFetch on failure
    .then(delay(500))
    .then(secondFetch)
    .then(delay(500))
    .then(invalidKeyFetch);

app.get('/', function(request, response) {
    response.send(beerArray)
});

//Scenario 1
app.post('/beer/:beerId/:beerName/:abv/:ibu/:hopName/:hopAtr', function (request, response) {//adds new beer to end of array
    let beerId = Number(request.params.beerId);
    beerArray.map(function(beer) {
        if (beer.id === beerId) {
            response.status(400).send("ID already exists");
            return;
        }
    });
    let beerName = String(request.params.beerName);
    let abv = Number(request.params.abv);
    let ibu = Number(request.params.ibu);
    let hopName = String(request.params.hopName);
    let hopAtr = Number(request.params.hopAtr);
    let newHops = [];
    newHops[0] = new Hop(hopName, hopAtr);
    let beerArrayIndex = beerArray.length;//index for end of array
    beerArray[beerArrayIndex] = new Beer(beerName, beerId +1, abv, ibu, newHops);//store new beer at the end

    response.send(beerArray);
});

app.put('/beer/:beerId/:beerName/:abv/:ibu/:hopName/:hopAtr', function (request, response) {//allow all beer data for given id to be modified
    let beerId = Number(request.params.beerId);
    for(let i in beerArray){
        if(beerId === beerArray[i].id){
            var beerArrayIndex = i;
        }
    }
    if(!beerArrayIndex){
        response.status(404).send("ID not found");
        return;
    }

    let beerName = String(request.params.beerName);
    let abv = Number(request.params.abv);
    let ibu = Number(request.params.ibu);
    let hopName = String(request.params.hopName);
    let hopAtr = Number(request.params.hopAtr);
    let newHops = [];
    newHops[0] = new Hop(hopName, hopAtr);
    beerArray[beerArrayIndex] = new Beer(beerName, beerId +1, abv, ibu, newHops);//replace old beer with new data

    response.send(beerArray[beerArrayIndex]);
});

app.delete('/beer/:beerId', function (request, response) {//remove selected beer
    let beerId = Number(request.params.beerId);
    for(let i in beerArray){
        if(beerId === beerArray[i].id){
            var beerArrayIndex = i;
        }
    }
    if(!beerArrayIndex){
        response.status(404).send("ID not found");
        return;
    }

    beerArray.splice(beerArrayIndex,1);//delete beer

    response.send(beerArray);
});

app.get('/beer/:beerId', function(request, response){
    let beerId = Number(request.params.beerId);
    let beerToReturn = null;

    beerArray.map(function(beer) { //search through beerArray for matching id
        if(beer.id === beerId){
            beerToReturn = beer;
        }
    });
    if(beerToReturn == null){
        response.status(404).send("ID out of range");
        return;
    }
    response.send({beer: beerToReturn});
});

//Scenario 2
app.get('/beer/:beerId/abv', function(request, response){
    let beerId = Number(request.params.beerId);
    let abvToReturn = null;

    beerArray.map(function(abv) { //search through beerArray for matching id, then return abv
        if(abv.id === beerId){
            abvToReturn = abv;
        }
    });
    if(abvToReturn == null){
        response.status(404).send("ID out of range");
        return;
    }
    response.send({abv: abvToReturn.abv});//{"abv":4.5}
});

app.put('/beer/:beerId/abv/:newAbv', function(request, response){
    let beerId = Number(request.params.beerId);
    for(let i in beerArray){
        if(beerId === beerArray[i].id){
            var beerArrayIndex = i;
        }
    }
    if(!beerArrayIndex){
        response.status(404).send("ID not found");
        return;
    }

    let abv = Number(request.params.newAbv);//user sets new abv
    beerArray[beerArrayIndex].abv = abv;//set abv to user input
    response.send(beerArray[beerArrayIndex]);
});


//Scenario 3
app.get('/strongBeers', function(request, response){
    var strongBeerArray = beerArray.filter((beer) => beer.abv >= 7.0); //filter only beers from beerArray with abv>=7
    if(strongBeerArray.length === 0) {
        response.send("There are no beers that have an ABV of 7.0 or greater.");
        return;
    }
    response.send(strongBeerArray);
});

//Scenario 4
app.get('/beer/ibu_gt/:ibu', function(request, response){
    let beerIbu = Number(request.params.ibu);
    var newBeerArray = beerArray.filter(beer => beer.ibu > beerIbu); //filter only beers from beerArray with an ibu > input
    if(newBeerArray.length === 0) {
        response.send("There are no beers with an IBU greater than " + beerIbu + ".");
        return;
    }
    response.send(newBeerArray);
});

//Scenario 5
app.get('/beer/hops/:hopName', function(request, response){
    let beerHop = request.params.hopName;
    var newBeerArray = [];
    var ctr = 0;
    for(let beer in beerArray) { //loop through each beer in beerArray
        for(let i in beerArray[beer].hops) { //loop through each hop in the current beer
            if(beerArray[beer].hops[i].name.includes(beerHop)){ //if the current hop's name includes the input string, add the beer to the response
                newBeerArray[ctr] = beerArray[beer];
                ctr++;
                break; //make sure each beer is only added once to the response
            }
        }
    }

    if(newBeerArray.length === 0) {
        response.send("There are no beers that contain hops that contain '" + beerHop + "' in their name. (CASE SENSITIVE)");
        return;
    }
    response.send(newBeerArray);
})

//Scenario 6
app.get('/beer/name/:beerName', function(request, response){
    let beerName = request.params.beerName;
    var newBeerArray = beerArray.filter(beer => beer.name.includes(beerName)); //filter only beers from beerArray whose name includes the input string
    if(newBeerArray.length === 0){
        response.send("There are no beers that contain '" + beerName + "' in their name. (CASE SENSITIVE)");
        return;
    }
    response.send(newBeerArray);
});
//Scenario 7
app.get('/sorted', function(request, response){
    let beerArrayFirstHalf = beerArray.splice(0, Math.floor(beerArray.length / 2))//cut array in half
    Promise.all(beerArrayFirstHalf)
        .then(function(result) {
            return result.sort(function(a, b){//sort first half of array based on beer name
                return a.name.localeCompare(b.name);
            });
        })
        .then(function(newResult) {
            return newResult.concat(beerArray);//reconnect array
        })
        .then(function(nextResult) {
            return nextResult.sort(function(a, b){//sort the rest of the array
                return a.name.localeCompare(b.name);
            });
        })
        .then(function(finalResult) {
            beerArray = finalResult;
            response.send(finalResult);//send result
        })
        .catch(function(err){//catch error and send message
            response.status(404).send(err);
        });
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});