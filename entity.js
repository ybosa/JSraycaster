class Entity {
    x;
    y; //coords of entity


    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}

class Light extends Entity {
    radius; //[m] radius of light
    colour; // array of [r,g,b,b], FINAL b is transparency, stands in for brightness (rgba format)
    decay;  //rate of decay exponent

    averageColourValues(lights,x,y) {
        if(!lights) return null

        let sum0 = 0;let sum1 = 0;let sum2 = 0;let sum3 = 0;
        let maxIntensity = 0;
        lights.forEach((light) =>{
            let colour = light.calcColourAtDist(x,y)
            sum0+= colour[0] * colour[3]
            sum1+= colour[1] * colour[3]
            sum2+= colour[2] * colour[3]
            sum3+= colour[3]
            if(colour[3] > maxIntensity) maxIntensity = colour[3]
        })

        let ret = []
        ret.push(sum0 / sum3)
        ret.push(sum1 / sum3)
        ret.push(sum2 / sum3)
        ret.push(maxIntensity)
        if(sum3 <= 0 || maxIntensity <=0)
            return null

        return ret
    }

    calcColourAtDist(X2, Y2) {
        let dist = (this.x - X2) * (this.x - X2) + (this.y - Y2) * (this.y - Y2)
        let mult = Math.pow((this.radius - dist), this.decay)
        if (dist >= this.radius) mult = 0
        let ret = []
        ret.push(this.colour[0])
        ret.push(this.colour[1])
        ret.push(this.colour[2])
        ret.push(this.colour[3] * mult)
        return ret
    }


    constructor(x, y, radius, colour, decay) {
        super(x, y);
        this.radius = radius;
        this.colour = colour;
        this.decay = decay;
    }
}