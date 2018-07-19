
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
   * Calls a callback for each coordinate pair (x, y)
   * @see https://mateogianolio.com/vectorious/matrix.js.html#line872
   * @param {Function} cb
   */
  each (cb) {
    const c = this.m.shape[1]
    for (let i = 0, j = c; i < c; i += 1, j += 1) {
      const x = this.m.data[i]
      const y = this.m.data[j]
      cb.call(this, [x, y], x, y)
    }
  }
  /**
   * Moves a figure using a bit linear algebra
   * @param {Number} x
   * @param {Number} y
   */
  move (x, y) {
    const colCount = this.m.shape[1]
    const aShift = [
      Array.from({length: colCount}, _ => y),
      Array.from({length: colCount}, _ => x)
    ]
    const mShift = new Matrix(aShift)
    this.m.add(mShift)
  }
  /**
   * Rotates a figure using a bit linear algebra (matrix multiplication)
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
    const xVal = this.m.get(0, this.c)
    const yVal = this.m.get(1, this.c)
    const colCount = this.m.shape[1]
    const aCenter = [
      Array.from({length: colCount}, _ => xVal),
      Array.from({length: colCount}, _ => yVal)
    ]
    const mCenter = new Matrix(aCenter)

    // Before rotation we should convert figure's position
    // to the relative coordinate system
    const mCentered = this.m.subtract(mCenter)

    // Rotating of a figure
    const mRotated = mR.multiply(mCentered)

    // After rotation we should convert figure's position
    // to the absolute coordinate system
    this.m = mRotated.add(mCenter)
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
   * @param {Number} r amount of rows
   * @param {Number} c amount of columns
   */
  constructor (r, c) {
    this.m = Matrix.zeros(r, c)
  }
  /**
   * @param {Figure} figure
   */
  locate (figure) {
    figure.each((_, x, y) => {
      this.m.set(x, y, 2)
    })
  }
  /**
   * @param {Number} [rStart]
   * @param {Number} [cStart]
   */
  sample (rStart = -1, cStart = -1) {
    const [r, c] = this.m.shape
    const m = Matrix.random(r, c)

    m.each((v, x, y) => {
      m.set(x, y, Math.round(v))
    })

    m.each((v, x, y) => {
      const nV = x > rStart && y > cStart ? v : 0
      m.set(x, y, nV)
    })

    this.m = m
  }
  /**
   * @param {String} [comment]
   * @return {HTMLElement}
   */
  renderToHtmlElement (comment = '') {
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
            2: 'bg-primary',
            1: 'bg-secondary'
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

const world = new TetrisWorld(20, 10)

world.sample(11)

const figure = TetrisFigure.factory(TetrisFigure.KIND.T)

// figure.move(1, 0)
// figure.rotate(90)

world.locate(figure)

const rootHtmlElement = document.getElementById('root')
rootHtmlElement.appendChild(world.renderToHtmlElement('1'))
