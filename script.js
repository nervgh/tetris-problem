
const {
  Matrix, // https://github.com/mateogianolio/vectorious
  Vue
} = window

/*
  Other dependencies

    Data structures and algorithms:
      + GraphNode
      + astarGraphSearch

    utils:
      + getRandomIntInclusive
 */

class Figure {
  /**
   * @param {Array.<Array>.<Number>|Matrix} m Coordinate pairs (x, y) of a figure as a matrix
   * @param {Number} c Center of a figure relative itself (index of a pair)
   */
  constructor (m, c) {
    this.m = new Matrix(m)
    this.c = c
  }
  /**
   * @returns {Figure}
   */
  clone () {
    const {m, c} = this
    return new this.constructor(m, c)
  }
  /**
   * @param {Array.<Number>} vec
   * @returns {Window.Matrix}
   */
  createVectorMatrix (vec) {
    const r = this.m.shape[0]
    const [x, y] = vec
    const aVec = Array.from({length: r}, _ => [x, y])
    return new Matrix(aVec)
  }
  /**
   * Calls a callback for each coordinate pair (x, y)
   * @see https://mateogianolio.com/vectorious/matrix.js.html#line872
   * @param {Function} cb
   * @returns {Figure}
   */
  each (cb) {
    const r = this.m.shape[0]
    for (let i = 0, j = 1, k = 0; k < r; i += 2, j += 2, k++) {
      const x = this.m.data[i]
      const y = this.m.data[j]
      cb.call(this, k, y, x)
    }
    return this
  }
  /**
   * Gets bounds of a figure as a matrix-like array
   * @return {Array.<Array>.<Number>}
   */
  getBounds () {
    const r = this.m.shape[0]
    const xs = new Array(r)
    const ys = new Array(r)
    this.each((i, y, x) => {
      xs[i] = x
      ys[i] = y
    })
    const xMin = Math.min(...xs)
    const yMin = Math.min(...ys)
    const xMax = Math.max(...xs)
    const yMax = Math.max(...ys)
    return [
      // x, y
      [xMin, yMin],
      [xMax, yMax]
    ]
  }
  /**
   * Gets center as a vector
   * @returns {Array.<Number>}
   */
  getCenter () {
    const x = this.m.get(this.c, 0)
    const y = this.m.get(this.c, 1)
    return [x, y]
  }
  /**
   * Shifts a figure relative its current position using a bit of linear algebra
   * @param {Array.<Number>} vec A shift in relative coordinates
   * @returns {Figure}
   */
  move (vec) {
    const mShift = this.createVectorMatrix(vec)
    this.m.add(mShift)
    return this
  }
  /**
   * Rotates a figure using a bit of linear algebra (matrix multiplication)
   * @param {Number} degree
   * @returns {Figure}
   */
  rotate (degree) {
    const rotations = {
      // @see https://en.wikipedia.org/wiki/Rotation_matrix#Common_rotations
      90: [
        [0, -1],
        [1, 0]
      ],
      180: [
        [-1, 0],
        [0, -1]
      ],
      270: [
        [0, 1],
        [-1, 0]
      ]
    }
    const aR = rotations[degree]

    if (!aR) {
      throw new Error('Unsupported rotation')
    }

    const mR = new Matrix(aR)

    // The absolute coordinates of the center of a figure
    const vCenter = this.getCenter()
    const mCenter = this.createVectorMatrix(vCenter)

    // Converting figure's position to the relative coordinate system
    this.m.subtract(mCenter)

    // Rotating of a figure
    const mRotated = this.m.multiply(mR)

    // Converting figure's position to the absolute coordinate system
    this.m = mRotated.add(mCenter)

    return this
  }
  /**
   * Moves every point of a figure by the same amount in a given direction
   * @see https://en.wikipedia.org/wiki/Translation_(geometry)
   * @param {Array.<Number>} vec A new central point in absolute coordinates
   * @returns {Figure}
   */
  translate (vec) {
    // The absolute coordinates of the center of a figure
    const vCenter = this.getCenter()
    const mCenter = this.createVectorMatrix(vCenter)

    // Converting figure's position to the relative coordinate system
    this.m.subtract(mCenter)

    // New absolute coordinates of the center of a figure
    const mNewCenter = this.createVectorMatrix(vec)

    // Convert figure's position to the absolute coordinate system
    this.m.add(mNewCenter)

    return this
  }
  /**
   * Returns two-dimensional array
   * @return {Array.<Array>.<Number>}
   */
  toArray () {
    return this.m.toArray()
  }
}

class TetrisFigure extends Figure {
  /**
   * Calculates an id as a sequence of coordinates
   * @return {String}
   */
  get id () {
    return '[' + String(this.m.data) + ']'
  }
  /**
   * @see http://codenjoy.com/portal/?p=170
   * @param {String} type
   */
  static factory (type) {
    switch (type) {
      case this.KIND.I:
        return new this([
          // x, y
          [0, 0],
          [0, 1],
          [0, 2],
          [0, 3]
        ], 1)
      case this.KIND.O:
        return new this([
          // x, y
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1]
        ], 0)
      case this.KIND.L:
        return new this([
          // x, y
          [0, 0],
          [0, 1],
          [0, 2],
          [1, 2]
        ], 1)
      case this.KIND.J:
        return new this([
          // x, y
          [1, 0],
          [1, 1],
          [1, 2],
          [0, 2]
        ], 1)
      case this.KIND.S:
        return new this([
          // x, y
          [0, 1],
          [1, 1],
          [1, 0],
          [2, 0]
        ], 1)
      case this.KIND.Z:
        return new this([
          // x, y
          [0, 0],
          [1, 0],
          [1, 1],
          [2, 1]
        ], 2)
      case this.KIND.T:
        return new this([
          // x, y
          [0, 1],
          [1, 0],
          [1, 1],
          [2, 1]
        ], 2)
      default:
        throw new Error('Unknown figure type')
    }
  }
}

TetrisFigure.KIND = {
  'I': 'I',
  'O': 'O',
  'L': 'L',
  'J': 'J',
  'S': 'S',
  'Z': 'Z',
  'T': 'T'
}

class TetrisWorld {
  /**
   * @param {Array.<Array>.<Number>|Matrix} m A world as a matrix
   */
  constructor (m) {
    this.m = new Matrix(m)
  }
  /**
   * @returns {Number}
   */
  get width () {
    return this.m.shape[1]
  }
  /**
   * @returns {Number}
   */
  get height () {
    return this.m.shape[0]
  }
  /**
   * @returns {TetrisWorld}
   */
  clone () {
    return new TetrisWorld(this.m)
  }
  /**
   * @param {Number} x
   * @param {Number} y
   * @returns {*}
   */
  get (x, y) {
    return this.m.get(y, x)
  }
  /**
   * TODO: we should use single method for drawing
   * Liberates the space that a figure was located
   * @param {TetrisFigure} figure
   */
  dislocate (figure) {
    figure.each((_, y, x) => {
      const p = [x, y]
      if (this.inRangePoint(p)) {
        this.m.set(y, x, this.constructor.THING.EMPTY_SPACE)
      }
    })
  }
  /**
   * TODO: we should use single method for drawing
   * @param {TetrisFigure} figure
   */
  locate (figure) {
    figure.each((_, y, x) => {
      const p = [x, y]
      if (this.inRangePoint(p)) {
        this.m.set(y, x, this.constructor.THING.FIGURE)
      }
    })
  }
  /**
   * Checks if a figure overlaps others or not
   * @param {TetrisFigure} figure
   * @return {Boolean}
   */
  mayLocate (figure) {
    const c = figure.m.shape[1]
    const things = new Array(c)
    figure.each((i, y, x) => {
      const p = [x, y]
      if (this.inRangePoint(p)) {
        things[i] = this.m.get(y, x)
      }
    })
    const {THING} = this.constructor
    return things.every(v => THING.EMPTY_SPACE === v)
  }
  /**
   * Checks if a figure inside of the world or not
   * @param {TetrisFigure} figure
   * @return {Boolean}
   */
  inRange (figure) {
    const [p1, p2] = figure.getBounds()
    return this.inRangePoint(p1) && this.inRangePoint(p2)
  }
  /**
   * Checks if a point inside of the world or not
   * @param {Array.<Number>} vec
   * @return {Boolean}
   */
  inRangePoint (vec) {
    const minX = 0
    const minY = 0
    const maxX = this.width - 1
    const maxY = this.height - 1
    const [x, y] = vec
    return x >= minX && x <= maxX && y >= minY && y <= maxY
  }
  /**
   * @param {Number} [xStart]
   * @param {Number} [yStart]
   */
  sample (xStart = -1, yStart = -1) {
    const m = Matrix.random(this.height, this.width)

    m.each((v, y, x) => {
      const nV = Math.round(v) > 0
        ? this.constructor.THING.WALL
        : this.constructor.THING.EMPTY_SPACE
      m.set(y, x, nV)
    })

    m.each((v, y, x) => {
      const nV = y > yStart && x > xStart
        ? v
        : this.constructor.THING.EMPTY_SPACE
      m.set(y, x, nV)
    })

    this.m = m
  }
  /**
   * @param {String} [comment]
   * @return {HTMLElement}
   */
  renderToHtmlElement (comment = '') {
    const {THING} = this.constructor
    const rows = this.toArray()
    const vm = new Vue({
      el: document.createElement('div'),
      data () {
        return {
          rows,
          comment
        }
      },
      methods: {
        getClassName (v) {
          const classes = {
            [THING.FIGURE]: 'bg-primary',
            [THING.WALL]: 'bg-secondary'
          }
          return classes[v]
        }
      },
      template: `
        <div>
          <hr/>
          <p v-text="comment"></p>
          <table class="table table-bordered table-hover"
                 style="width: 380px;">
            <tbody>          
              <tr v-for="(row, idx) in rows">
                <td v-text="idx"
                    class="text-right text-muted"></td>
                <td v-for="cell in row"
                    v-bind:class="getClassName(cell)"
                    style="width: 34px; height: 34px;">
                    &nbsp;
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
              <td>&nbsp;</td>
               <td v-for="(cell, idx) in rows[0]"
                   v-text="idx"
                   class="text-right text-muted"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      `
    })
    return vm.$el
  }
  /**
   * Returns two-dimensional array
   * @return {Array.<Array>.<Number>}
   */
  toArray () {
    return this.m.toArray()
  }
}

TetrisWorld.THING = {
  'EMPTY_SPACE': 0,
  'WALL': 1,
  'FIGURE': 2
}

class TetrisProblemSolver {
  /**
   * @param {TetrisWorld} world
   * @param {TetrisFigure} figure
   * @returns {Array.<TetrisFigure>}
   */
  static solve (world, figure) {
    const {THING} = world.constructor

    // We want to find the lowest appropriate cell
    for (let y = world.height - 1; y >= 0; y--) {
      // We need the coordinates of cells in this row
      const row = Array.from({length: world.width}, (_, x) => [x, y])

      // console.log('y', y)

      // We are interesting with empty cells only
      const cells = row.filter(p => world.get(p[0], p[1]) === THING.EMPTY_SPACE)

      // console.log('empty cells', cells)

      // We have all permutations (states) here without duplicates
      const untrustedStates = this.getPermutationsOfFigureAtPoints(figure, cells)

      // console.log('untrustedStates', untrustedStates.map(fg => fg.toArray()))

      // But we have to validate these states. Can they be located in the world?
      const states = this.getLocatableStatesOnly(world, untrustedStates)

      if (states.length === 0) {
        continue
      }

      // We have to order the states using domain knowledge
      states.sort((a, b) => {
        const estA = this.estimateLocationOfFigure(world, figure, a)
        const estB = this.estimateLocationOfFigure(world, figure, b)
        return estB - estA
      })

      // TODO: We should randomly select states with the same estimation
      for (const state of states) {
        // console.log('state', state.toArray())

        const path = this.findPathFromCurrentStateToGoalState(world, state, figure)

        if (path.length > 0) {
          return path // a sequence of movements and rotations
        }
      }
    }

    return []
  }
  /**
   * Gets all possible permutations of a figure at certain point
   * @param {TetrisFigure} figure
   * @param {Array.<Number>} vec
   * @return {Array.<TetrisFigure>}
   */
  static getPermutationsOfFigureAtPoint (figure, vec) {
    const a = figure.clone()
    a.translate(vec)
    const b = a.clone()
    const c = a.clone()
    const d = a.clone()
    b.rotate(90)
    c.rotate(180)
    d.rotate(270)
    return [a, b, c, d]
  }
  /**
   * Gets all possible permutations of a figure at certain point
   * @param {TetrisFigure} figure
   * @param {Array.<Number>} points
   * @return {Array.<TetrisFigure>}
   */
  static getPermutationsOfFigureAtPoints (figure, points) {
    const step = 4
    const len = points.length
    const arr = new Array(len * step)
    for (let i = 0, k = 0; i < len; i++, k += step) {
      const p = points[i]
      const [a, b, c, d] = this.getPermutationsOfFigureAtPoint(figure, p)
      arr[k] = a
      arr[k + 1] = b
      arr[k + 2] = c
      arr[k + 3] = d
    }
    // Perhaps we have duplications here, so we need to exclude them
    return this.unique(arr, x => x.id)
  }
  /**
   * @param {TetrisWorld} world
   * @param {Array.<TetrisFigure>} states
   * @return {Array.<TetrisFigure>}
   */
  static getLocatableStatesOnly (world, states) {
    return states.filter(figure => {
      return world.inRange(figure) && world.mayLocate(figure)
    })
  }
  /**
   * Returns an estimation of a figure. A maximal estimation is the best one
   * @param {TetrisWorld} world
   * @param {TetrisFigure} goal Initial figure position
   * @param {TetrisFigure} test Estimated figure position
   * @returns {Number}
   */
  static estimateLocationOfFigure (world, goal, test) {
    const points = test.toArray()
    const step = 4
    const len = points.length
    const variants = new Array(len * step)
    for (let i = 0, k = 0; i < len; i++, k += step) {
      const [x, y] = points[i]
      variants[k] = [x + 1, y]
      variants[k + 1] = [x - 1, y]
      variants[k + 2] = [x, y + 1]
      variants[k + 3] = [x, y - 1]
    }
    const uniq = this.unique(variants, String)
    const allThings = uniq.filter(p => world.inRangePoint(p))
    const {THING} = world.constructor
    world.locate(test)
    const notEmptyThingsCount = allThings.reduce((sum, p) => {
      return sum + (world.get(p[0], p[1]) !== THING.EMPTY_SPACE)
    }, 0)
    const ySum = points.reduce((sum, p) => {
      return sum + p[1]
    }, 0)
    world.dislocate(test)
    return (notEmptyThingsCount / allThings.length) + (ySum / len)
  }
  /**
   * @see https://github.com/nervgh/nervgh.github.io/blob/master/sandbox/state-space/heuristic/src/Vector2.js
   * @param {Array.<Number>} p1
   * @param {Array.<Number>} p2
   * @returns {Number}
   */
  static distanceManhattanBetweenPoints (p1, p2) {
    return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1])
  }
  /**
   * @see https://github.com/nervgh/nervgh.github.io/blob/master/sandbox/state-space/heuristic/src/Vector2.js
   * @param {TetrisFigure} f1
   * @param {TetrisFigure} f2
   * @returns {Number}
   */
  static distanceManhattanBetweenFigures (f1, f2) {
    const ps1 = f1.toArray() // points
    const ps2 = f2.toArray() // points
    const n = ps1.length
    let k = 0
    for (let i = 0; i < n; i++) {
      k += this.distanceManhattanBetweenPoints(ps1[i], ps2[i])
    }
    return k / n
  }
  /**
   * @param {TetrisWorld} world
   * @param {TetrisFigure} currentState
   * @param {TetrisFigure} goalState
   * @returns {Array.<TetrisFigure>}
   */
  static findPathFromCurrentStateToGoalState (world, currentState, goalState) {
    const root = new GraphNode(currentState)

    const astarSearchOptions = {
      id (node) {
        return node.state.id
      },
      h (node) {
        return TetrisProblemSolver.distanceManhattanBetweenFigures(node.state, goalState)
      },
      isGoal (node) {
        return node.state.id === goalState.id
      },
      getSuccessorsOf (node) {
        const figure = node.state
        const untrustedStates = [
          figure.clone().move([0, -1]), // up
          figure.clone().move([-1, 0]), // left
          figure.clone().move([1, 0]), // right
          // figure.clone().move([0, 1]), // down TODO: Are we be able to make a step down?
          // all rotations
          // TODO: we should check an ability to rotate a figure
          ...TetrisProblemSolver.getPermutationsOfFigureAtPoint(figure, figure.getCenter())
        ]
        const states = TetrisProblemSolver.getLocatableStatesOnly(world, untrustedStates)
        const nodes = states.map(state => {
          return new GraphNode(state, node, node.pathCost + 1)
        })
        return nodes
      }
    }

    // Algorithm returns the goal node or null
    // when there is not a path from current node to goal node
    const goal = astarGraphSearch(root, astarSearchOptions)
    if (!goal) {
      return []
    }

    // Backtrace the path
    let path = []
    for (let node = goal; node !== null; node = node.parent) {
      path.push(node.state)
    }

    return path
  }
  /**
   * @param {Array.<*>} items
   * @param {Function} id
   * @returns {Array.<*>}
   */
  static unique (items, id) {
    const map = new Map()
    for (const x of items) {
      map.set(id(x), x)
    }
    return [...map.values()]
  }
}

// -----------------------------------

const world = new TetrisWorld(Matrix.zeros(20, 10))

// Sampling of walls
world.sample(-1, 11)

// Getting random kind of figure
const kinds = Object.keys(TetrisFigure.KIND)
const randomKind = getRandomIntInclusive(0, kinds.length - 1)

// Setting random X coordinate of that figure
const figure = TetrisFigure.factory(kinds[randomKind])
const [bPointA, bPointB] = figure.getBounds()
const minX = bPointA[0]
const maxX = (world.width - 1) - bPointB[0]
const randomX = getRandomIntInclusive(minX, maxX)
figure.move([randomX, 0])
// figure.rotate(90)
// figure.translate([3, 4])

const rootHtmlElement = document.getElementById('root')

console.time('planning time')
const sequence = TetrisProblemSolver.solve(world, figure)
console.timeEnd('planning time')

// Visualize the sequence
console.log('sequence', sequence)

// for (let i = 0; i < sequence.length; i++) {
//   const state = sequence[i]
//   const comment = String(i + 1)
//   world.locate(state)
//   rootHtmlElement.appendChild(world.renderToHtmlElement(comment))
//   world.dislocate(state)
// }

function renderNextState (seq, i) {
  if (i >= seq.length) {
    return
  }
  const prevState = seq[i - 1]
  if (prevState) {
    world.dislocate(prevState)
  }
  const state = seq[i]
  const comment = String(i + 1)
  world.locate(state)
  rootHtmlElement.replaceChild(
    world.renderToHtmlElement(`#${comment} state`),
    rootHtmlElement.firstChild
  )

  setTimeout(_ => renderNextState(seq, i + 1), 500)
}

renderNextState(sequence, 0)
