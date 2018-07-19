
// https://github.com/mateogianolio/vectorious
const {
  Matrix
} = window

class Figure {
  /**
   * @param {Array.<Array>.<Number>} m Coordinate pairs (x, y) of a figure as a matrix
   * @param {Number} c Center of a figure relative itself (index of a column)
   */
  constructor (m, c) {
    this.m = new Matrix(m)
    this.c = c
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

const world = Matrix.zeros(20, 10)

const figure = new Figure([
  /* x */ [2, 3, 4, 5],
  /* y */ [2, 2, 2, 2]
], 1)

figure.each(function (v, x, y) {
  world.set(x, y, 1)
})

console.log('world, before', world.toArray())

// figure.move(1, 0)
figure.rotate(90)

world.each(function (v, x, y) {
  world.set(x, y, 0)
})

figure.each(function (v, x, y) {
  world.set(x, y, 1)
})

console.log('world, after', world.toArray())
