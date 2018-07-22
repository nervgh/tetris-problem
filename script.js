
const {
  Matrix, // https://github.com/mateogianolio/vectorious
  Vue
} = window

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
   */
  each (cb) {
    const r = this.m.shape[0]
    for (let i = 0, j = 1, k = 0; k < r; i += 2, j += 2, k++) {
      const x = this.m.data[i]
      const y = this.m.data[j]
      cb.call(this, k, y, x)
    }
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
   */
  move (vec) {
    const mShift = this.createVectorMatrix(vec)
    this.m.add(mShift)
  }
  /**
   * Rotates a figure using a bit of linear algebra (matrix multiplication)
   * @param {Number} degree
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
  }
  /**
   * Moves every point of a figure by the same amount in a given direction
   * @see https://en.wikipedia.org/wiki/Translation_(geometry)
   * @param {Array.<Number>} vec A new central point in absolute coordinates
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

      console.log('y', y)

      // We are interesting with empty cells only
      const cells = row.filter(p => world.get(p[0], p[1]) === THING.EMPTY_SPACE)

      console.log('empty cells', cells)

      // We have all permutations here (states) without duplicates
      const untrustedStates = this.getPermutationsOfFigureAtPoints(figure, cells)

      console.log('untrustedStates', untrustedStates.map(fg => fg.toArray()))

      // But we have to validate these states. Can they be located in the world?
      const states = this.__getLocatableStatesOnly(world, untrustedStates)

      console.log('states', states.map(fg => fg.toArray()))

      if (states.length > 0) {
        world.locate(states[0])
        break
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
    const unique = new Map()
    for (const fg of arr) {
      unique.set(fg.id, fg)
    }
    return [...unique.values()]
  }
  /**
   * @param {TetrisWorld} world
   * @param {Array.<TetrisFigure>} states
   * @return {Array.<TetrisFigure>}
   * @private
   */
  static __getLocatableStatesOnly (world, states) {
    return states.filter(figure => {
      return world.inRange(figure) && world.mayLocate(figure)
    })
  }
}

// -----------------------------------

const world = new TetrisWorld(Matrix.zeros(20, 10))

world.sample(-1, 11)

const figure = TetrisFigure.factory(TetrisFigure.KIND.I)

// figure.move([1, 0])
// figure.rotate(90)
// figure.translate([3, 4])

const rootHtmlElement = document.getElementById('root')

world.locate(figure)
rootHtmlElement.appendChild(world.renderToHtmlElement('1'))

world.dislocate(figure)

const sequence = TetrisProblemSolver.solve(world, figure)

rootHtmlElement.appendChild(world.renderToHtmlElement('2'))
