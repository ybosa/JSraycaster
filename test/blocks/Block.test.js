import Block from "../../src/block.js";



describe("Test Block", ()=>{
    class StoneBrick extends Block{
        constructor(childBlockData) {
            const blockData = {wall: true,ceiling: true, ceilingImageName:"test"}

            super({...blockData, ...childBlockData});
        }
    }

    class StoneBrickFloor extends StoneBrick{
        constructor() {
            const blockData = {
                staticBlock: false,
                passable: true,
                wall: false,
                floor: true,
                ceiling: true,
                ceilingImageName: "a different image",
            }
            super(blockData);
        }
    }

    test('Block can be instantiated through a child block', ()=>{

        const sb = new StoneBrick()
        const sbf = new StoneBrickFloor()

        expect(sb.isWall() !== sbf.isWall())
        expect(sb.getCeilingImageName()).toEqual("test");
        expect(sbf.getCeilingImageName()).toEqual("a different image");

    })

    test('Static classes are working as expected!', ()=>{

        const sb = new StoneBrick()
        const sb2 = new StoneBrick()
        const sbf = new StoneBrickFloor()
        const sbf2 = new StoneBrickFloor()

        //subclass of a static class can be non static
        expect(sb.isWall() !== sbf.isWall())
        expect(sb !== sbf)
        expect(sbf !== sbf2) // stone brick floor is not stastic
        expect(sb === sb2) //stone brick is static

    })

    test('The template Block class can not be instantiated as a static block', ()=>{

        const block1 = new Block({staticBlock: true,ceiling:true})
        const block2 = new Block({staticBlock: true,ceiling:false})

        expect(block1 !== block2)
        expect(block1.isCeiling() !== block2.isCeiling())

    })


})