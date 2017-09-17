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
5. Get a list of beers that were brewed before a date (brewed_before XX/XX)
    GET /beer/brewed_before/:firstBrewed
 */

class Beer {//class for the sake of 2 class requirement, the api offers more data if needed
    constructor(name, id, firstBrewed, abv, ibu) {
        this.name = name;
        this.id = id - 1;//so array and id numbers match
        this.firstBrewed = firstBrewed;
        this.abv = abv;
        this.ibu = ibu;
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
        beerArray[i] = new Beer(json[i].name, json[i].id, json[i].first_brewed, json[i].abv, json[i].ibu);
    }
});

app.get('/', function(request, response) {
    response.send(beerArray)
});

//Scenario 1
app.post('/beer/:beerId', function (request, response) {//adds new beer to end of array
    let beerId = Number(request.params.beerId);
    let name = prompt("Enter Beer Name", "");
    let first_brewed = prompt("First time it was brewed?(MM/YYYY)", "");
    let abv = prompt("ABV", "");
    let ibu = prompt("IBU", "");
    beerArrayIndex = beerArray.length;//index for end of array
    beerArray[beerArrayIndex] = new Beer(name, beerId, first_brewed, abv, ibu);//store new beer at the end

    response.send(beerArray[beerArrayIndex]);
});

app.put('/beer/:beerId', function (request, response) {//allow all beer data for given id to be modified
    let beerId = Number(request.params.beerId);
    let name = prompt("Enter Beer Name", "");
    let first_brewed = prompt("First time it was brewed?(MM/YYYY)", "");
    let abv = prompt("ABV", "");
    let ibu = prompt("IBU", "");
    beerArray[beerId] = new Beer(name, beerId, first_brewed, abv, ibu);//replace old beer with new data

    response.send(beerArray[beerId]);
});

app.delete('/beer/:beerId', function (request, response) {//remove selected beer
    let beerId = Number(request.params.beerId);
    beerArray[beerId] = null;//delete beer

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

    response.send({abv: abvToReturn.abv});
});

//Scenario 2 - still figuring out put requests
/*
app.put('/beer/:beerId/abv', function(request, response){
    let beerId = Number(request.params.beerId);
    let abvToReturn = null;
    beerArray.map(function(abv) {
        if(abv.id === beerId){
            abvToReturn = abv;
        }
    });
    response.send({abv: abvToReturn.abv});
});
*/

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});