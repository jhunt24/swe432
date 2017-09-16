let express = require('express');
let app = express();

app.set('port', (process.env.PORT || 5000));

/*
1. get a random beer
2. get a list of beers that are of a strong abv
3. get a list of beers that were brewed before a date
4. get a list of beers that match a specified food string
5. get a single beer using the beers id (or a list of beers matching the inputted name)
other option: find max or minds in the data or search based on name
 */

class Beer {//class for the sake of 2 class requirement, the api offers more data if needed
    constructor(name, firstBrewed, abv, ibu) {
        this.name = name;
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
            beerArray[i] = new Beer(json[i].name, json[i].first_brewed, json[i].abv, json[i].ibu);
        }
});

app.get('/', function(request, response) {
    response.send(beerArray)
});

app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});
