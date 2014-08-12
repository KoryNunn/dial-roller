var interact = require('interact-js'),
    crel = require('crel'),
    doc = require('doc-js'),
    transformPropertyName = '-webkit-transform',
    transformStylePropertyName = '-webkit-transform-style',
    perspectivePropertyName = '-webkit-perspective',
    backfacePropertyName = '-webkit-backface-visibility',
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
                    dial.trigger({
                        type: 'spin'
                    });
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

        dial.trigger('roll');
        if(oldValue != newValue){
            dial.trigger('change');
        }
    });

    return this;
};
Dial.prototype.update = function(){
    this.valuesElement.style[transformPropertyName] = 'rotateX(' + this._angle + 'deg)';
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
        dial.trigger('settle');
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

    this.trigger('change');
    this.trigger('settle');

    return this;
};

Dial.prototype.values = [0,1,2,3,4,5,6,7,8,9];
Dial.prototype.render = function(){
    var valuesElement,
        dial = this,
        values = this.values.slice();

    this.element = crel('div', {'class':'dial'},
        valuesElement = crel('div', {'class':'values'})
    );
    this.element.style.height = unitr(this.height);
    this.element.style.width = unitr(this.width);
    this.element.style.display = 'inline-block';
    this.element.style.overflow = 'hidden';
    this.element.style[perspectivePropertyName] = '10000';

    this.valuesElement = valuesElement;
    this.valuesElement.style.height = '100%';
    this.valuesElement.style[transformStylePropertyName] = 'preserve-3d';

    this._labels = [];

    var valueLabel;

    for(var i = 0; i < values.length; i++){
        valueLabel = crel('label', values[i].toString());
        valueLabel.barrelValue = values[i];
        valueLabel.style.display = 'block';
        valueLabel.style.position = 'absolute';
        valueLabel.style.height = unitr(this.labelHeight);
        valueLabel.style.top = '50%';
        valueLabel.style['margin-top'] = unitr(-(this.labelHeight / 2));
        valueLabel.style[transformPropertyName] = 'rotateX(' + 360 / values.length * i + 'deg) translateZ(' + unitr(parseInt(this.labelHeight * this.values.length / Math.PI) / 2) + ')';
        valueLabel.style[backfacePropertyName] = 'hidden';

        valuesElement.appendChild(valueLabel);
    }

    interact.on('start', document, function(interaction){
        if(!doc.closest(interaction.originalEvent.target, valuesElement)){
            return;
        }

        interaction.preventDefault();

        interaction.barrelDial = dial;
    });

    return this;
};
Dial.prototype.trigger = function(event){
    if(typeof event === 'string'){
        event = {type:event};
    }
    event.target = this;
    if(this._events[event.type]){
        for(var i = 0; i < this._events[event.type].length; i++){
            this._events[event.type][i](event);
        }
    }
    return this;
};
Dial.prototype.on = function(type, callback){
    if(!this._events[type]){
        this._events[type] = [];
    }
    this._events[type].push(callback);
    return this;
};

module.exports = Dial;