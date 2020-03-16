import babel from 'rollup-plugin-babel'
import { terser } from "rollup-plugin-terser"
const babelConfig = require('./babel.config')

const config = [
    {
        input: 'src/Chatroom.js',
        plugins: [ 
			babel(babelConfig),
			terser()
		],
        output: { file: 'build/Chatroom.js', format: 'cjs' }
    }
]
export default config