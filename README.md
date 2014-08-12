# Dial-Roller

infinit rolling dial UI-component

## Install

    npm install dial-roller

## Use

    var DialRoller = require('dial-roller'),
        dial = new DialRoller();

Bind to events:

    dial.on('change', function(value){
        console.log(value);
    });

Set it's value:

    dial.value(3);

Use the element:

    document.body.appendChild(dial.element);


