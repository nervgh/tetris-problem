
// https://github.com/mateogianolio/vectorious
const {
  Matrix,
  Vue
} = window

class Figure {
  /**
   * @param {Array.<Array>.<Number>|Matrix} m Coordinate pairs (x, y) of a figure as a matrix
   * @param {Number} c Center of a figure relative itself (index of a column)
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
    const c = this.m.shape[1]
    const [x, y] = vec
    const aVec = [
      Array.from({length: c}, _ => x),
      Array.from({length: c}, _ => y)
    ]
    return new Matrix(aVec)
  }
  /**
   * Calls a callback for each coordinate pair (x, y)
   * @see https://mateogianolio.com/vectorious/matrix.js.html#line872
   * @param {Function} cb
   */
  each (cb) {
    const c = this.m.shape[1]
    for (let i = 0, j = c; i < c; i += 1, j += 1) {
      const x = this.m.data[i]
      const y = this.m.data[j]
      cb.call(this, i, x, y)
    }
  }
  /**
   * Gets bounds of a figure as a matrix-like array
   * @return {Array.<Array>.<Number>}
   */
  getBounds () {
    const c = this.m.shape[1]
    const xs = new Array(c)
    const ys = new Array(c)
    this.each((i, x, y) => {
      xs[i] = x
      ys[i] = y
    })
    const xMin = Math.min(...xs)
    const yMin = Math.min(...ys)
    const xMax = Math.max(...xs)
    const yMax = Math.max(...ys)
    return [
      [xMin, xMax],
      [yMin, yMax]
    ]
  }
  /**
   * Gets center as a vector
   * @returns {Array.<Number>}
   */
  getCenter () {
    const x = this.m.get(0, this.c)
    const y = this.m.get(1, this.c)
    return [x, y]
  }
  /**
   * Shifts a figure relative its current position using a bit of linear algebra
   * @param {Array.<Number>} vec
   */
  move (vec) {
    const [x, y] = vec
    const mShift = this.createVectorMatrix([y, x])
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
    const mRotated = mR.multiply(this.m)

    // Converting figure's position to the absolute coordinate system
    this.m = mRotated.add(mCenter)
  }
  /**
   * Moves every point of a figure by the same amount in a given direction
   * @see https://en.wikipedia.org/wiki/Translation_(geometry)
   * @param {Array.<Number>} vec
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
   * @return {Array.<Array>.<Number>}
   */
  toArray () {
    return this.m.toArray()
  }
}

class TetrisFigure extends Figure {
  /**
   * @see http://codenjoy.com/portal/?page_id=10
   * @param {String} type
   */
  static factory (type) {
    switch (type) {
      case this.KIND.I:
        return new this([
          /* x */ [0, 1, 2, 3],
          /* y */ [0, 0, 0, 0]
        ], 1)
      case this.KIND.O:
        return new this([
          /* x */ [0, 0, 1, 1],
          /* y */ [0, 1, 0, 1]
        ], 0)
      case this.KIND.L:
        return new this([
          /* x */ [0, 1, 2, 2],
          /* y */ [0, 0, 0, 1]
        ], 1)
      case this.KIND.J:
        return new this([
          /* x */ [0, 1, 2, 2],
          /* y */ [1, 1, 1, 0]
        ], 1)
      case this.KIND.S:
        return new this([
          /* x */ [1, 1, 0, 0],
          /* y */ [0, 1, 1, 2]
        ], 1)
      case this.KIND.Z:
        return new this([
          /* x */ [0, 0, 1, 1],
          /* y */ [0, 1, 1, 2]
        ], 2)
      case this.KIND.T:
        return new this([
          /* x */ [1, 0, 1, 1],
          /* y */ [0, 1, 1, 2]
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
   * @returns {TetrisWorld}
   */
  clone () {
    return new TetrisWorld(this.m)
  }
  /**
   * TODO: we should use single method for drawing
   * Liberates the space that a figure was located
   * @param {TetrisFigure} figure
   */
  dislocate (figure) {
    figure.each((_, x, y) => {
      const p = [x, y]
      if (this.inRangePoint(p)) {
        this.m.set(x, y, this.constructor.THING.EMPTY_SPACE)
      }
    })
  }
  /**
   * TODO: we should use single method for drawing
   * @param {TetrisFigure} figure
   */
  locate (figure) {
    figure.each((_, x, y) => {
      const p = [x, y]
      if (this.inRangePoint(p)) {
        this.m.set(x, y, this.constructor.THING.FIGURE)
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
    figure.each((i, x, y) => {
      things[i] = this.m.get(x, y)
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
    const bounds = figure.getBounds()
    const p1 = [bounds[0][0], bounds[0][1]]
    const p2 = [bounds[1][0], bounds[1][1]]
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
    const maxX = this.m.shape[0] - 1
    const maxY = this.m.shape[1] - 1
    const [x, y] = vec
    return x >= minX && x <= maxX && y >= minY && y <= maxY
  }
  /**
   * @param {Number} [rStart]
   * @param {Number} [cStart]
   */
  sample (rStart = -1, cStart = -1) {
    const [r, c] = this.m.shape
    const m = Matrix.random(r, c)

    m.each((v, x, y) => {
      const nV = Math.round(v) > 0
        ? this.constructor.THING.WALL
        : this.constructor.THING.EMPTY_SPACE
      m.set(x, y, nV)
    })

    m.each((v, x, y) => {
      const nV = x > rStart && y > cStart
        ? v
        : this.constructor.THING.EMPTY_SPACE
      m.set(x, y, nV)
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
          <table class="table table-bordered table-hover">
            <tbody>          
              <tr v-for="row in rows">
                <td v-for="cell in row"
                    v-bind:class="getClassName(cell)">
                    &nbsp;
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      `
    })
    return vm.$el
  }
  /**
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

// -----------------------------------

const world = new TetrisWorld(Matrix.zeros(20, 10))

world.sample(11)

const figure = TetrisFigure.factory(TetrisFigure.KIND.T)

// figure.move([1, 0])
// figure.rotate(90)
// figure.translate([3, 4])

world.locate(figure)

const rootHtmlElement = document.getElementById('root')
rootHtmlElement.appendChild(world.renderToHtmlElement('1'))

// world.dislocate(figure)
// rootHtmlElement.appendChild(world.renderToHtmlElement('2'))
