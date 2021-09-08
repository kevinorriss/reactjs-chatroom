import { babel } from '@rollup/plugin-babel'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import commonjs from '@rollup/plugin-commonjs';
import peerDepsExternal from 'rollup-plugin-peer-deps-external'
import postcss from 'rollup-plugin-postcss'
import { terser } from 'rollup-plugin-terser'
import path from 'path'
import pkg from './package.json'

const config = [
    {
        input: 'src/Chatroom.js',
        output: {
            file: 'dist/index.js',
            sourcemap: true,
            format: 'esm'
        },
        plugins: [
            peerDepsExternal(),
            nodeResolve({ browser: true }),
            commonjs({ include: ["node_modules/**"] }),
            babel({
                babelHelpers: "inline",
                include: ["src/**/*.js", "node_modules/**"],
                presets: ["@babel/preset-react", "@babel/preset-env"]
            }),
            postcss({
                extract: path.resolve('dist/styles.css')
            }),
            terser()
		],
        external: Object.keys(pkg.peerDependencies)
    }
]
export default config