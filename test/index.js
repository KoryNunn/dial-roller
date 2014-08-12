var DialRoller = require('../'),
    crel = require('crel');

var dial = new DialRoller(),
    valueLabel = crel('label');

dial.on('change', function(value){
    valueLabel.textContent = 'value: ' + value;
});

window.onload = function(){
    crel(document.body,
        dial.element,
        valueLabel
    );

    setTimeout(function(){
        dial.value(5);
    },1000);
};