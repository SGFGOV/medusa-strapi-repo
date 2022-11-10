export const regionService = {
    retrieve: jest.fn((id) => {
      if (id === "exists") {
        return Promise.resolve({ id: "exists" })
      }
      return Promise.resolve(undefined)
    }),
  }
  export const productService = {
    retrieve: jest.fn((id) => {
      if (id === "exists") {
        return Promise.resolve({ id: "exists" })
      }
      return Promise.resolve(undefined)
    }),
  }
  export const redisClient = {
    get: async (id) => {
      // const key = `${id}_ignore_${side}`
      if (id === `ignored_ignore_strapi`) {
        return { id }
      }
      return undefined
    },
    set: async (id) => {
      return undefined
    },
  }
  export const productVariantService = {
    retrieve: jest.fn((id) => {
      if (id === "exists") {
        return Promise.resolve({ id: "exists" })
      }
      return Promise.resolve(undefined)
    }),
  }
  export const eventBusService = {}
