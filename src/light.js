"use strict";
export class Light{
    #radius; //[m] radius of light
    #colour; // array of [r,g,b,b], FINAL b is transparency, stands in for brightness (rgba format)
    #decay;  //rate of decay exponent


    getRadius() {
        return this.#radius;
    }

    calcColourAtDist(x,y, X2, Y2) {
        let dist = (x - X2) * (x - X2) + (y - Y2) * (y - Y2)
        dist = Math.sqrt(dist)
        let mult = Math.pow(Math.abs(this.#radius - dist)/this.#radius, this.#decay)
        if (dist >= this.#radius || mult < 0.01) return null
        if(this.#decay === 0) mult = 1
        let ret = []
        ret.push(this.#colour[0])
        ret.push(this.#colour[1])
        ret.push(this.#colour[2])
        ret.push(this.#colour[3] * mult)

        return ret
    }

    constructor(radius, colour, decay) {
        this.#radius = radius;
        this.#colour = colour;
        this.#decay = decay;
    }

    averageColourValues(lightEntities,mapX,mapY) {
        if(!lightEntities) return null

        let sum0 = 0;let sum1 = 0;let sum2 = 0;let sum3 = 0;
        let maxIntensity = 0;
        lightEntities.forEach((entity) =>{
            let colour = entity.getLight().calcColourAtDist(entity.getX(),entity.getY() ,mapX,mapY)
            if(!colour) return
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
}


function applyLightColourToBlock(block,light){
    if(!block && !light ) return null
    if(!block && light ) return light
    if(block && !light ) return block

    let ret = []
    ret.push((block[0] * (1-light[3])  + light[0] * light[3] ))
    ret.push((block[1] * (1-light[3])  + light[1] * light[3] ))
    ret.push((block[2] * (1-light[3])  + light[2] * light[3] ))
    ret.push((block[3] + light[3]) >= 1 ? 1 : (block[3] + light[3]))
    return ret
}

// function applyLightColourToBlock(C1,C2){
//     if(!C1 && !C2 ) return null
//     if(!C1 && C2 ) return C2
//     if(C1 && !C2 ) return C1
//
//     let ret = []
//     ret.push((C1[0]*C1[3] + C2[0] * C2[3] )/ (C1[3] + C2[3]))
//     ret.push((C1[1]*C1[3] + C2[1] * C2[3] )/ (C1[3] + C2[3]))
//     ret.push((C1[2]*C1[3] + C2[2] * C2[3] )/ (C1[3] + C2[3]))
//     ret.push((C1[3] + C2[3]) >= 1 ? 1 : (C1[3] + C2[3]))
//     return ret
// }

function colourToRGBA(colour){
    return 'rgba('+colour[0]+','+colour[1]+','+colour[2]+','+colour[3]+')'
}

export default {Light,applyLightColourToBlock,colourToRGBA}