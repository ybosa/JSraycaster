import Block from "../../src/block.js";



describe("Test Block", ()=>{
    class StoneBrick extends Block{
        constructor() {
            const blockData = { wall: true,}
            super(blockData);
        }
    }

    class StoneBrickFloor extends Block{
        constructor() {
            const blockData = {
                passable: true,
                wall: false,
                floor: true,
                ceiling: true,
            }
            super(blockData);
        }
    }

    test('Block can be instantiated through a child block', ()=>{

        const sb = new StoneBrick()
        const sbf = new StoneBrickFloor()

        expect(sb.isWall() !== sbf.isWall())

    })

})