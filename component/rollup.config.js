import babel from 'rollup-plugin-babel'
import postcss from 'rollup-plugin-postcss'
import { terser } from "rollup-plugin-terser"
const babelConfig = require('./babel.config')

const config = [
    {
        input: 'src/Chatroom.js',
        plugins: [ 
            babel(babelConfig),
            postcss({ extensions: ['.css'] }),
			terser()
		],
        output: { file: 'build/Chatroom.js', format: 'cjs' }
    }
]
export default config