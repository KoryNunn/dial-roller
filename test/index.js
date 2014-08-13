var DialRoller = require('../'),
    crel = require('crel');

var horizDial = new DialRoller({
        renderItem: function(item){
            return crel('label', item.label);
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
        renderItem: function(item){
            return crel('label', item.label);
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

window.onload = function(){
    crel(document.body,
        horizDial.element,
        vertDial.element,
        valueLabel
    );
};