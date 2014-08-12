var DialRoller = require('../'),
    crel = require('crel');

var dial = new DialRoller({
        size: 1500,
        radius: 650,
        renderItem: function(item){
            return crel('label', item.label);
        },
        updateItem: function(element, index, value){
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

dial.items([
    {label:1},
    {label:2},
    {label:3},
    {label:4}
]);

dial.on('change', function(value){
    valueLabel.textContent = 'value: ' + value.label;
});

window.onload = function(){
    crel(document.body,
        dial.element,
        valueLabel
    );
};