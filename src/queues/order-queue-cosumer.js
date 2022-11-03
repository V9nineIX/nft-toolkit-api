import { startCreating } from '../libs/genarate'

const orderProcess = async (job ,done) => {
    console.log("job" , job.data)


    const layerConfigurations = [
        {
          growEditionSizeTo: 50,
          layersOrder: [
            {
              name: "Background",
              image: [{
                name: "black",
                rarity: 100
              }]
            },
            {
              name: "Eyeball",
              image: [
                {
                  name: "Red",
                  title: "Red",
                  rarity: 100
                },
                {
                  name: "White",
                  title: "White",
                  rarity: 1
                }
              ],
            },
            {
              name: "Eyecolor",
              image: [
                {
                  name: "Cyan",
                  title: "Cyan",
                  rarity: 1
                },
                {
                  name: "Green",
                  title: "Green",
                  rarity: 50
                },
                {
                  name: "Pink",
                  title: "Pink",
                  rarity: 1
                },
                {
                  name: "Purple",
                  title: "Purple",
                  rarity: 1
                },
                {
                  name: "Red",
                  title: "Red",
                  rarity: 50
                },
                {
                  name: "Yellow",
                  title: "Yellow",
                  rarity: 1
                }
              ],
            },
            { name: "Iris", image: [] },
            { name: "Shine", image: [] },
            { name: "Bottom lid", image: [] },
            { name: "Top lid", image: [] },
          ],
        }
      ];


      const res = await startCreating({ layerConfigurations })
      console.log(res)

      done()

   


}

export { orderProcess }