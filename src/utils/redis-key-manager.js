const IGNORE_THRESHOLD = 3 // seconds

module.exports = {
  async addIgnore_(id, side, client, ignore_threshold) {
    const key = `${id}_ignore_${side}`
    return await client.set(key, 1, "EX", ignore_threshold || IGNORE_THRESHOLD)
  },

  async shouldIgnore_(id, side, client) {
    const key = `${id}_ignore_${side}`
    return await client.get(key)
  },
}
