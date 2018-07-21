
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
    this.each((i, x, y) => {
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
      things[i] = this.m.get(y, x)
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
    const maxX = this.m.shape[1] - 1
    const maxY = this.m.shape[0] - 1
    const [x, y] = vec
    return x >= minX && x <= maxX && y >= minY && y <= maxY
  }
  /**
   * @param {Number} [xStart]
   * @param {Number} [yStart]
   */
  sample (xStart = -1, yStart = -1) {
    const [r, c] = this.m.shape
    const m = Matrix.random(r, c)

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
                 style="width: 360px;">
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

// -----------------------------------

const world = new TetrisWorld(Matrix.zeros(20, 10))

world.sample(-1, 11)

const figure = TetrisFigure.factory(TetrisFigure.KIND.T)

// figure.move([1, 0])
// figure.rotate(90)
// figure.translate([3, 4])

world.locate(figure)

const rootHtmlElement = document.getElementById('root')
rootHtmlElement.appendChild(world.renderToHtmlElement('1'))

// world.dislocate(figure)
// rootHtmlElement.appendChild(world.renderToHtmlElement('2'))
