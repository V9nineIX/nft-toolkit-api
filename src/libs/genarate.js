const basePath = process.cwd();
const { NETWORK } = require(`../constants/network`);
const fs = require("fs");
const sha1 = require(`sha1`);
const { createCanvas, loadImage } = require(`canvas`);
const buildDir = `${basePath}/build`;
// const layersDir = `${basePath}/layers`;
const layersDir = `${basePath}/folder/layers`;
const {
  format,
  baseUri,
  description,
  background,
  uniqueDnaTorrance,
  //   layerConfigurations,
  rarityDelimiter,
  shuffleLayerConfigurations,
  debugLogs,
  extraMetadata,
  text,
  namePrefix,
  network,
  solanaMetadata,
  gif,
} = require(`./config`);
const _ = require('lodash')




// If you have selected Solana then the collection starts from 0 automatically
// const layerConfigurations = [
//     {
//       growEditionSizeTo: 5,
//       layersOrder: [
//         { name: "Background" },
//         { name: "Eyeball" },
//         { name: "Eye color" },
//         { name: "Iris" },
//         { name: "Shine" },
//         { name: "Bottom lid" },
//         { name: "Top lid" },
//       ],
//     },
//   ];



const canvas = createCanvas(format.width, format.height);
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = format.smoothing;
// var metadataList = [];
var attributesList = [];
const DNA_DELIMITER = "-";
const HashlipsGiffer = require(`./HashlipsGiffer.js`);
const { resolve } = require("path");
const { isEmpty } = require("lodash");

let hashlipsGiffer = null;

const buildSetup = () => {
  if (fs.existsSync(buildDir)) {
    fs.rmdirSync(buildDir, { recursive: true });
  }
  fs.mkdirSync(buildDir);
  fs.mkdirSync(`${buildDir}/json`);
  fs.mkdirSync(`${buildDir}/images`);
  if (gif.export) {
    fs.mkdirSync(`${buildDir}/gifs`);
  }
};

const getRarityWeight = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = Number(
    nameWithoutExtension.split(rarityDelimiter).pop()
  );
  if (isNaN(nameWithoutWeight)) {
    nameWithoutWeight = 1;
  }
  return nameWithoutWeight;
};

const cleanDna = (_str) => {
  const withoutOptions = removeQueryStrings(_str);
  var dna = Number(withoutOptions.split(":").shift());
  return dna;
};

const cleanName = (_str) => {
  let nameWithoutExtension = _str.slice(0, -4);
  var nameWithoutWeight = nameWithoutExtension.split(rarityDelimiter).shift();
  return nameWithoutWeight;
};

const getElements = (path, layer) => {
  return fs
    .readdirSync(path)
    .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
    .map((i, index) => {
      if (i.includes("-")) {
        throw new Error(`layer name can not contain dashes, please fix: ${i}`);
      }

      let weight = getRarityWeight(i)
      const imageName = cleanName(i)

      if (!_.isEmpty(layer)) {
        if (!_.isEmpty(layer.image)) {

          const imageConfig = layer.image.find(img => img.name == imageName)
          if (!_.isEmpty(imageConfig)) {
            weight = imageConfig.rarity
          }

        }
      }
      //console.log(cleanName(i))

      return {
        id: index,
        name: imageName,
        filename: i,
        path: `${path}${i}`,
        weight: weight,
      };
    });
};

const layersSetup = (layersOrder, projecDir = `${layersDir}`) => {
  const layers = layersOrder.map((layerObj, index) => ({
    id: index,
    elements: getElements(`${projecDir}/${layerObj.name}/`, layerObj),
    // elements: getElements(`${layersDir}/${layerObj.name}/` ,layerObj),
    name:
      layerObj.options?.["displayName"] != undefined
        ? layerObj.options?.["displayName"]
        : layerObj.name,
    blend:
      layerObj.options?.["blend"] != undefined
        ? layerObj.options?.["blend"]
        : "source-over",
    opacity:
      layerObj.options?.["opacity"] != undefined
        ? layerObj.options?.["opacity"]
        : 1,
    bypassDNA:
      layerObj.options?.["bypassDNA"] !== undefined
        ? layerObj.options?.["bypassDNA"]
        : false,
  }));
  return layers;
};

const saveImage = (_editionCount, buildFolder = `${buildDir}/images`) => {
  try {
    //   fs.writeFileSync(
    //     `${buildDir}/images/${_editionCount}.png`,
    //     canvas.toBuffer("image/png")
    //   );
    fs.writeFileSync(
      `${buildFolder}/${_editionCount}.png`,
      canvas.toBuffer("image/png")
    );
  } catch (ex) {
    console.log(ex)
  }
};

const genColor = () => {
  let hue = Math.floor(Math.random() * 360);
  let pastel = `hsl(${hue}, 100%, ${background.brightness})`;
  return pastel;
};

const drawBackground = () => {
  ctx.fillStyle = background.static ? background.default : genColor();
  ctx.fillRect(0, 0, format.width, format.height);
};

const addMetadata = (
  _dna,
  _edition,
  jsonFolder = `${buildDir}/json`,
  metaData = null,
  ipfsHasId = null,
  metadataList = [],
  extension = "txt",
  isWriteSingleJson = true,
  imagePath = null
) => {
  return new Promise(async (resolve, reject) => {

    let dateTime = Date.now();
    //TOOD  merge custom attribute
    let attributes = metaData?.attributes || []

    if (!isEmpty(metaData.customAttributes)) {
      attributes = [...attributes, ...metaData.customAttributes]
    }
    
    let image = `ipfs://${ipfsHasId}/${_edition}.png`
    if(imagePath){
        image = imagePath
    }

    let tempMetadata = {
      name: `${metaData?.name}`,
      description: metaData?.description || "",
      symbol: metaData?.symbol || "",
      image: image,
      edition: _edition,
      date: dateTime,
      // ...extraMetadata,
      attributes: attributes
    };
    //   if (network == NETWORK.sol) {
    //     tempMetadata = {
    //       //Added metadata for solana
    //       name: tempMetadata.name,
    //       symbol: solanaMetadata.symbol,
    //       description: tempMetadata.description,
    //       //Added metadata for solana
    //       seller_fee_basis_points: solanaMetadata.seller_fee_basis_points,
    //       image: `${_edition}.png`,
    //       //Added metadata for solana
    //       external_url: solanaMetadata.external_url,
    //       edition: _edition,
    //       ...extraMetadata,
    //       attributes: tempMetadata.attributes,
    //       properties: {
    //         files: [
    //           {
    //             uri: `${_edition}.png`,
    //             type: "image/png",
    //           },
    //         ],
    //         category: "image",
    //         creators: solanaMetadata.creators,
    //       },
    //     };
    //   }

    let rawMetaData = {
      ...tempMetadata,
      dna: _dna,
      rawImage: `${jsonFolder.replace("json", "image").substring(1)}/${_edition}.png`,
      tokenType: "generate",
      qty: 1,
      type: "ERC721"
    }

    metadataList.push(rawMetaData);

    if (isWriteSingleJson) {
      try {

        fs.writeFileSync(
          `${jsonFolder}/${_edition}.${extension}`,
          JSON.stringify(tempMetadata, null, 2),
          'utf8'
        );

      } catch (ex) {
        console.log(ex)
      }
    }

    attributesList = [];
    resolve("write done")
  });

};

const addAttributes = (_element) => {
  let selectedElement = _element.layer.selectedElement;
  attributesList.push({
    trait_type: _element.layer.name,
    value: selectedElement.name,
  });
};

const loadLayerImg = async (_layer) => {
  try {
    return new Promise(async (resolve) => {

      let imagePath = _layer.selectedElement.path
      if (imagePath.charAt(0) != ".")
        imagePath = "." + imagePath

      const image = await loadImage(`${imagePath}`);
      resolve({ layer: _layer, loadedImage: image });
    });
  } catch (error) {
    console.error("Error loading image:", error);
  }
};

const addText = (_sig, x, y, size) => {
  ctx.fillStyle = text.color;
  ctx.font = `${text.weight} ${size}pt ${text.family}`;
  ctx.textBaseline = text.baseline;
  ctx.textAlign = text.align;
  ctx.fillText(_sig, x, y);
};

const drawElement = (_renderObject, _index, _layersLen) => {
  //ctx.globalAlpha = _renderObject.layer.opacity;
  // ctx.globalCompositeOperation = _renderObject.layer.blend;

  ctx.globalAlpha = 1
  ctx.globalCompositeOperation = 'source-over'
  text.only
    ? addText(
      `${_renderObject.layer.name}${text.spacer}${_renderObject.layer.selectedElement.name}`,
      text.xGap,
      text.yGap * (_index + 1),
      text.size
    )
    : ctx.drawImage(
      _renderObject.loadedImage,
      0,
      0,
      format.width,
      format.height
    );

  addAttributes(_renderObject);
};

const constructLayerToDna = async (_dna = "", _layers = []) => {
  //  console.log(_dna , _layers)
  //   return new Promise( (resolve, reject) => {
  let mappedDnaToLayers = []
  for (const [index, layer] of _layers.entries()) {
    //   let mappedDnaToLayers = _layers.map((layer, index) => {
    let selectedElement = layer.elements.find(
      (e) => e.id == cleanDna(_dna.split(DNA_DELIMITER)[index])
    );
    mappedDnaToLayers.push({
      name: layer.name,
      blend: layer.blend,
      opacity: layer.opacity,
      selectedElement: selectedElement,
    });
    //});
  }
  //console.log("mappedDnaToLayers ",mappedDnaToLayers )
  return mappedDnaToLayers;
  //   resolve( mappedDnaToLayers)
  //  });
};

/**
 * In some cases a DNA string may contain optional query parameters for options
 * such as bypassing the DNA isUnique check, this function filters out those
 * items without modifying the stored DNA.
 *
 * @param {String} _dna New DNA string
 * @returns new DNA string with any items that should be filtered, removed.
 */
const filterDNAOptions = (_dna) => {
  const dnaItems = _dna.split(DNA_DELIMITER);
  const filteredDNA = dnaItems.filter((element) => {
    const query = /(\?.*$)/;
    const querystring = query.exec(element);
    if (!querystring) {
      return true;
    }
    const options = querystring[1].split("&").reduce((r, setting) => {
      const keyPairs = setting.split("=");
      return { ...r, [keyPairs[0]]: keyPairs[1] };
    }, []);

    return options.bypassDNA;
  });

  return filteredDNA.join(DNA_DELIMITER);
};

/**
 * Cleaning function for DNA strings. When DNA strings include an option, it
 * is added to the filename with a ?setting=value query string. It needs to be
 * removed to properly access the file name before Drawing.
 *
 * @param {String} _dna The entire newDNA string
 * @returns Cleaned DNA string without querystring parameters.
 */
const removeQueryStrings = (_dna) => {
  const query = /(\?.*$)/;
  return _dna.replace(query, "");
};

const isDnaUnique = (_DnaList = new Set(), _dna = "") => {
  const _filteredDNA = filterDNAOptions(_dna);
  return !_DnaList.has(_filteredDNA);
};

const createDna = (_layers) => {
  let randNum = [];
  _layers.forEach((layer) => {
    var totalWeight = 0;
    layer.elements.forEach((element) => {
      totalWeight += element.weight;
    });
    // number between 0 - totalWeight
    let random = Math.floor(Math.random() * totalWeight);
    for (var i = 0; i < layer.elements.length; i++) {
      // subtract the current weight from the random weight until we reach a sub zero value.
      random -= layer.elements[i].weight;
      if (random < 0) {
        return randNum.push(
          `${layer.elements[i].id}:${layer.elements[i].filename}${layer.bypassDNA ? "?bypassDNA=true" : ""
          }`
        );
      }
    }
  });
  return randNum.join(DNA_DELIMITER);
};

const writeMetaData = (_data, buildDir = buildDir) => {
  // console.log("data", _data)

  fs.writeFileSync(`${buildDir}/metadata.json`, _data);

};


const writeMergeMeta = async (data, buildDir = buildDir) => {
  return new Promise(async (resolve, reject) => {

    const metaDataPath = `${buildDir}/metadata.json`

    try {

      if (fs.existsSync(metaDataPath)) {

        const metadata = JSON.parse(fs.readFileSync(metaDataPath, 'utf-8'));
        const filterMeta = metadata.filter(item => item.tokenType == "custom")
        const mergeMeta = [...data, ...filterMeta]
        fs.writeFileSync(metaDataPath, JSON.stringify(mergeMeta, null, 2));
      } else {
        fs.writeFileSync(metaDataPath, JSON.stringify(data, null, 2));
      }
      resolve(true)

    } catch (ex) {
      reject(new Error("Can not write metadata"))
    }

  })

};

const saveMetaDataSingleFile = (_editionCount) => {
  try {

    let metadata = metadataList.find((meta) => meta.edition == _editionCount);

    console.log(
      `Writing metadata for ${_editionCount}: ${JSON.stringify(metadata)}`
    )
    fs.writeFileSync(
      `${buildDir}/json/${_editionCount}.json`,
      JSON.stringify(metadata, null, 2)
    );
  } catch (ex) {
    console.log(ex)

  }

};

function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }
  return array;
}

const startCreating = async ({
  layerConfigurations,
  projectDir,
  buildFolder,
  jsonFolder,
  job = null
}) => {

  return new Promise(async (resolve, reject) => {

    var dnaList = new Set();
    let layerConfigIndex = 0;
    let editionCount = 1;
    let failedCount = 0;
    let abstractedIndexes = [];
    let progress = 0;
    const totolSupply = layerConfigurations[layerConfigurations.length - 1].growEditionSizeTo

    console.log("layerConfigurations", layerConfigurations)

    for (
      let i = 1;
      i <= totolSupply;
      i++
    ) {
      abstractedIndexes.push(i);
    }
    if (shuffleLayerConfigurations) {
      abstractedIndexes = shuffle(abstractedIndexes);
    }
    debugLogs
      ? console.log("Editions left to create: ", abstractedIndexes)
      : null;
    while (layerConfigIndex < layerConfigurations.length) {
      const layers = layersSetup(
        layerConfigurations[layerConfigIndex].layersOrder,
        projectDir
      );
      while (
        editionCount <= totolSupply
      ) {
        let newDna = createDna(layers);
        if (isDnaUnique(dnaList, newDna)) {
          let results = await constructLayerToDna(newDna, layers);
          let loadedElements = [];

          for (const layer of results) {
            loadedElements.push(loadLayerImg(layer));
          }



          await Promise.all(loadedElements).then((renderObjectArray) => {
            debugLogs ? console.log("Clearing canvas") : null;
            ctx.clearRect(0, 0, format.width, format.height);
            if (gif.export) {
              hashlipsGiffer = new HashlipsGiffer(
                canvas,
                ctx,
                `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
                gif.repeat,
                gif.quality,
                gif.delay
              );
              hashlipsGiffer.start();
            }
            if (background.generate) {
              drawBackground();
            }
            renderObjectArray.forEach((renderObject, index) => {

              drawElement(
                renderObject,
                index,
                layerConfigurations[layerConfigIndex].layersOrder.length
              );
              if (gif.export) {
                hashlipsGiffer.add();
              }
            });
            if (gif.export) {
              hashlipsGiffer.stop();
            }
            debugLogs
              ? console.log("Editions left to create: ", abstractedIndexes)
              : null;
            saveImage(abstractedIndexes[0], buildFolder);
            addMetadata(newDna, abstractedIndexes[0], jsonFolder);

            // saveMetaDataSingleFile(abstractedIndexes[0]);
            console.log(
              `Created edition: ${abstractedIndexes[0]}, with DNA: ${sha1(
                newDna
              )}`
            );
          });


          dnaList.add(filterDNAOptions(newDna));
          progress = ((editionCount / totolSupply) * 100).toFixed()
          console.log("progress ...", progress + "%");
          //TODO update progress
          if (job) {
            job.progress(progress)
          }

          editionCount++;
          abstractedIndexes.shift();


        } //end if
        else {
          console.log("DNA exists!");
          failedCount++;
          if (failedCount >= uniqueDnaTorrance) {
            console.log(
              `You need more layers or elements to grow your edition to ${layerConfigurations[layerConfigIndex].growEditionSizeTo} artworks!`
            );
            // process.exit();
            // reject()
            resolve("Error")

            return
          }
        }


      } //end while gowEdition
      console.log(layerConfigIndex)
      layerConfigIndex++;
    }
    writeMetaData(JSON.stringify(metadataList, null, 2));
    // console.log("end loop")
    resolve("Finsish")
  }) //  end promise
};



const generateCollection = async ({
  layersElement,
  totalSupply,
  projectDir,
  buildFolder,
  jsonFolder,
  job = null
}) => {

  return new Promise(async (resolve, reject) => {
    try {

      let editionCount = 0
      let progress = 0
      let metadataList = []



      while (editionCount < totalSupply) {

        // console.log(" layersElement", layersElement)
        //TODO
        let loadedElements = [];
        let { dna = null, layers, metaData } = layersElement[editionCount]
        /// revers layer for genreate
        layers = _.reverse(layers)

        for (const layer of layers) {
          loadedElements.push(loadLayerImg(layer));
        }



        await Promise.all(loadedElements).then((renderObjectArray) => {
          debugLogs ? console.log("Clearing canvas") : null;
          ctx.clearRect(0, 0, format.width, format.height);
          // if (gif.export) {
          // hashlipsGiffer = new HashlipsGiffer(
          //     canvas,
          //     ctx,
          //     `${buildDir}/gifs/${abstractedIndexes[0]}.gif`,
          //     gif.repeat,
          //     gif.quality,
          //     gif.delay
          // );
          // hashlipsGiffer.start();
          // }
          // if (background.generate) {
          // drawBackground();
          // }
          renderObjectArray.forEach((renderObject, index) => {

            drawElement(
              renderObject,
              index,
              layers.length
            );
            // if (gif.export) {
            //     hashlipsGiffer.add();
            // }
            // });
            // if (gif.export) {
            // hashlipsGiffer.stop();
            // }
          })

          saveImage(editionCount, buildFolder);
          addMetadata(dna, editionCount, jsonFolder, metaData, null, metadataList, "json", false);

          console.log(
            `Created edition: ${editionCount}, with DNA: `
          );

        });



        progress = (((editionCount+1)/ totalSupply) * 100).toFixed()
        console.log("progress ...", progress + "%");
        //TODO update progress
        if (job) {
          job.progress(progress)
        }

        editionCount++;


      } //end while gowEdition


    //   writeMetaData(JSON.stringify(metadataList, null, 2), jsonFolder);
      await writeMergeMeta(metadataList, jsonFolder)

      // console.log("end loop")
      resolve("Finsish")
    } catch (ex) {
      console.log(ex)
      resolve("Error")
    }
  }) //  end promise
};



module.exports = {
  startCreating,
  buildSetup,
  getElements,
  generateCollection,
  addMetadata,
  writeMetaData,
  writeMergeMeta
};
