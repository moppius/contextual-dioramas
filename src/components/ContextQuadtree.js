import * as THREE from 'three'

const MIN_QUAD_SIZE = 1

export default class Quad {
  constructor(bounds) {
    this.bounds = bounds

    this.labels = {}

    this.topLeft = null
    this.topRight = null
    this.bottomLeft = null
    this.bottomRight = null
  }

  addLabels(labels, position) {
    if (this.bounds.containsPoint(position) === false) {
      console.warn(`Bounds did not contain position [${position.x}, ${position.y}]!`)
      return
    }

    for (const label of labels) {
      if (label in this.labels) {
        this.labels[label] += 1
      } else {
        this.labels[label] = 1
      }
    }

    const boundsSize = new THREE.Vector2(1, 1)
    this.bounds.getSize(boundsSize)
    if (boundsSize.x <= MIN_QUAD_SIZE && boundsSize.y <= MIN_QUAD_SIZE) {
      return
    }

    const halfX = (this.bounds.min.x + this.bounds.max.x) / 2,
      halfY = (this.bounds.min.y + this.bounds.max.y) / 2

    if (halfX >= position.x) {
      // Top left
      if (halfY >= position.y) {
        if (this.topLeft === null) {
          this.topLeft = new Quad(
            new THREE.Box2(
              this.bounds.min,
              this.bounds.min.clone().add(this.bounds.max).multiplyScalar(0.5)
            )
          )
        }
        this.topLeft.addLabels(labels, position)
      }
      // Bottom left
      else {
        if (this.bottomLeft === null) {
          this.bottomLeft = new Quad(
            new THREE.Box2(
              new THREE.Vector2(this.bounds.min.x, (this.bounds.min.y + this.bounds.max.y) / 2),
              new THREE.Vector2((this.bounds.min.x + this.bounds.max.x) / 2, this.bounds.max.y)
            )
          )
        }
        this.bottomLeft.addLabels(labels, position)
      }
    } else {
      // Top right
      if (halfY >= position.y) {
        if (this.topRight === null) {
          this.topRight = new Quad(
            new THREE.Box2(
              new THREE.Vector2((this.bounds.min.x + this.bounds.max.x) / 2, this.bounds.min.y),
              new THREE.Vector2(this.bounds.max.x, (this.bounds.min.y + this.bounds.max.y) / 2)
            )
          )
        }
        this.topRight.addLabels(labels, position)
      }
      // Bottom right
      else {
        if (this.bottomRight === null) {
          this.bottomRight = new Quad(
            new THREE.Box2(
              this.bounds.min.clone().add(this.bounds.max).multiplyScalar(0.5),
              this.bounds.max
            )
          )
        }
        this.bottomRight.addLabels(labels, position)
      }
    }
  }

  findQuadWithMinLabelDensity(label, minDensity) {
    let density = this.getLabelDensity(label)
    if (density <= 0) {
      return null
    }
    if (density >= minDensity) {
      return this
    }

    if (label in this.labels) {
      let bestQuad = null,
        bestDensity = 0,
        quadDensity = 0
      const quads = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
      quads.forEach((quad) => {
        if (quad !== null) {
          quadDensity = quad.getLabelDensity(label)
          if (quadDensity > bestDensity) {
            bestQuad = quad
            bestDensity = quadDensity
          }
        }
      })
      return bestQuad.findQuadWithMinLabelDensity(label, minDensity)
    }
    return null
  }

  findQuadWithMaxLabelDensity(label, maxDensity) {
    let density = this.getLabelDensity(label)
    if (density <= maxDensity) {
      console.log(`Found quad with density ${density} for ${label}`)
      return this
    }
    console.log(`This one had ${density} for ${label}, looking in children`)

    if (label in this.labels) {
      let bestQuad = null,
        bestDensity = maxDensity,
        quadDensity = 0
      const quads = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
      quads.forEach((quad) => {
        if (quad !== null) {
          quadDensity = quad.getLabelDensity(label)
          if (quadDensity < bestDensity) {
            bestQuad = quad
            bestDensity = quadDensity
          }
        }
      })
      return bestQuad.findQuadWithMaxLabelDensity(label, maxDensity)
    }
    return null
  }

  getLabelDensity(label) {
    if (label in this.labels === true) {
      const boundsSize = new THREE.Vector2(1, 1)
      this.bounds.getSize(boundsSize)
      return this.labels[label] / (boundsSize.x * boundsSize.y)
    }
    return 0
  }

  hasLabels(labels) {
    for (const label of labels) {
      if (label in this.labels === false) {
        return false
      }
    }
    return true
  }

  positionHasLabels(position, labels) {
    let point = position
    if (position.constructor.name === 'Vector3') {
      point = new THREE.Vector2(position.x, position.z)
    }

    if (this.bounds.containsPoint(point) === false || this.hasLabels(labels) === false) {
      return false
    }

    const quads = [this.topLeft, this.topRight, this.bottomRight, this.bottomLeft]
    for (const quad of quads) {
      if (quad !== null && quad.bounds.containsPoint(point)) {
        return quad.positionHasLabels(point, labels)
      }
    }

    return true
  }
}
