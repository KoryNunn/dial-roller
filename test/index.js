var DialRoller = require('../'),
    crel = require('crel');

var horizDial = new DialRoller({
        renderItem: function(){
            this.element = crel('label', this._data.label);
        },
        updateItem: function(element, index, value){
            DialRoller.prototype.updateItem.apply(this, arguments);
            var itemAnlge = 360 / this.items().length * index,
                angle = this._angle;

            var a = itemAnlge - angle;
            a += (a>180) ? -360 : (a<-180) ? 360 : 0;

            element.style.backgroundColor = 'rgba(100,100,255,'+Math.abs(a/90)/ 4+')';
        },
        decelerate: function(){
            this.velocity*=0.7;
        }
    }),
    valueLabel = crel('label');

horizDial.faceWidth(200);

horizDial.items([
    {label:1},
    {label:2},
    {label:3},
    {label:4}
]);

horizDial.element.className += ' horiz';

horizDial.on('change', function(value){
    valueLabel.textContent = 'value: ' + value.label;
});


var vertDial = new DialRoller({
        direction: 'vertical',
        renderItem: function(){
            this.element = crel('label', this._data.label);
        },
        updateItem: function(element, index, value){
            DialRoller.prototype.updateItem.apply(this, arguments);
            var itemAnlge = 360 / this.items().length * index,
                angle = this._angle;

            var a = itemAnlge - angle;
            a += (a>180) ? -360 : (a<-180) ? 360 : 0;

            element.style.backgroundColor = 'rgba(100,100,255,'+Math.abs(a/90)/ 4+')';
        },
        decelerate: function(){
            this.velocity*=0.7;
        }
    }),
    valueLabel = crel('label');

vertDial.faceWidth(200);

vertDial.items([
    {label:1},
    {label:2},
    {label:3},
    {label:4}
]);

vertDial.element.className += ' vert';

vertDial.on('change', function(value){
    valueLabel.textContent = 'value: ' + value.label;
});



var duplicatesDial = new DialRoller({
        direction: 'horizontal',
        renderItem: function(){
            this.element = crel('label', this._data.label);
        },
        updateItem: function(element, index, value){
            DialRoller.prototype.updateItem.apply(this, arguments);
            var itemAnlge = 360 / this.items().length * index,
                angle = this._angle;

            var a = itemAnlge - angle;
            a += (a>180) ? -360 : (a<-180) ? 360 : 0;

            element.style.backgroundColor = 'rgba(100,100,255,'+Math.abs(a/90)/ 4+')';
        },
        decelerate: function(){
            this.velocity*=0.7;
        }
    }),
    valueLabel = crel('label');

duplicatesDial.faceWidth(200);
var items = [
    {label:1},
    {label:2},
    {label:3},
    {label:4}
];
duplicatesDial.items(items.concat(items));

duplicatesDial.element.className += ' horiz';

duplicatesDial.on('change', function(value){
    valueLabel.textContent = 'value: ' + value.label;
});

window.dups = duplicatesDial;

window.onload = function(){
    crel(document.body,
        horizDial.element,
        vertDial.element,
        valueLabel,
        duplicatesDial.element
    );

    setTimeout(function(){
        vertDial.value(vertDial.items()[3]);
    },2000);
    setTimeout(function(){
        vertDial.value(vertDial.items()[2]);
    },2200);
    setTimeout(function(){
        vertDial.value(vertDial.items()[0]);
    },2400);
    setTimeout(function(){
        vertDial.value(vertDial.items()[1]);
    },2600);
};