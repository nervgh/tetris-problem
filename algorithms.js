/**
 * An inefficient port of the data-structure in Python
 * @see https://github.com/aimacode/aima-python/blob/master/utils.py#L688
 */
class PriorityQueue {
  /**
   * @param {Function} [id] An identity function
   * @param {Function} [f] An estimated function
   * @param {String} [order]
   */
  constructor (id = x => x, f = x => x, order = 'min') {
    switch (order) {
      case 'min':
        this.f = x => -f(x)
        break
      case 'max':
        this.f = f
        break
      default:
        throw new Error('Unsupported order')
    }
    this.id = id

    this.__queue = []
  }
  /**
   * @param {*} item
   */
  append (item) {
    const {f, id} = this
    this.__queue.push([f(item), id(item), item]) // cost, id, item
    this.__queue.sort((a, b) => a[0] - b[0])
  }
  /**
   * @param {*} item
   * @return {Boolean}
   */
  contains (item) {
    const itemId = this.id(item)
    return this.__queue.some(x => x[1] === itemId)
  }
  /**
   * @param {*} item
   */
  get (item) {
    const itemId = this.id(item)
    const idx = this.__queue.findIndex(x => x[1] === itemId)
    return this.__queue[idx]
  }
  /**
   * @returns {Number}
   */
  length () {
    return this.__queue.length
  }
  /**
   * @return {*}
   */
  pop () {
    const [, , item] = this.__queue.pop()
    return item
  }
  /**
   * @param {*} item
   */
  remove (item) {
    const {id} = this
    const itemId = id(item)
    const idx = this.__queue.findIndex(x => x[1] === itemId)
    this.__queue.splice(idx, 1)
  }
}
class GraphNode {
  constructor (state = null) {
    this.state = state
    this.pathCost = 0
  }
}
/**
 * An inefficient port of the algorithm implementation in Python
 * @see https://github.com/aimacode/aima-python/blob/master/search.py#L256
 * @param {GraphNode} initialNode
 * @param {Object} options
 * @param {Function} options.id
 * @param {Function} options.f
 * @param {Function} options.isGoal
 * @param {Function} options.getSuccessorsOf
 * @returns {*|null}
 */
function bestFirstGraphSearch (initialNode, {id, f, isGoal, getSuccessorsOf}) {
  // TODO: We have to memorize f function

  if (isGoal(initialNode)) {
    return initialNode
  }

  const frontier = new PriorityQueue(id, f)
  frontier.append(initialNode)
  const explored = new Set()

  while (frontier.length()) {
    const node = frontier.pop()
    if (isGoal(node)) {
      return node
    }
    explored.add(id(node))

    for (const child of getSuccessorsOf(node)) {
      if (!explored.has(id(child)) && !frontier.contains(child)) {
        frontier.append(child)
      } else if (frontier.contains(child)) {
        const incumbent = frontier.get(child)
        if (f(child) < f(incumbent)) {
          frontier.remove(incumbent)
          frontier.append(child)
        }
      }
    }
  }

  return null
}
/**
 * An inefficient port of the algorithm implementation in Python
 * @see https://github.com/aimacode/aima-python/blob/master/search.py#L407
 * @param {GraphNode} initialNode
 * @param {Object} options
 * @param {Function} options.id
 * @param {Function} options.h
 * @param {Function} options.isGoal
 * @param {Function} options.getSuccessorsOf
 * @returns {*|null}
 */
function astarGraphSearch (initialNode, {id, h, isGoal, getSuccessorsOf}) {
  const f = n => n.pathCost + h(n)
  return bestFirstGraphSearch(initialNode, {id, f, isGoal, getSuccessorsOf})
}

// exports
window.GraphNode = GraphNode
window.astarGraphSearch = astarGraphSearch
