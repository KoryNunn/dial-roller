var EventEmitter = require('events').EventEmitter,
    interact = require('interact-js'),
    crel = require('crel'),
    doc = require('doc-js'),
    transformPropertyName = '-webkit-transform',
    venfix = require('venfix'),
    translate = require('css-translate'),
    unitr = require('unitr');

interact.on('drag', document, function(interaction){
    var dial = interaction.barrelDial;

    if(!dial || interaction.moves.length < 2){
        return;
    }

    dial.beginUpdate();
    interaction.preventDefault();

    var lastMove = interaction.moves[interaction.moves.length-2],
        verticleScroll = lastMove ? lastMove.pageY - interaction.pageY : 0,
        dialCircumference = dial.labelHeight * dial.values.length,
        spinRatio = verticleScroll / dialCircumference;
        degrees = 360 * spinRatio;

    dial.velocity = degrees;

    dial.spin(degrees);
});

interact.on('end',document, function(interaction){
    var dial = interaction.barrelDial;

    if(!dial){
        return;
    }

    dial.endUpdate();
    interaction.barrelDial = null;
});

function Dial(settings){
    for(var key in settings){
        if(settings.hasOwnProperty(key)){
            this[key] = settings[key];
        }
    }
    this._value = this.values[0];
    this._events = {};
    this.velocity = 0;
    this._angle = 0;
    this.render();
    this.update();
    this.element.barrelDial = this;
}
Dial.prototype = Object.create(EventEmitter.prototype);
Dial.prototype.constructor = Dial;
Dial.prototype.direction = 'vertical';
Dial.prototype.height = 100;
Dial.prototype.width = 30;
Dial.prototype.labelHeight = 30;
Dial.prototype.beginUpdate = function(degrees){
    this._held = true;
};
Dial.prototype.endUpdate = function(degrees){
    var dial = this;

    if(!dial._held){
        return;
    }
    dial._held = false;

    var  momentumScroll = function(){
            dial.spin(
                dial.velocity,
                function(){
                    dial.emit('spin');
                    if(dial.held || Math.abs(dial.velocity) <= 0.1){
                        if(!dial.held){
                            dial.settle();
                        }
                        return;
                    }

                    dial.decelerate();

                    momentumScroll();
                }
            );
        };

    momentumScroll();

    return this;
};
Dial.prototype.decelerate = function(){
    this.velocity*=0.9;
};
Dial.prototype.spin = function(degrees, callback){

    var dial = this;

    window.requestAnimationFrame(function(){

        dial._angle = (360 + dial._angle + degrees) % 360;

        dial.update();

        callback && callback();

    var value = dial.values.length / 360 * dial._angle;
        valueIndex = Math.round(value),
        valueAngle = 360 / dial.values.length * valueIndex,
        oldValue = dial._value;
        newValue = dial.values[Math.abs(valueIndex - dial.values.length) % dial.values.length];

        dial._value = newValue;

        dial.emit('roll');
        if(oldValue != newValue){
            dial.emit('change', dial.value());
        }
    });

    return this;
};
Dial.prototype.update = function(){
    this.valuesElement.style[venfix('transform')] = 'rotateX(' + this._angle + 'deg)';
};
Dial.prototype.spinTo = function(angle, callback){
    var dial = this;

    var settleFn = function(){
        if(dial._held){
            return;
        }

        dial.spin((angle - dial._angle) * 0.2, function(){
            if(Math.abs(angle - dial._angle) > 0.1){
                settleFn();
            }else{
                dial._angle = angle;
                dial.update();
                callback && callback();
            }
        });
    }

    settleFn();
};
Dial.prototype.settle = function(){
    var dial = this;

    var value = dial.values.length / 360 * dial._angle;
        valueIndex = Math.round(value),
        valueAngle = 360 / dial.values.length * valueIndex;

    dial.spinTo(valueAngle, function(){
        dial._value = dial.values[Math.abs(valueIndex - dial.values.length) % dial.values.length];
        dial.emit('settle');
    });
};
Dial.prototype.value = function(setValue){
    var newValue = setValue || 0,
        dial = this;

    if (typeof setValue == 'undefined') {
        return this._value;
    }

    if(newValue === this._value){
        return;
    }

    this._value = newValue;

    dial.spinTo(360 - (360 / dial.values.length * this._value));

    this.emit('change', dial.value());
    this.emit('settle');

    return this;
};

Dial.prototype.values = [0,1,2,3,4,5,6,7,8,9];
Dial.prototype.render = function(){
    var dial = this,
        valuesElement,
        values = dial.values.slice();

    dial.element = crel('div', {'class':'dial'},
        valuesElement = crel('div', {'class':'values'})
    );
    dial.valuesElement = valuesElement;

    doc.ready(function(){
        dial.element.style.height = unitr(dial.height);
        dial.element.style.width = unitr(dial.width);
        dial.element.style.display = 'inline-block';
        dial.element.style.overflow = 'hidden';
        dial.element.style[venfix('perspective')] = '10000';
        dial.element.style.position = 'relative';

        dial.valuesElement.style.height = '100%';
        dial.valuesElement.style[venfix('transform-style')] = 'preserve-3d';

        dial._labels = [];

        var valueLabel;

        for(var i = 0; i < values.length; i++){
            valueLabel = crel('label', values[i].toString());
            valueLabel.barrelValue = values[i];
            valueLabel.style.display = 'block';
            valueLabel.style.position = 'absolute';
            valueLabel.style.height = unitr(dial.labelHeight);
            valueLabel.style.top = '50%';
            valueLabel.style['margin-top'] = unitr(-(dial.labelHeight / 2));
            valueLabel.style[venfix('transform')] = 'rotateX(' + 360 / values.length * i + 'deg) translateZ(' + unitr(parseInt(dial.labelHeight * dial.values.length / Math.PI) / 2) + ')';
            valueLabel.style[venfix('backface-visibility')] = 'hidden';

            valuesElement.appendChild(valueLabel);
        }
    });

    interact.on('start', document, function(interaction){
        if(
            interaction.barrelDial ||
            !doc.closest(interaction.originalEvent.target, valuesElement)
        ){
            return;
        }

        interaction.preventDefault();
        interaction.barrelDial = dial;

    });

    return this;
};

module.exports = Dial;