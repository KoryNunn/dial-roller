var EventEmitter = require('events').EventEmitter,
    interact = require('interact-js'),
    crel = require('crel'),
    doc = require('doc-js'),
    transformPropertyName = '-webkit-transform',
    venfix = require('venfix'),
    translate = require('css-translate'),
    laidout = require('laidout'),
    unitr = require('unitr');

var dials = [];

if(typeof document !== 'undefined'){
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
}

function closestIndexFrom(items, item, startIndex){
    if(isNaN(startIndex)){
        startIndex = 0;
    }

    var distance = 0,
        length = items.length;

    while(distance<=length/2){
        var after = (startIndex+distance)%length,
            before = (startIndex-distance)%length;


        if(items[before] === items[after] && items[before] === item){
            return startIndex - before > 0 ? before : after;
        }
        if(items[after] === item){
            return after;
        }
        if(items[before] === item){
            return before;
        }
        distance++;
    }

    return -1;
}

function isVertical(direction){
    return direction === 'vertical';
}

function boundAngle(angle){
    return angle % 360;
}

function rotateStyle(direction, angle){
    var vertical = isVertical(direction);
    return 'rotate' + (vertical?'X':'Y') + '(' + angle + 'deg)'
}

function Face(dial, data){
    this._dial = dial;
    this._data = data;
}
Face.prototype.render = function(){
    var element = this.element = crel('label');
    element.style.display = 'block';
    element.style.position = 'absolute';
    element.style[venfix('backface-visibility')] = 'hidden';
};
Face.prototype.update = function(){
    var face = this;
    var vertical = isVertical(face._dial.direction);

    if(
        face._lastRadius === face._dial._radius &&
        face._lastAngle === face._angle
    ){
        return;
    }

    face.element.style[venfix('transform')] =
        rotateStyle(
            face._dial.direction,
            face._angle
        ) +
        ' translateZ(' + (face._dial._radius) + 'px)';

    face._lastRadius = face._dial._radius;
    face._lastAngle = face._angle;
};
Face.prototype._angle = 0;
Face.prototype.angle = function(newAngle){
    var face = this;

    if (arguments.length === 0) {
        return this._angle;
    }

    this._angle = newAngle;

    this.update();

    return this;
};
Face.prototype.destroy = function(){
    this._lastAngle = this._lastRadius = null;
    this.element && this.element.parentElement && this.element.parentElement.removeChild(this.element);
};

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
    this._faces = [];
    this.render();
    this.element.barrelDial = this;
    dials.push(this);
}
Dial.prototype = Object.create(EventEmitter.prototype);
Dial.prototype.constructor = Dial;
Dial.prototype.direction = 'horizontal';
Dial.prototype._faceWidth = 1;
Dial.prototype.faceWidth = function(value){
    var dial = this;

    if (arguments.length === 0) {
        return this._faceWidth;
    }

    if(isNaN(value)){
        value = 1;
    }

    var newWidth = Math.max(value, 1);

    if(newWidth === this._faceWidth){
        return this;
    }

    this._faceWidth = newWidth;

    this.update();

    return this;
};
Dial.prototype._radius = 1;
Dial.prototype.radius = function(value){
    var dial = this;

    if (arguments.length === 0) {
        return this._radius;
    }

    if(isNaN(value)){
        value = 1;
    }

    var newRadius = Math.max(value, 1);

    if(newRadius === this._radius){
        return this;
    }

    this._radius = newRadius;

    this.update();

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
Dial.prototype._spin = function(degrees){

    this._angle = boundAngle(this._angle + degrees);

    this.update();

    var index = (this._items.length + Math.round(this._items.length / 360 * this._angle)) % this._items.length,
        oldValue = this._value;

    this._index = index;
    this._value = this._items[index];

    this.emit('roll');
    if(oldValue != this._value && this._held){
        this.emit('change', this.value());
    }
};
Dial.prototype.spin = function(degrees, callback){
    degrees = boundAngle(degrees);

    var dial = this;

    window.requestAnimationFrame(function(){
        dial._spin(degrees);
        callback && callback();
    });

    return this;
};
Dial.prototype.update = function(){
    var vertical = isVertical(this.direction);

    this.radius(
        this._faceWidth / 2 /
        Math.tan(Math.PI / this._items.length)
    );

    this.itemsElement.style[venfix('transform')] =
        'translateZ(' + -this._radius + 'px) ' +
        rotateStyle(
            this.direction,
            isVertical(this.direction)?this._angle:-this._angle
        );

    for(var i = 0; i < this._faces.length; i++){
        var face = this._faces[i];
        face.update();
    }
};
Dial.prototype.spinTo = function(angle, callback){
    var dial = this;

    this._targetAngle = boundAngle(angle);

    if(this._spinning){
        return;
    }
    this._spinning = true;

    var dial = this,
        settleFn = function(){
            if(dial._held){
                dial._spinning = false;
                return;
            }

            dial.spin((dial._targetAngle - dial._angle) * 0.2, function(){
                if(Math.abs(dial._targetAngle - dial._angle) > 0.1){
                    settleFn();
                }else{
                    dial._angle = dial._targetAngle;
                    dial.update();
                    callback && callback();
                    dial._spinning = false;
                }
            });
        }

    settleFn();
};
Dial.prototype.settle = function(){
    var dial = this;

    var value = dial._items.length / 360 * dial._angle;
        valueIndex = Math.round(value),
        valueAngle = 360 / dial._items.length * valueIndex || 0;

    dial.spinTo(valueAngle, function(){
        dial._index = Math.abs(valueIndex - dial._items.length) % dial._items.length;
        dial._value = dial._items[dial._index];
        dial.emit('settle');
        dial.emit('change', dial.value());
    });
};
Dial.prototype.value = function(value){
    if (arguments.length === 0) {
        return this._value;
    }

    if(value === this._value){
        return;
    }

    this._index = closestIndexFrom(this._items, value, this._index);
    this._value = value;
    this.spinTo(boundAngle(360 / this._items.length * this._index));

    this.emit('change', this._value);
    this.emit('settle');

    return this;
};
Dial.prototype._items = [];
Dial.prototype.items = function(setItems){
    var dial = this;

    if (arguments.length === 0) {
        return this._items;
    }

    this._items = setItems;

    while(this._faces.length){
        this._faces.pop().destroy();
    }

    for (var i = 0; i < this._items.length; i++) {
        var newFace = new Face(this, this._items[i]);
        newFace.render = this.renderItem;
        this._faces.push(newFace);
    };

    this.renderFaces();
    this.update();

    var currentValueIndex = this._items.indexOf(this._value);

    if(currentValueIndex>=0){
        this.value(this._items[currentValueIndex]);
    }else{
        this.value(this._items[0]);
    }

    return this;
};
Dial.prototype.render = function(){
    var dial = this,
        itemsElement;

    dial.element = crel('div', {'class':'dial'},
        itemsElement = crel('div', {'class':'values'})
    );
    dial.itemsElement = itemsElement;

    laidout(dial.element, function(){
        dial.element.style.display = 'inline-block';
        dial.element.style.overflow = 'hidden';
        dial.element.style[venfix('perspective')] = '10000';
        dial.element.style.position = 'relative';

        dial.itemsElement.style.height = '100%';
        dial.itemsElement.style[venfix('transform-style')] = 'preserve-3d';

        dial.renderFaces();
        dial.update();
        dial.settle();
    });

    return this;
};
Dial.prototype.renderItem = function(item){
    return crel('label', item.toString());
};
Dial.prototype.renderFaces = function(){
    var dial = this,
        itemElement,
        sliceAngle = (360 / this._items.length);

    for(var i = 0; i < this._faces.length; i++){
        var face = this._faces[i];
        face.destroy();
        face.render();
        face.angle(sliceAngle*i);
        dial.itemsElement.appendChild(face.element);
    }
};
Dial.prototype._drag = function(interaction){
    var dial = this;

    if(
        !doc.closest(interaction.lastStart.target, dial.element)
    ){
        return;
    }

    var vertical = isVertical(dial.direction);

    this.beginUpdate();

    var lastMove = interaction.moves[interaction.moves.length-2] || interaction.lastStart,
        scrollDistance = lastMove ? lastMove[vertical?'pageY':'pageX'] - interaction[vertical?'pageY':'pageX'] : 0,
        spinRatio = scrollDistance / (dial._radius * Math.PI * 2);
        degrees = 360 * spinRatio;

    dial.velocity = degrees;

    dial.spin(degrees);
    dial.emit('drag', interaction);
};
Dial.prototype.destroy = function(){
    var index = dials.indexOf(this);

    if(~index){
        dials.splice(index, 1);
    }
};

module.exports = Dial;