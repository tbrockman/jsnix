# [jsnix](https://github.com/tbrockman/jsnix)

is a wrapper around [stackblitz/webcontainers](https://github.com/stackblitz/webcontainer-core), combined with some utility functions, whichs allows you to run Node.js in the browser with the typical editor ([`monaco-editor`](https://microsoft.github.io/monaco-editor/)) and terminal ([`xterm.js`](https://xtermjs.org/)) combo, but with a bit less setup and more of a focus on terminal interactivity.

It has nothing to do with `nix` (nor `jslinux`), it isn't POSIX-compliant, and really isn't all that Unix-like (I just liked the name).

You shouldn't use this for anything serious, and any usage is subject to the underlying [WebContainers license](https://webcontainers.io/enterprise).

## Getting started

### Install

```sh
npm i @jsnix/react
```

### Import

```tsx
import { Jsnix } from '@jsnix/react'
```

### Usage

```tsx
export default function App() {
    const filesystem = {
        'index.js': {
            file: {
                contents: `console.log("Hello, world!");`,
            },
        },
    }

    return <Jsnix fs={filesystem} />
}
```

## Creating a filesystem snapshot

`@jsnix/utils` provides functionality to create a WebContainer snapshot from a specified path ([default options](packages/utils/snapshot.ts#L72)).

### [`vite`](packages/utils/vite.ts) / [`esbuild`](packages/utils/esbuild.ts)

Create the snapshot:

```js
// vite.config.js
import { defineConfig } from 'vite'
import { snapshot } from '@jsnix/utils/vite'

export default function getConfig() {
    return defineConfig({
        plugins: [
            snapshot()
        ],
    })
}
```

or

```js
// esbuild.config.js
import * as esbuild from 'esbuild'
import { snapshot } from '@jsnix/utils/esbuild'

esbuild.build({
    entryPoints: ['src/App.tsx'],
    outdir: 'dist',
    plugins: [
        snapshot()
    ],
})
```

Then, reference it in your code:

```tsx
import { Jsnix } from "@jsnix/react"
import snapshot from 'virtual:@jsnix/snapshot'

export default function App() {

    return (
        <Jsnix
            fs={snapshot}
        />
    )
}
```


### Custom

If you're not using `esbuild` or `vite`, you can still use the provided [`takeSnapshot`](packages/utils/snapshot.ts#L93) function to integrate it into whatever build process you use (you'll just have to figure out your own way of referencing the snapshot in your code. `hint`: you can store the resulting snapshot using `JSON.stringify()`).

```ts
// whatever.js
import { takeSnapshot } from '@jsnix/utils'

const snapshot = await takeSnapshot()

// ... the rest is up to you!
```

See ["Working with the File System"](https://webcontainers.io/guides/working-with-the-file-system) in the WebContainers documentation for more information on the WebContainer filesystem.

## Contributing

I make no guarantee that I will ever acknowledge or respond to any particular bugs, issues, or feature requests (but you are welcome to try).
