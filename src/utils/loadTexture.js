import { SRGBColorSpace, TextureLoader } from 'three'

export default function loadTexture(url, { renderer, ...options }) {
  if (!renderer) {
    throw new Error(`Texture requires renderer to passed in the options for ${url}!`)
  }

  return new Promise((resolve, reject) => {
    new TextureLoader().load(
      url,
      (texture) => {
        // apply eventual gamma encoding
        if (renderer.outputColorSpace === SRGBColorSpace && options.gamma) {
          texture.colorSpace = SRGBColorSpace
        }

        // apply eventual texture options, such as wrap, repeat...
        const textureOptions = Object.keys(options).filter((option) => !['linear'].includes(option))
        textureOptions.forEach((option) => {
          texture[option] = options[option]
        })

        // Force texture to be uploaded to GPU immediately,
        // this will avoid "jank" on first rendered frame
        renderer.initTexture(texture)

        resolve(texture)
      },
      null,
      (err) => reject(new Error(`Could not load texture ${url}:\n${err}`))
    )
  })
}
