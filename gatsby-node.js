const path = require(`path`)

const JANKY_SITE = process.env.JANKY_SITE
const SCALE_CHARACTERS = parseInt(process.env.SCALE_CHARACTERS)
const limit = JANKY_SITE ? 10000 : 40

const axios = require("axios")

exports.sourceNodes = async ({ actions, createContentDigest }) => {
  const { createNode } = actions

  const integerList = (start, length) =>
    Array.from({ length: length }, (v, k) => k + start)

  const rickMortyURL = `https://rickandmortyapi.com/api/character/${integerList(
    1,
    493
  )}`

  const rickMorty = await axios.get(rickMortyURL)
  const data = Array.from(
    { length: SCALE_CHARACTERS },
    () => rickMorty.data
  ).flat()

  
  if (JANKY_SITE === 'true') {
    console.log(`scaled ${data.length}`)
    await Promise.all(
      data.map(async (character, index) => {
        const nodeContent = JSON.stringify(character)
        const nodeMeta = {
          id: JSON.stringify(index),
          parent: null,
          children: [],
          internal: {
            type: `Characters`,
            content: nodeContent,
            contentDigest: createContentDigest(character),
          },
        }
        const node = Object.assign({}, character, nodeMeta)
        createNode(node)
      })
    )
  } else {
    data.forEach((character, index) => {
      const nodeContent = JSON.stringify(character)
      const nodeMeta = {
        id: JSON.stringify(index),
        parent: null,
        children: [],
        internal: {
          type: `Characters`,
          content: nodeContent,
          contentDigest: createContentDigest(character),
        },
      }
      const node = Object.assign({}, character, nodeMeta)
      createNode(node)
    })
  }
  
}

exports.createPages = async ({ graphql, actions }) => {
  const { createPage } = actions
  const CharactersSingle = path.resolve("src/templates/CharactersSingle.js")
  const ProductSingle = path.resolve("src/templates/ProductSingle.js")

  const result = await graphql(`
    query {
      allCharacters {
        nodes {
          id
          name
          gender
          status
          species
          image
        }
      }
      allContentfulProduct {
        nodes {
          id
          janky_company
          janky_job
          janky_wallet
          over_priced
          currency
          material
          product
        }
      }
    }
  `)
  if (result.errors) {
    throw result.errors
  }

  // const posts = result.data.allMarkdownRemark.nodes
  const characters = result.data.allCharacters.nodes
  const products = result.data.allContentfulProduct.nodes

  
  if (JANKY_SITE === "true") {
    console.log(JSON.stringify(products))

    for (let i = 0; i < characters.length; i++) {
      const node = characters[i];
      if (node.name.length >= 10) {
        JANKY_SITE === "true" &&
          console.error(
            `Error: this page is not as janky as it could be, please unfix`
          )
      }

	

      createPage({
        path: `characters/${node.id}`,
        component: CharactersSingle,
        context: {
          id: node.id,
          name: node.name,
          image: node.image,
          species: node.species,
          gender: node.gender,
          status: node.status,
          limit,
        }, // This is to pass data as props to the component.
      })
    }
    const firstId = products[0].id
    for (let i = 0; i < products.length; i++) {
      const nextId = products[i + 1] ? products[i + 1].id : firstId;
      const node = products[i];
      createPage({
        path: `products/${node.id}`,
        component: ProductSingle,
        context: {
          id: node.id,
          nextId,
          jankyCompany: node.janky_company,
          jankyJob: node.janky_job,
          jankyWallet: node.janky_wallet,
          overPriced: node.over_priced,
          currency: node.currency,
          material: node.material,
          product: node.product,
        }, // This is to pass data as props to the component.
      })
    }
    products.forEach((node, index) => {
      
    })
  } else {
    await Promise.all(
      characters.map(async node => {
        createPage({
          path: `characters/${node.id}`,
          component: CharactersSingle,
          context: {
            id: node.id,
            name: node.name,
            image: node.image,
            species: node.species,
            gender: node.gender,
            status: node.status,
            limit,
          }, // This is to pass data as props to the component.
        })
      })
    )
    const firstId = products[0].id

    await Promise.all(
      products.map(async (node, index) => {
        const nextId = products[index + 1] ? products[index + 1].id : firstId;
        createPage({
          path: `products/${node.id}`,
          component: ProductSingle,
          context: {
            id: node.id,
            nextId,
            jankyCompany: node.janky_company,
            jankyJob: node.janky_job,
            jankyWallet: node.janky_wallet,
            overPriced: node.over_priced,
            currency: node.currency,
            material: node.material,
            product: node.product,
          }, // This is to pass data as props to the component.
        })
      })
    )
  }
}
