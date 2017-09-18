let express = require('express');
let app = express();
/*const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));*/
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
 */

class Hop {
    constructor(name, attribute) {
        this.name = name;
        this.attribute = attribute;
    }
}

class Beer {//class for the sake of 2 class requirement, the api offers more data if needed
    constructor(name, id, abv, ibu, hops) {
        this.name = name;
        this.id = id - 1;//so array and id numbers match
        this.abv = abv;
        this.ibu = ibu;
        this.hops =  hops;
    }
}
let beerArray = [];//store Beer class here

let fetch = require('node-fetch');

fetch('https://api.punkapi.com/v2/beers?page=1&per_page=80')//api seems to limit 80 per call,
// can do a 2nd fetch if it needs to be larger
    .then(function(res) {
        return res.json();
    }).then(function(json) {
    for(let i in json){
        let newHops = [];
        for(let h in json[i].ingredients.hops){
            newHops[h] = new Hop(json[i].ingredients.hops[h].name, json[i].ingredients.hops[h].attribute);
        }
        beerArray[i] = new Beer(json[i].name, json[i].id, json[i].abv, json[i].ibu, newHops);
    }
});

app.get('/', function(request, response) {
    response.send(beerArray)
});

//Scenario 1
app.post('/beer/:beerId', function (request, response) {//adds new beer to end of array
    let beerId = Number(request.params.beerId);
    if(beerId >= beerArray.length || beerId < 0){
        response.send("ID out of range");
        return;
    }

    let name = prompt("Enter Beer Name", "");
    let abv = prompt("ABV", "");
    let ibu = prompt("IBU", "");
    beerArrayIndex = beerArray.length;//index for end of array
    beerArray[beerArrayIndex] = new Beer(name, beerId, abv, ibu);//store new beer at the end

    response.send(beerArray[beerArrayIndex]);
});

app.put('/beer/:beerId', function (request, response) {//allow all beer data for given id to be modified
    let beerId = Number(request.params.beerId);
    if(beerId >= beerArray.length || beerId < 0){
        response.send("ID out of range");
        return;
    }

    let name = prompt("Enter Beer Name", "");
    let abv = prompt("ABV", "");
    let ibu = prompt("IBU", "");
    beerArray[beerId] = new Beer(name, beerId, abv, ibu);//replace old beer with new data

    response.send(beerArray[beerId]);
});

app.delete('/beer/:beerId', function (request, response) {//remove selected beer
    let beerId = Number(request.params.beerId);
    if(beerId >= beerArray.length || beerId < 0){
        response.send("ID out of range");
        return;
    }

    beerArray.splice(beerId,1);//delete beer

    response.send(beerArray[beerId]);
});

app.get('/beer/:beerId', function(request, response){
    let beerId = Number(request.params.beerId);
    let beerToReturn = null;

    beerArray.map(function(beer) {
        if(beer.id === beerId){
            beerToReturn = beer;
        }
    });
    if(beerToReturn == null){
        response.send("ID out of range");
        return;
    }
    response.send({beer: beerToReturn});
});

//Scenario 2
app.get('/beer/:beerId/abv', function(request, response){
    let beerId = Number(request.params.beerId);
    let abvToReturn = null;

    beerArray.map(function(abv) {
        if(abv.id === beerId){
            abvToReturn = abv;
        }
    });
    if(abvToReturn == null){
        response.send("ID out of range");
        return;
    }
    response.send({abv: abvToReturn.abv});//{"abv":4.5}
});

app.put('/beer/:beerId/abv', function(request, response){
    let beerId = Number(request.params.beerId);
    if(beerId >= beerArray.length || beerId < 0){
        response.send("ID out of range");
        return;
    }
    
    let abv = prompt("ABV", "");//user sets new abv
    beerArray[beerId].abv = abv;//set abv to user input
    response.send(beerArray[beerId]);
});


//Scenario 3
app.get('/strongBeers', function(request, response){
    var strongBeerArray = beerArray.filter((beer) => beer.abv >= 7.0);
    if(strongBeerArray.length === 0) {
        response.send("There are no beers that have an ABV of 7.0 or greater.");
        return;
    }
    response.send(strongBeerArray);
});

//Scenario 4
app.get('/beer/ibu_gt/:ibu', function(request, response){
    let beerIbu = Number(request.params.ibu);
    var newBeerArray = beerArray.filter(beer => beer.ibu > beerIbu);
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
    for(let beer in beerArray) {
        for(let i in beerArray[beer].hops) {
            if(beerArray[beer].hops[i].name.includes(beerHop)){
                newBeerArray[ctr] = beerArray[beer];
                ctr++;
                break;
            }
        }
    }
        
    if(newBeerArray.length === 0) {
        response.send("There are no beers that contain hops that contain '" + beerHop + "' in their name. (CASE SENSITIVE)");
        return;
    }
    response.send(newBeerArray);
})

//Scenario 6 (extra)
app.get('/beer/name/:beerName', function(request, response){
    let beerName = request.params.beerName;
    var newBeerArray = beerArray.filter(beer => beer.name.includes(beerName));
    if(newBeerArray.length === 0){
        response.send("There are no beers that contain '" + beerName + "' in their name. (CASE SENSITIVE)");
        return;
    }
    response.send(newBeerArray);
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});