module.exports = function closestIndexFrom(items, item, startIndex){
    if(isNaN(startIndex)){
        startIndex = 0;
    }

    var distance = 0,
        length = items.length;

    while(distance<=length/2){
        var after = (startIndex+distance)%length,
            before = (startIndex-distance + length)%length;


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
};