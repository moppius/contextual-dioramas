import * as THREE from 'three'

export default function generateSideMeshes(
  group,
  planeGeometry,
  material,
  xSegments,
  zSegments,
  lowestPoint
) {
  const topVertices = planeGeometry.getAttribute('position').array
  planeGeometry.computeBoundingBox()
  let bounds = new THREE.Vector3(0, 0, 0)
  planeGeometry.boundingBox.getSize(bounds)
  let newHeight = 0

  // +X, +Z, -X, -Z
  for (let side = 0; side < 4; side++) {
    const xSide = side % 2 == 1
    const sideGeometry = new THREE.PlaneGeometry(
      xSide ? bounds.x : bounds.z,
      xSide ? bounds.z : bounds.x,
      xSide ? xSegments : zSegments,
      1
    )
    if (xSide) {
      sideGeometry.translate(0, 0, bounds.z / 2)
    } else {
      sideGeometry.rotateY(-Math.PI / 2)
      sideGeometry.translate(-bounds.x / 2, 0, 0)
    }

    const vertices = sideGeometry.getAttribute('position').array,
      stride = xSide ? xSegments : zSegments
    for (let i = 0, l = vertices.length / 3 / 2; i < l; i++) {
      // Top row, match plane geometry
      if (xSide) {
        if (side < 2) {
          newHeight = topVertices[(i + (xSegments + 1) * zSegments) * 3 + 1]
        } else {
          newHeight = topVertices[i * 3 + 1]
        }
      } else {
        if (side < 2) {
          newHeight = topVertices[i * (xSegments + 1) * 3 + 1]
        } else {
          newHeight = topVertices[(i * (xSegments + 1) + xSegments) * 3 + 1]
        }
      }
      vertices[i * 3 + 1] = newHeight

      // Bottom row, lowestPoint
      vertices[(i + stride + 1) * 3 + 1] = lowestPoint
    }

    const mesh = new THREE.Mesh(sideGeometry, material)
    if (side > 1) {
      if (xSide) {
        mesh.scale.z = -1
      } else {
        mesh.scale.x = -1
      }
    }

    mesh.castShadow = true
    mesh.receiveShadow = true

    group.add(mesh)
  }
}
