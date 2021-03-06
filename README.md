# Contextual Dioramas

A [Three.js](https://threejs.org/) project that generates 3D dioramas procedurally using contextual information. You can visit the [latest interactive release on the Github Pages site here](https://moppius.github.io/contextual-dioramas/).

It is built on [@marcofugaro](https://github.com/marcofugaro)'s [threejs-modern-app](https://github.com/marcofugaro/threejs-modern-app) framework.

## Prerequisites

- [Yarn](https://yarnpkg.com/) - if you want to use [npm](https://npmjs.com), you will need to reconfigure the scripts in `package.json`

**Note:** This project has only been tested on Windows 10 and none of the scripts are set up to be cross-platform yet.

## Usage

Once you have installed the dependencies by running `yarn`, these are the available commands:

- `yarn start` starts a server locally and launches the browser - any changes will be hot-reloaded, for rapid iteration
- `yarn build` builds the project for production, ready to be deployed from the `build/` folder
- `yarn deploy` builds and pushes the contents of build folder to a `gh-pages` branch on this repository

All the build tools logic is in the `package.json` and `webpack.config.js`.

Read the full [threejs-modern-app documentation](https://github.com/marcofugaro/threejs-modern-app) for a more in-depth guide.

## Credits

- The environment reflection map is a free CC0 HDRI image from [hdrihaven.com](https://hdrihaven.com/)
