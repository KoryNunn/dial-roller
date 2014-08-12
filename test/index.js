var DialRoller = require('../'),
    crel = require('crel');

var dial = new DialRoller({
        values:[
            {label:1},
            {label:2},
            {label:3},
            {label:4},
            {label:5}
        ],
        size: 1500,
        itemSize: 500,
        renderItem: function(item){
            return crel('label', item.label);
        }
    }),
    valueLabel = crel('label');

dial.on('change', function(value){
    valueLabel.textContent = 'value: ' + value.label;
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