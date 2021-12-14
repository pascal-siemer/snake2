const canvas = document.querySelector('canvas');
const context = canvas.getContext('2d');
var canvasDimensions = 32; //Gridmodifier in pixeln


var width = 20; //anzahl Koordinaten in x-richtung
var height = 20;    //anzahl Koordinaten in y-Richtung
var end = false;    //Spielabbruchsvariable
var input;  //Eingabe, bsp: w,a,s und d
var direction;  //Speichern der aktuellen Bewegungsrichtung der Snake / des Players
const tickRateBase = 500    //Basiswert zum setzen und zurücksetzen der tickRate
var tickRate = tickRateBase; //Tickrate in ms
var tickModifyer = 10; //Veraenderung der Tickrate nach Events in Prozent
var player;     //variable fuer Objekt Snake
var food;       //Variable fuer Objekt Food

canvas.height = width * canvasDimensions;
canvas.width = height * canvasDimensions;

init();     //Parameter werden auf Startwerte gesetzt, Objekte initialisiert.
loop();     //Game-Loop





//---EventHandler---

//aktuellste Eingabe wird gespeichert, damit sie spaeter in setInterval verwendet werden kann
document.addEventListener('keydown', function(event) {
    //Jeweils immer die erste Eingabe speichern. Input wird im Verlauf von loop() wieder auf undefined zurueckgesetzt werden, sodass wieder der neuste Input gelesen werden kann.
    if(input == undefined) {
        input = event.keyCode;

        //Eingabeverarbeitung basierend auf input. Ebenfalls: unterbindung, dass der Player rueckwaerts laeuft.
        if( (input == 87 || input == 38) && direction != "down"){
            direction = "up";
        } else if((input == 83 || input == 40) && direction != "up") {
            direction = "down";
        } else if((input == 65 || input == 37) && direction != "right") {
            direction = "left";
        } else if((input == 68 || input == 39) && direction != "left") {
           direction = "right";
        }
    }
    if(event.keyCode == 32 && end) {    //Falls das Spiel beendet wurde: Spiel kann ueber LEER-Taste zurueckgesetzt werden, indem init() aufgerufen wird.
        init();
    }
});



//---Methoden---

function init() {
    //Setzen der Parameter auf ihre Startwerte
    end = false;
    tickRate = tickRateBase;
    input = undefined;
    direction = undefined;
    tickRate = tickRateBase;    //zufällige Positionen für Snake und Food
    let startX = random(width);
    let startY = random(height);
    player = new Snake(startX, startY);   //Instanz der Snake.
    while(player.checkPosition(startX, startY)) {
        startX = random(width);
        startY = random(height);
    }
    food = new Food(startX, startY);  //Instanz des Foods

    //Neue Positionen anzeigen
    drawGame();
}


//"Clock", welche pro Tick run() aufruft, solange die Snake sich nicht selbst gefressen hat (true/False in Variable end).
function loop() {
    setTimeout(function() {     //Uber das Rekursive aufrufen einer Funktion, welche setTimeout beinhaltet, kann die Spielgeschwindigkeit veraendert werden. setIntervall() bietet diese Moeglichkeit nicht
        if(!end) {
            run();
            input = undefined;      //Zuruecksetzen von input, damit der EventHandler die naechste Eingabe speichern kann.
                 
        }
        loop();     //Rekursives Aufrufen der loop() setzt das Spiel fort. Eine Taktung ist durch setTimeout() gegeben.

    }, tickRate);
}

//run() ist die Spieldurchführung pro Tick, quasi "eine Runde".
function run() {

    //Mit x und y wird im folgenden kalkuliert. Diese müssen zunaechst auf die Werte x,y der ersten Player-Instanz Player ("Schlangenkopf") gesetzt werden, damit von da ausgehend Positionsveraenderungen berechnet werden koennen.
    var x = player.x;
    var y = player.y;
    
    //Positionsveränderungen an x, y ausgehend von direction
    if(direction == "up") {
        y--;
    } else if(direction == "down") {
        y++;
    } else if(direction == "left") {
        x--;
    } else if(direction == "right") {
        x++;
    }


    //Falls ausserhalb des Spielfelds: Tod
    if(x < 0 || x >= width || y < 0 || y >= height) {
        gameOver();   //aktuelles Spiel wird durch gameOver-Methode beendet.
        return undefined; //run-Methode abbrechen;
    }

    //Spielregeln ausführen
    if(x == player.x && y == player.y) {
        // do nothing
    } else if(!player.checkPosition(x,y))  {   //wenn die neue Position nicht zu player gehört
        if(food.checkPosition(x,y)) {   //Wenn player auf neuer Position frisst: player verlängern und auf neue Position bewegen.
            player.addNext(player.x, player.y);
            player.recursiveMove(x, y);

            //Neue Position für Food berechnen
            let a = random(width);  
            let b = random(height);
            while(player.checkPosition(a, b)) {
                a = random(width);
                b = random(width);
            }
            food.relocate(a, b);

            // Tickrate anpassen und das Spiel beschleunigen
            tickRate = Math.round(tickRate - (tickRate * (tickModifyer / 100)));

        } else {    //Wenn neue Position leer: player auf Position bewegen
            player.recursiveMove(x, y);
        }
    } else {    //Wenn neue Position = Instanz des Players: Player frisst sich selbst und das Spiel wird beendet.
        gameOver();   //aktuelles Spiel wird durch gameOver-Methode beendet.
        return undefined;   //run-Methode abbrechen;
    }
    drawGame();     //aktuelles Spielfeld darstellen.
    setText("Score: " + player.getLength() + ", Tickrate: " + tickRate);    //Score anzeigen
    
}

//Darstellung des Spielst auf HTML-Element Canvas
function drawGame() {
    context.fillStyle = 'white';
    context.fillRect(0, 0, canvas.width, canvas.height);
    for(let y = 0; y < width; y++) {
        for(let x = 0; x < width; x++) {
            if(player.x == x && player.y == y) {    //Wenn erste Instanz von Player ("Schlangenkopf") an Position x,y
                context.fillStyle = 'lightgreen';
                context.fillRect( (x * canvasDimensions), (y * canvasDimensions), canvasDimensions, canvasDimensions);
            } else if(player.checkPosition(x, y)) { //Wenn weitere Instanzen von Player an Position x,y an Position x,y
                context.fillStyle = 'green';
                context.fillRect( (x * canvasDimensions), (y * canvasDimensions), canvasDimensions, canvasDimensions);
            } else if(food.checkPosition(x,y)) {    //Wenn Instanz von Food an Position x,y
                //Bild statt farbiges Rect anzeigen.
                context.drawImage(food.img, (x * canvasDimensions), (y * canvasDimensions), canvasDimensions, canvasDimensions);
            }
        }
    }
}

function random(n) {
    return Math.floor(Math.random() * n);
}

function gameOver() {
    end = true;
    setText("Ende! Druecke LEER fuer eine neue Runde. Score: " + player.getLength());
}

function setText(text) {
    document.getElementById('output').innerHTML = text;
}

//---Definitionen der Objekte Snake für die Schlange und Food---

//Beinhaltet Koordinaten x,y und es kann eine Instanz von sich selbst an sich anhängen (Variable next).
function Snake(x, y) {
    this.x = x;
    this.y = y;
    var next;
    this.move = function(a, b) {
        this.x = a;
        this.y = b;
    }
    this.addNext = function(a, b) { //Instanz Snake an letze Instanz von Snake anhaengen ueber Variable next.
        if(this.next === undefined) {
            this.next = new Snake(a, b);
        } else {
            this.next.addNext(a, b);
        }
    }
    this.checkPosition = function(a, b) {   //true oder false. Prueft, ob sich an angegebener Position a,b eine Instanz von Snake befindet
        var occupied = (this.x == a && this.y == b);
        if(occupied) {
            return true
        } else if((this.next !== undefined)){
            return this.next.checkPosition(a, b);
        } else {
            return false;
        }
    }
    this.recursiveMove = function(a, b) {   //Bewegt alle Instanzen der Snake. Die erste Instanz wird an die neue Position a,b bewegt, die anderen Instanzen werden auf die Position ihres "vorgaengers" bewegt.
        if(this.next !== undefined) {
            this.next.recursiveMove(this.x, this.y);
        }
        this.x = a;
        this.y = b;
    }
    this.getLength = function() {
        if(this.next === undefined) {
            return 1;
        } else {
            return this.next.getLength() + 1;
        }
    }
}

//Beinhaltet Koordinaten x,y
function Food(x, y) {   
    this.x = x;
    this.y = y;
    this.img = new Image();
    this.img.src = 'https://archives.bulbagarden.net/media/upload/f/fe/Curry_Ingredient_Fancy_Apple_Sprite.png'     //Speicherort des "Aussehens" (Das anzuzeigende Bild)
    this.relocate = function(a, b) {
        this.x = a;
        this.y = b;
    }
    this.checkPosition = function(a,b) {
        if(this.x == a && this.y == b) {
            return true;
        } else {
            return false;
        }
    }

}