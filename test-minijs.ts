/**
 * MiniJS Test Runner
 *
 * Tests the .minijs files by compiling and evaluating them.
 */

import { readFileSync } from 'node:fs'
import { compile, compileToSExpr } from './mini.js/src'
import { stringify } from './seval.js/src'

const files = [
    'a2ui-demo/src/data/calculator.minijs',
    'a2ui-demo/src/data/showcase.minijs',
    'a2ui-demo/src/data/vocabulary.minijs',
]

for (const file of files) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`Testing: ${file}`)
    console.log('='.repeat(60))

    try {
        const source = readFileSync(file, 'utf-8')
        console.log('\n--- Source (first 200 chars) ---')
        console.log(source.substring(0, 200) + '...')

        console.log('\n--- Compiling to S-expression ---')
        const sexpr = compileToSExpr(source)
        console.log(stringify(sexpr))

        console.log('\n--- Evaluating ---')
        const env = {}
        const result = compile(source, env)
        console.log('Result:', result)

        console.log('\n--- Defined functions ---')
        const funcs = Object.keys(env).filter(k => typeof env[k] === 'object' && env[k] !== null)
        console.log(funcs.join(', '))

        console.log('\n✅ Success!')
    } catch (error) {
        console.log('\n❌ Error:', error)
    }
}
