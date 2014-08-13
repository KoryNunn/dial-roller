var EventEmitter = require('events').EventEmitter,
    interact = require('interact-js'),
    crel = require('crel'),
    doc = require('doc-js'),
    transformPropertyName = '-webkit-transform',
    venfix = require('venfix'),
    translate = require('css-translate'),
    unitr = require('unitr'),
    HORIZONTAL = 'horizontal',
    VERTICAL = 'vertical',
    NE = 45,
    NW = -45,
    SE = 135,
    SW = -135;

var dials = [];

function getPlane(angle){
    return ((angle > NE && angle < SE) || (angle < NW && angle > SW)) ? HORIZONTAL : VERTICAL;
}

function isVertical(direction){
    return direction === 'vertical';
}

interact.on('drag', document, function(interaction){
    for(var i = 0; i < dials.length; i++){
        dials[i]._drag(interaction);
    }
});

interact.on('end',document, function(interaction){
    for(var i = 0; i < dials.length; i++){
        dials[i].endUpdate();
    }
});

function rotateStyle(direction, angle){
    var vertical = isVertical(direction);
    return 'rotate' + (vertical?'X':'Y') + '(' + angle + 'deg)'
}

function Dial(settings){
    for(var key in settings){
        if(settings.hasOwnProperty(key)){
            this[key] = settings[key];
        }
    }
    this._value = this._items[0];
    this._events = {};
    this.velocity = 0;
    this._angle = 0;
    this.render();
    this.element.barrelDial = this;
    dials.push(this);
}
Dial.prototype = Object.create(EventEmitter.prototype);
Dial.prototype.constructor = Dial;
Dial.prototype.direction = 'horizontal';
Dial.prototype._radius = 1;
Dial.prototype.radius = function(value){
    var dial = this;

    if (arguments.length === 0) {
        return this._radius;
    }

    if(isNaN(value)){
        value = 1;
    }

    this._radius = Math.max(value, 1);

    return this;
};
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

    var value = dial._items.length / 360 * dial._angle;
        valueIndex = Math.round(value),
        valueAngle = 360 / dial._items.length * valueIndex,
        oldValue = dial._value;
        newValue = dial._items[Math.abs(valueIndex - dial._items.length) % dial._items.length];

        dial._value = newValue;

        dial.emit('roll');
        if(oldValue != newValue){
            dial.emit('change', dial.value());
        }
    });

    return this;
};
Dial.prototype.update = function(){
    var vertical = isVertical(this.direction);

    this.itemsElement.style[venfix('transform')] =
        'translateZ(' + -this._radius + 'px) ' +
        rotateStyle(
            this.direction,
            isVertical(this.direction)?this._angle:-this._angle
        );

    if(this._itemsRendered){

        if(this.itemsElement.children.length){
            this.radius(
                this.itemsElement.children[0]['client' + (vertical?'Height':'Width')] / 2 /
                Math.tan(Math.PI / this._items.length)
            );
        }

        if(typeof this.updateItem === 'function'){
            for(var i = 0; i < this._items.length; i++){
                this.updateItem(
                    this.itemsElement.children[i],
                    i,
                    this._items[i]
                );
            }
        }
    }
};
Dial.prototype.updateItem = function(itemElement, index){
    var vertical = isVertical(this.direction);

    itemElement.style[venfix('transform')] =
        rotateStyle(
            this.direction,
            (360 / this._items.length * index - 180)
        ) +
        ' translateZ(' + (this._radius) + 'px)';
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

    var value = dial._items.length / 360 * dial._angle;
        valueIndex = Math.round(value),
        valueAngle = 360 / dial._items.length * valueIndex;

    dial.spinTo(valueAngle, function(){
        dial._value = dial._items[Math.abs(valueIndex - dial._items.length) % dial._items.length];
        dial.emit('settle');
    });
};
Dial.prototype.value = function(setValue){
    var newValue = setValue || 0,
        dial = this;

    if (arguments.length === 0) {
        return this._value;
    }

    if(newValue === this._value){
        return;
    }

    this._value = newValue;

    dial.spinTo(360 - (360 / dial._items.length * this._value));

    this.emit('change', dial.value());
    this.emit('settle');

    return this;
};

Dial.prototype._items = [0,1,2,3,4,5,6,7,8,9];
Dial.prototype.items = function(setItems){
    var dial = this;

    if (arguments.length === 0) {
        return this._items;
    }

    this._items = setItems;

    this.renderItems();

    return this;
};
Dial.prototype.render = function(){
    var dial = this,
        itemsElement;

    dial.element = crel('div', {'class':'dial'},
        itemsElement = crel('div', {'class':'values'})
    );
    dial.itemsElement = itemsElement;

    doc.ready(function(){
        dial.element.style.display = 'inline-block';
        dial.element.style.overflow = 'hidden';
        dial.element.style[venfix('perspective')] = '10000';
        dial.element.style.position = 'relative';

        dial.itemsElement.style.height = '100%';
        dial.itemsElement.style[venfix('transform-style')] = 'preserve-3d';

        dial._labels = [];

        dial.renderItems();
        dial.update();
    });

    return this;
};
Dial.prototype.renderItem = function(item){
    return crel('label', item.toString());
};
Dial.prototype.renderItems = function(){
    var dial = this,
        itemElement,
        items = dial._items.slice();

    dial.itemsElement.innerHTML = '';

    for(var i = 0; i < items.length; i++){
        itemElement = dial.renderItem(items[i]);
        itemElement.barrelValue = items[i];
        itemElement.style.display = 'block';
        itemElement.style.position = 'absolute';
        itemElement.style[venfix('backface-visibility')] = 'hidden';

        dial.itemsElement.appendChild(itemElement);
    }

    dial._itemsRendered = true;
};
Dial.prototype._drag = function(interaction){
    var dial = this,
        angle = interaction.getCurrentAngle();

    if(
        interaction.moves.length < 2 ||
        !doc.closest(interaction.lastStart.target, dial.element) ||
        getPlane(angle) !== this.direction
    ){
        return;
    }

    var vertical = isVertical(dial.direction);

    this.beginUpdate();
    interaction.preventDefault();

    var lastMove = interaction.moves[interaction.moves.length-2],
        scrollDistance = lastMove ? lastMove[vertical?'pageY':'pageX'] - interaction[vertical?'pageY':'pageX'] : 0,
        spinRatio = scrollDistance / (dial._radius * Math.PI);
        degrees = 360 * spinRatio;

    dial.velocity = degrees;

    dial.spin(degrees);

};
Dial.prototype.destroy = function(){
    var index = dials.indexOf(this);

    if(~index){
        dials.splice(index, 1);
    }
};

module.exports = Dial;