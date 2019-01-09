const transpile = require('./index')
const Vue = require('vue')
const { compile } = require('vue-template-compiler')

process.env.BAR = 'bar'

test('should work', () => {
  const res = compile(`
    <div>
      <div>{{ foo }} {{ process.env.BAR }}</div>
      <div v-for="{ name } in items">{{ name }}</div>
    </div>
  `)

  const toFunction = code => {
    code = transpile(`function render(){${code}}`)
    code = code.replace(/^function render\(\)\{|\}$/g, '')
    return new Function(code)
  }

  const vm = new Vue({
    data: {
      foo: 'hello',
      items: [
        { name: 'foo' },
        { name: 'bar' }
      ]
    },
    render: toFunction(res.render),
    staticRenderFns: res.staticRenderFns.map(toFunction)
  }).$mount()

  expect(vm.$el.innerHTML).toMatch(`<div>hello bar</div> <div>foo</div><div>bar</div>`)
})
