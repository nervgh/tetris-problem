
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

const world = sampleWorld(20, 10) // Matrix.zeros(20, 10)

// const figure = TetrisFigure.factory(TetrisFigure.KIND.T)
//
// figure.each(function (_, x, y) {
//   world.set(x, y, 1)
// })

const rootHtmlElement = document.getElementById('root')
rootHtmlElement.appendChild(renderToHtmlElement(world, '1'))

// figure.move(1, 0)
// figure.rotate(90)
//
// world.each(function (_, x, y) {
//   world.set(x, y, 0)
// })
// figure.each(function (_, x, y) {
//   world.set(x, y, 1)
// })

/**
 * @param {Number} r amount of rows
 * @param {Number} c amount of columns
 * @return {Matrix}
 */
function sampleWorld (r, c) {
  const world = Matrix.random(r, c) // Matrix.zeros(r, c)

  world.each(function (v, x, y) {
    world.set(x, y, Math.round(v))
  })

  world.each(function (v, x, y) {
    const nV = x > 11 ? v : 0
    world.set(x, y, nV)
  })

  return world
}
/**
 * @param {Matrix} world
 * @param {String} [comment]
 * @return {HTMLElement}
 */
function renderToHtmlElement (world, comment = '') {
  const vm = new Vue({
    el: document.createElement('div'),
    data () {
      return {
        world: world.toArray(),
        comment
      }
    },
    template: `
      <div>
        <hr/>
        <p v-text="comment"></p>
        <table class="table table-bordered table-hover">
          <tbody>          
            <tr v-for="row in world">
              <td v-for="cell in row"
                  v-bind:class="{'bg-primary': cell}">
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
